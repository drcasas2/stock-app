import { StyleSheet, Text, View, SafeAreaView, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TierRow from "./components/TierRow";
import { Tier } from "./types/tier";
import { Ionicons } from "@expo/vector-icons";

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

  // Add new state for tiers
  const [tiers, setTiers] = useState<Tier[]>([]);

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
      if (savedTiers) setTiers(JSON.parse(savedTiers));
    } catch (error) {
      console.error('Error loading saved values:', error);
    }
  };

  const formatNumberInput = (value: string): string => {
    // Remove all non-numeric characters
    let cleanValue = value.replace(/[^0-9]/g, '');
    
    // Don't format if empty
    if (cleanValue === '') return '';
    
    // Convert to number and divide by 100 to handle decimal places
    const number = parseFloat(cleanValue) / 100;
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const handleCashBalanceChange = (text: string) => {
    // Remove all non-numeric characters
    const rawValue = text.replace(/[^0-9]/g, '');
    setCashBalance(rawValue);
    AsyncStorage.setItem('cashBalance', rawValue);
  };

  const handleProjectedPriceChange = (text: string) => {
    // Remove all non-numeric characters
    const rawValue = text.replace(/[^0-9]/g, '');
    setProjectedPrice(rawValue);
    AsyncStorage.setItem('projectedPrice', rawValue);
  };

  // Update handleAddTier to include animation
  const handleAddTier = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newTier: Tier = {
      id: Date.now().toString(),
      stockPrice: '',
      quantity: '',
      isVisible: true,
    };
    setTiers([...tiers, newTier]);
  };

  // Handler for updating tier values
  const handleUpdateTier = (id: string, stockPrice: string, quantity: string) => {
    const updatedTiers = tiers.map(tier => 
      tier.id === id ? { ...tier, stockPrice, quantity } : tier
    );
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  // Handler for toggling tier visibility
  const handleToggleVisibility = (id: string) => {
    const updatedTiers = tiers.map(tier =>
      tier.id === id ? { ...tier, isVisible: !tier.isVisible } : tier
    );
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  // Update handleDeleteTier to use a custom configuration
  const handleDeleteTier = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    const updatedTiers = tiers.filter(tier => tier.id !== id);
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.content}>
            {/* Header section with inputs */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tier Simulator</Text>
              
              {/* Total Cash to Invest Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Total Cash to Invest:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total cash amount"
                  keyboardType="numeric"
                  value={formatNumberInput(cashBalance)}
                  onChangeText={handleCashBalanceChange}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  enablesReturnKeyAutomatically={true}
                />
              </View>

              {/* Projected Price Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Projected Price:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter projected price"
                  keyboardType="numeric"
                  value={formatNumberInput(projectedPrice)}
                  onChangeText={handleProjectedPriceChange}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  enablesReturnKeyAutomatically={true}
                />
              </View>

              {/* Calculations Display */}
              <View style={styles.calculationsContainer}>
                {/* New Remaining Cash Balance Row */}
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
            </View>

            {/* Tiers Section */}
            <View style={styles.tiersSection}>
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

              {/* Add Column Headers */}
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

              {/* Tier List */}
              <View style={styles.tierList}>
                {tiers.map((tier) => (
                  <TierRow
                    key={tier.id}
                    id={tier.id}
                    stockPrice={tier.stockPrice}
                    quantity={tier.quantity}
                    isVisible={tier.isVisible}
                    totalCost="$0.00"
                    onUpdateTier={handleUpdateTier}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDeleteTier}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
  content: {
    flex: 1,
  },
  tiersSection: {
    padding: 20,
    backgroundColor: '#fff',
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
  },
  tierList: {
    marginTop: 10,
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
    width: 34, // Match the width of the visibility button
  },
  deleteColumn: {
    width: 34, // Match the width of the delete button
  },
  tierInputColumns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    paddingRight: 8, // Add padding to align with TierRow inputs
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: '30%',
  },
  totalHeader: {
    textAlign: 'right',
    paddingRight: 8, // Adjust the Total Cost alignment
  },
}); 