import { StyleSheet, Text, View, SafeAreaView, TextInput, Keyboard, TouchableWithoutFeedback, Pressable, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, Animated, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TierRow from "./components/TierRow";
import { Tier } from "./types/tier";
import { Ionicons } from "@expo/vector-icons";
import { Link } from 'expo-router';

interface TopLevelCalculations {
  averageSharePrice: number;
  potentialGain: number;
  potentialPercentage: number;
  remainingBalance: number;
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TierSimScreen() {
  // Top-level state
  const [cashBalance, setCashBalance] = useState<string>('');
  const [projectedPrice, setProjectedPrice] = useState<string>('');
  const [tiers, setTiers] = useState<Tier[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Formatted display values
  const formattedCashBalance = useMemo(() => {
    return cashBalance ? 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(cashBalance))
      : '';
  }, [cashBalance]);

  const formattedProjectedPrice = useMemo(() => {
    return projectedPrice ? 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(projectedPrice))
      : '';
  }, [projectedPrice]);

  const [calculations, setCalculations] = useState<TopLevelCalculations>({
    averageSharePrice: 0,
    potentialGain: 0,
    potentialPercentage: 0,
    remainingBalance: 0,
  });

  // Load saved values when component mounts
  useEffect(() => {
    loadSavedValues();
  }, []);

  const loadSavedValues = async () => {
    try {
      const savedCashBalance = await AsyncStorage.getItem('cashBalance');
      const savedProjectedPrice = await AsyncStorage.getItem('projectedPrice');
      const savedTiers = await AsyncStorage.getItem('tiers');
      
      if (savedCashBalance) setCashBalance(savedCashBalance);
      if (savedProjectedPrice) setProjectedPrice(savedProjectedPrice);
      if (savedTiers) {
         const parsedTiers = JSON.parse(savedTiers);
         setTiers(parsedTiers.map((t: Partial<Tier> & {id: string}) => ({
             ...t,
             stockPrice: t.stockPrice || '',
             quantity: t.quantity || '',
             isVisible: t.isVisible !== undefined ? t.isVisible : true,
         })));
      } else {
        handleAddTier();
      }
    } catch (error) {
      console.error('Error loading saved values:', error);
      handleAddTier();
    }
  };

  const formatNumberInput = (value: string): string => {
    let cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === '') return '';
    const number = parseFloat(cleanValue) / 100;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number || 0);
  };

  const handleCashBalanceChange = (text: string) => {
    const rawValue = text.replace(/[^0-9]/g, '');
    setCashBalance(rawValue);
    AsyncStorage.setItem('cashBalance', rawValue);
  };

  const handleProjectedPriceChange = (text: string) => {
    const rawValue = text.replace(/[^0-9]/g, '');
    setProjectedPrice(rawValue);
    AsyncStorage.setItem('projectedPrice', rawValue);
  };

  const handleAddTier = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newTier: Tier = {
      id: Date.now().toString(),
      stockPrice: '',
      quantity: '',
      isVisible: true,
    };
    const updatedTiers = [newTier, ...tiers];
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  const handleUpdateTier = (id: string, stockPrice: string, quantity: string) => {
    const updatedTiers = tiers.map(tier =>
      tier.id === id ? { ...tier, stockPrice, quantity } : tier
    );
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  const handleToggleVisibility = (id: string) => {
    const updatedTiers = tiers.map(tier =>
      tier.id === id ? { ...tier, isVisible: !tier.isVisible } : tier
    );
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  const handleDeleteTier = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedTiers = tiers.filter(tier => tier.id !== id);
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  // Scroll handler for Tier focus
  const handleTierFocus = (tierId: string) => {
    if (!flatListRef.current) return;

    // Find index in the main data array (inputs + calculations + tiers)
    const tierIndexInData = data.findIndex(item => !('type' in item) && (item as Tier).id === tierId);

    if (tierIndexInData !== -1) {
      flatListRef.current.scrollToIndex({ 
        index: tierIndexInData, 
        animated: true, 
        viewPosition: 0 // Position item at the top of the visible area
      });
    }
  };

  // Calculate values
  useEffect(() => {
    const calculateValues = () => {
      const totalCash = parseFloat(cashBalance) / 100 || 0;
      const projectedPriceNum = parseFloat(projectedPrice) / 100 || 0;
      const visibleTiers = tiers.filter(tier => tier.isVisible);
      let totalSpent = 0;
      let totalShares = 0;

      visibleTiers.forEach(tier => {
        const price = parseFloat(tier.stockPrice) / 100 || 0;
        const quantity = parseInt(tier.quantity, 10) || 0;
        totalSpent += price * quantity;
        totalShares += quantity;
      });

      const remainingBalance = totalCash - totalSpent;
      const averageSharePrice = totalShares > 0 ? totalSpent / totalShares : 0;
      const potentialValue = totalShares * projectedPriceNum;
      const potentialGain = potentialValue - totalSpent;
      const potentialPercentage = totalSpent > 0
        ? ((potentialValue - totalSpent) / totalSpent) * 100
        : 0;

      setCalculations({
        averageSharePrice,
        potentialGain,
        potentialPercentage,
        remainingBalance,
      });
    };
    calculateValues();
  }, [tiers, cashBalance, projectedPrice]);

  // Header animations
  const headerFontSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [24, 18],
    extrapolate: 'clamp'
  });

  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 100 * 0.75],
    outputRange: [20, 0],
    extrapolate: 'clamp'
  });

  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 100 * 0.75],
    outputRange: [20, 10],
    extrapolate: 'clamp'
  });

  const headerMarginBottom = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: 'clamp'
  });

  // FlatList data
  const data = [{ type: 'inputs' }, { type: 'calculations' }, ...tiers];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <Animated.View style={[
            styles.header,
            {
              paddingTop: headerPaddingTop,
              paddingBottom: headerPaddingBottom,
            }
          ]}>
            <Animated.Text style={[
              styles.headerTitle,
              {
                fontSize: headerFontSize,
                marginBottom: headerMarginBottom
              }
            ]}>
              Tier Simulator
            </Animated.Text>
            {/* <Link href={'/settings'} style={styles.settingsLink}>
              <Text>Go to Settings</Text>
            </Link> */}
          </Animated.View>

          <FlatList
            ref={flatListRef}
            style={styles.mainScrollView}
            ListHeaderComponent={
              null
            }
            data={data}
            renderItem={({ item, index }) => {
              if ('type' in item && item.type === 'inputs') {
                return (
                  <View style={styles.inputSection}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Total Cash to Invest:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter total cash amount"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={formatNumberInput(cashBalance)}
                        onChangeText={handleCashBalanceChange}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        enablesReturnKeyAutomatically={true}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Projected Price:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter projected price"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={formatNumberInput(projectedPrice)}
                        onChangeText={handleProjectedPriceChange}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        enablesReturnKeyAutomatically={true}
                      />
                    </View>
                  </View>
                );
              } else if ('type' in item && item.type === 'calculations') {
                return (
                  <View style={styles.fixedSection}>
                    <View style={styles.calculationsContainer}>
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Remaining Cash Balance:</Text>
                        <Text style={styles.calculationValue}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(calculations.remainingBalance)}
                        </Text>
                      </View>
                      <View style={[styles.calculationRow, styles.divider]} />
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Average Share Price:</Text>
                        <Text style={styles.calculationValue}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(calculations.averageSharePrice)}
                        </Text>
                      </View>
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Potential Dollar Gain:</Text>
                        <Text style={styles.calculationValue}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(calculations.potentialGain)}
                        </Text>
                      </View>
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Potential Percentage Gain:</Text>
                        <Text style={styles.calculationValue}>
                          {calculations.potentialPercentage.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stickyTiersHeader}>
                      <View style={styles.tiersSectionHeader}>
                        <Text style={styles.tiersSectionTitle}>Purchase Tiers</Text>
                        <Pressable 
                          style={styles.addTierButton}
                          onPress={handleAddTier}
                        >
                          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                          <Text style={styles.addTierText}>Add Tier</Text>
                        </Pressable>
                      </View>
                      <View style={styles.columnHeaders}>
                        <View style={styles.visibilityColumn}>
                          <Text style={styles.columnHeader}></Text>
                        </View>
                        <View style={styles.tierInputColumns}>
                          <Text style={styles.columnHeader}>Price</Text>
                          <Text style={styles.columnHeader}>Quantity</Text>
                          <Text style={[styles.columnHeader, styles.totalHeader]}>Total Cost</Text>
                        </View>
                        <View style={styles.deleteColumn}>
                          <Text style={styles.columnHeader}></Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              } else {
                // Ensure item is treated as Tier here
                const tierItem = item as Tier;
                return (
                  <TierRow
                    key={tierItem.id}
                    id={tierItem.id}
                    stockPrice={tierItem.stockPrice}
                    quantity={tierItem.quantity}
                    isVisible={tierItem.isVisible}
                    onUpdateTier={handleUpdateTier}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDeleteTier}
                    onFocusProp={handleTierFocus}
                  />
                );
              }
            }}
            keyExtractor={(item, index) => {
              if ('type' in item) {
                 return `${item.type}-${index}`;
              }
              // If it's not a typed object, assume it's a Tier and use its id
              const tierItem = item as Tier;
              return tierItem.id;
            }}
            stickyHeaderIndices={[1]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  calculationsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calculationLabel: {
    fontSize: 16,
    color: '#666',
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 10,
  },
  tiersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tiersSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  addTierText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  visibilityColumn: {
    width: 34,
  },
  deleteColumn: {
    width: 34,
  },
  tierInputColumns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    paddingRight: 8,
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: '30%',
    textAlign: 'center',
  },
  totalHeader: {
    textAlign: 'right',
    paddingRight: 8,
  },
  mainScrollView: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stickyTiersHeader: {
    backgroundColor: '#fff',
    zIndex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  fixedSection: {
    backgroundColor: '#fff',
  },
  settingsLink: {
    position: 'absolute',
    right: 20,
    top: 25,
    padding: 5,
  },
});