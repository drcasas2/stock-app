import { StyleSheet, Text, View, SafeAreaView, TextInput, Keyboard, TouchableWithoutFeedback, Pressable, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, Animated, FlatList, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TierRow from "./components/TierRow";
import { Tier } from "../types/tier";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import DropdownMenu from './components/DropdownMenu';
import { NavigationOption } from './components/DropdownMenu';

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
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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
    const updatedTiers = [...tiers, newTier];
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
    outputRange: [10, 0],
    extrapolate: 'clamp'
  });

  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 100 * 0.75],
    outputRange: [10, 5],
    extrapolate: 'clamp'
  });

  // Add headerBorder interpolation (same as dashboard)
  const headerBorder = scrollY.interpolate({
      inputRange: [0, 10],
      outputRange: [0, 1],
      extrapolate: 'clamp'
  });

  // Keep base icon sizes
  const iconSizeLarge = 28;
  const iconSizeSmall = 24;
  const bellSizeLarge = 24;
  const bellSizeSmall = 20;
  const avatarSizeLarge = 28;
  const avatarSizeSmall = 24;

  // ADD interpolations for SCALE
  const iconScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, iconSizeSmall / iconSizeLarge], // Scale down from 1
    extrapolate: 'clamp'
  });

  const bellScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, bellSizeSmall / bellSizeLarge], // Scale down from 1
    extrapolate: 'clamp'
  });

  // Keep avatar size and borderRadius interpolations
  const avatarSize = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [avatarSizeLarge, avatarSizeSmall],
      extrapolate: 'clamp'
  });

  const avatarBorderRadius = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [avatarSizeLarge / 2, avatarSizeSmall / 2],
      extrapolate: 'clamp'
  });

  // FlatList data
  const data = [{ type: 'inputs' }, { type: 'calculations' }, ...tiers];

  // Navigation options for the dropdown menu
  const navigationOptions: NavigationOption[] = [
    { label: 'Home', iconName: 'home-outline', onPress: () => router.push('/') },
    { label: 'Dashboard', iconName: 'speedometer-outline', onPress: () => router.push('/dashboard') },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <Animated.View style={[
            styles.header,
            {
              paddingTop: headerPaddingTop,
              paddingBottom: headerPaddingBottom,
              // Apply animated border width
              borderBottomWidth: headerBorder,
            }
          ]}>
            <Pressable onPress={() => setIsMenuVisible(true)} style={styles.headerIconContainer}>
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <Ionicons 
                  name="menu-outline" 
                  size={iconSizeLarge}
                  color="#333" 
                />
              </Animated.View>
            </Pressable>

            <View style={styles.headerTitleContainer}>
              <Animated.Text style={[
                styles.headerTitle,
                {
                  fontSize: headerFontSize,
                }
              ]}>
                Tier Simulator
              </Animated.Text>
            </View>

            <View style={styles.headerRightContainer}>
              <Pressable onPress={() => console.log('Bell Pressed')} style={styles.headerIconContainer}>
                <Animated.View style={{ transform: [{ scale: bellScale }] }}>
                  <Ionicons 
                    name="notifications-outline" 
                    size={bellSizeLarge}
                    color="#333" 
                  />
                </Animated.View>
              </Pressable>
              <Pressable onPress={() => console.log('Avatar Pressed')} style={styles.headerIconContainer}>
                <Animated.View style={[
                  styles.avatarPlaceholder,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarBorderRadius
                  }
                ]} />
              </Pressable>
            </View>
          </Animated.View>

          <FlatList
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

          {/* Dropdown Menu */}
          <DropdownMenu
            isVisible={isMenuVisible}
            onClose={() => setIsMenuVisible(false)}
            navigationOptions={navigationOptions}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10,
    position: 'relative',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 50,
    right: 50,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
    marginLeft: 8,
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
});