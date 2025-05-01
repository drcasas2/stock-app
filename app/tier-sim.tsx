import { StyleSheet, Text, View, SafeAreaView, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Pressable, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, Animated, Dimensions, findNodeHandle } from "react-native";
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const tierRowRefs = useRef<{ [key: string]: View | null }>({});

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
         // Ensure isVisible defaults to true if missing from storage
         setTiers(parsedTiers.map((t: Partial<Tier> & {id: string}) => ({
             ...t,
             stockPrice: t.stockPrice || '',
             quantity: t.quantity || '',
             isVisible: t.isVisible !== undefined ? t.isVisible : true,
         })));
      } else {
        // Initialize with one empty tier if nothing is saved
        handleAddTier();
      }
    } catch (error) {
      console.error('Error loading saved values:', error);
      // Initialize with one empty tier on error
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
    // Prepend new tier to the top for better UX
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Use simple preset
    const updatedTiers = tiers.filter(tier => tier.id !== id);
    setTiers(updatedTiers);
    AsyncStorage.setItem('tiers', JSON.stringify(updatedTiers));
  };

  // --- Keyboard and Scrolling Logic ---
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', // Use willShow on iOS for better timing
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleTierInputFocus = (tierId: string) => {
    const tierNode = tierRowRefs.current[tierId];
    const scrollViewNode = scrollViewRef.current;

    // Check if nodes exist and keyboard is actually visible and ScrollView has height
    if (tierNode && scrollViewNode && keyboardHeight > 0 && scrollViewHeight > 0) {
      const nativeTierNodeHandle = findNodeHandle(tierNode);
      const nativeScrollViewNodeHandle = findNodeHandle(scrollViewNode);

      // Ensure node handles are valid before measuring
      if (nativeTierNodeHandle && nativeScrollViewNodeHandle) {
        // Use setTimeout to allow layout to stabilize after keyboard appears/scrolls
        setTimeout(() => {
          UIManager.measureLayout(
            nativeTierNodeHandle,        // Node to measure
            nativeScrollViewNodeHandle,  // Ancestor to measure relative to
            (error) => { console.error("UIManager.measureLayout failed:", error); }, // Error callback
            (x, y, width, height) => { // Success callback (x, y relative to ScrollView content)
              
              // --- CONFIGURATION ---
              // Adjust this value for the desired space between the input row and the keyboard
              const PADDING_ABOVE_KEYBOARD = 10; // <--- EDIT THIS PADDING VALUE (e.g., 5, 10, 15)
              // --- END CONFIGURATION ---

              const currentScrollY = scrollY._value || 0;

              // Calculate the Row's absolute top/bottom positions within the ScrollView's content
              const rowAbsoluteTop = y;
              const rowAbsoluteBottom = y + height;

              // Calculate the boundaries of the currently visible area within the ScrollView frame
              const visibleAreaTopY = currentScrollY; // Top of the viewport corresponds to current scroll offset
              const visibleAreaBottomY = currentScrollY + scrollViewHeight - keyboardHeight; // Top of keyboard

              // --- Check if the Row is Already Fully Visible ---
              // Is the row's top edge below the visible top AND the row's bottom edge above the visible bottom?
              // Add a small tolerance (e.g., 1 pixel) for potential floating point rounding issues
              const isFullyVisible = 
                  rowAbsoluteTop >= visibleAreaTopY - 1 && 
                  rowAbsoluteBottom <= visibleAreaBottomY + 1;

              // --- Only Scroll if NOT Already Fully Visible ---
              if (!isFullyVisible) {
                let scrollToY: number | null = null;

                // Check if the bottom of the row is hidden below the keyboard
                if (rowAbsoluteBottom > visibleAreaBottomY) {
                  // Calculate the scroll position needed to place the row's bottom edge
                  // exactly PADDING_ABOVE_KEYBOARD pixels above the keyboard top (visibleAreaBottomY)
                  scrollToY = rowAbsoluteBottom - (scrollViewHeight - keyboardHeight) + PADDING_ABOVE_KEYBOARD;

                // Check if the top of the row is hidden above the current view
                } else if (rowAbsoluteTop < visibleAreaTopY) {
                   // Calculate the scroll position needed to bring the row's top edge into view
                   // (We'll scroll it just to the top edge, could add padding if desired)
                   scrollToY = rowAbsoluteTop;
                }
                
                // Ensure scrollToY is calculated and is different from current scroll
                // (Avoids redundant scrolls if calculation somehow results in current position)
                // Also ensure we don't scroll past the top (less than 0)
                if (scrollToY !== null && Math.abs(scrollToY - currentScrollY) > 1) {
                   scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollToY), animated: true });
                }
              }
              // else { console.log("Row already visible. No scroll needed."); }
            }
          );
        }, Platform.OS === 'android' ? 100 : 0); // Delay for measurement stability
      } else {
          console.warn("Could not find native handles for measurement in handleTierInputFocus.");
      }
    }
  };
  // --- End Keyboard and Scrolling Logic ---

  // Calculate all values whenever tiers, cashBalance, or projectedPrice changes
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

  // Animate Font Size
  const headerFontSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [24, 18], // Start larger, end smaller (adjust as needed)
    extrapolate: 'clamp'
  });
  
  // Animate Header Padding (Split into Top and Bottom)
  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 100 * 0.75], // Match previous timing
    outputRange: [20, 0], // Start with 20, end with 0
    extrapolate: 'clamp'
  });

  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 100 * 0.75], // Match previous timing
    outputRange: [20, 10], // Start with 20, end with 10
    extrapolate: 'clamp'
  });

  // Animate Bottom Margin (reduce bottom margin to tighten space)
  const headerMarginBottom = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0], // Reduce margin below title (adjust as needed)
    extrapolate: 'clamp'
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          {/* Apply Padding to the Header View */}
          <Animated.View style={[
            styles.header,
            {
              paddingTop: headerPaddingTop, // Use separate top padding
              paddingBottom: headerPaddingBottom, // Use separate bottom padding
            }
          ]}>
            {/* Apply Font Size and Margin to the Header Text */}
            <Animated.Text style={[
              styles.headerTitle,
              {
                fontSize: headerFontSize, // Animated font size
                marginBottom: headerMarginBottom // Animated margin
              }
            ]}>
              Tier Simulator
            </Animated.Text>
            {/* Add Link to Settings */} 
            {/* @ts-ignore // Ignore Href type mismatch until router types update */}
            {/* <Link href={'/settings'} style={styles.settingsLink}>
              <Text>Go to Settings</Text>
            </Link> */}
          </Animated.View>

          {/* Main container that scrolls until calculations section */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.mainScrollView}
            stickyHeaderIndices={[1]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false } // Must be false for layout props like padding/margin
            )}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setScrollViewHeight(height);
            }}
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 }}
          >
            {/* Header and Input Fields */}
            <View>
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
            </View>

            {/* Fixed Calculations and Tiers Header */}
            <View style={styles.fixedSection}>
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

            {/* Tiers List ScrollView*/}
            <ScrollView
              ref={scrollViewRef} // Keep ref if needed for focusing, might need adjustment
              style={styles.tiersListScrollView} // New style
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.tierList}>
                {tiers.map((tier) => (
                  <TierRow
                    ref={(el) => (tierRowRefs.current[tier.id] = el)}
                    key={tier.id}
                    id={tier.id}
                    stockPrice={tier.stockPrice}
                    quantity={tier.quantity}
                    isVisible={tier.isVisible}
                    totalCost="$0.00" // Note: This calculation might need adjustment if done in TierRow
                    onUpdateTier={handleUpdateTier}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDeleteTier}
                    onInputFocus={handleTierInputFocus} // This focus logic might need review
                  />
                ))}
              </View>
            </ScrollView>
          </ScrollView>
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
    paddingHorizontal: 20, // Keep static horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff', // Ensure background for overlap
    zIndex: 10 // Keep header above content during animation
  },
  headerTitle: {
    // fontSize: 28, // Initial size set by animation
    fontWeight: 'bold',
    // marginBottom: 10, // Initial margin set by animation
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
  tiersSection: {
    flex: 1,
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
    marginLeft: 20,
  },
  tierListContainer: {
    flex: 1,
  },
  tierList: {
    paddingHorizontal: 20, // Keep horizontal padding consistent
    paddingTop: 10,
    paddingBottom: 20, // Add padding at the bottom of the list
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
    textAlign: 'center',
  },
  totalHeader: {
    textAlign: 'right',
    paddingRight: 8, // Adjust the Total Cost alignment
  },
  mainScrollView: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 1,
    // Add shadow for better visual separation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  stickyTiersHeader: {
    backgroundColor: '#fff',
    zIndex: 1,
    paddingHorizontal: 15, // Keep horizontal padding
    paddingTop: 15, // Add padding if needed
    paddingBottom: 10, // Add padding if needed
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Add shadow for better visual separation if desired (copied from previous attempt)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  fixedSection: {
    backgroundColor: '#fff',
  },
  tiersListScrollView: { // New style for the tiers ScrollView
    flex: 1, // Allows it to take remaining space
    backgroundColor: '#fff', // Match background
  },
  settingsLink: {
    position: 'absolute', // Position independently within the header
    right: 20,
    top: 25, // Adjust based on padding/appearance
    padding: 5,
  },
}); 