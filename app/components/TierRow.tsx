import { StyleSheet, Text, View, TextInput, Pressable, Keyboard, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TierRowProps {
  id: string;
  stockPrice: string;
  quantity: string;
  isVisible: boolean;
  totalCost: string;
  onUpdateTier: (id: string, stockPrice: string, quantity: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
}

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

export default function TierRow({
  id,
  stockPrice,
  quantity,
  isVisible,
  totalCost,
  onUpdateTier,
  onToggleVisibility,
  onDelete,
}: TierRowProps) {
  const [localStockPrice, setLocalStockPrice] = useState(stockPrice);
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [slideAnim] = useState(new Animated.Value(-50)); // Start from above

  // Slide down animation when component mounts
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate total cost
  const calculateTotalCost = (): string => {
    if (!localStockPrice || !localQuantity) return '$0.00';
    
    // Convert price from cents to dollars (divide by 100)
    const priceInDollars = parseFloat(localStockPrice) / 100;
    // Convert quantity to number
    const quantityNumber = parseInt(localQuantity, 10);
    
    // Calculate total
    const total = priceInDollars * quantityNumber;

    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total);
  };

  const handleStockPriceChange = (text: string) => {
    // Remove all non-numeric characters
    const rawValue = text.replace(/[^0-9]/g, '');
    setLocalStockPrice(rawValue);
    onUpdateTier(id, rawValue, quantity);
  };

  const handleQuantityChange = (text: string) => {
    // Remove all non-numeric characters
    const rawValue = text.replace(/[^0-9]/g, '');
    setLocalQuantity(rawValue);
    onUpdateTier(id, stockPrice, rawValue);
  };

  return (
    <Animated.View style={[
      styles.tierRow,
      {
        transform: [{
          translateY: slideAnim
        }]
      },
    ]}>
      <Pressable
        style={styles.visibilityButton}
        onPress={() => onToggleVisibility(id)}
      >
        <Ionicons
          name={isVisible ? "eye-outline" : "eye-off-outline"}
          size={24}
          color={isVisible ? "#007AFF" : "#999"}
        />
      </Pressable>

      <View style={styles.tierInputs}>
        <TextInput
          style={[styles.tierInput, !isVisible && styles.tierInputDisabled]}
          placeholder="Price"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={formatNumberInput(localStockPrice)}
          onChangeText={handleStockPriceChange}
          editable={isVisible}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          enablesReturnKeyAutomatically={true}
        />
        <TextInput
          style={[styles.tierInput, !isVisible && styles.tierInputDisabled]}
          placeholder="Qty"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={localQuantity}
          onChangeText={handleQuantityChange}
          editable={isVisible}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          enablesReturnKeyAutomatically={true}
        />
        <Text style={[styles.tierTotal, !isVisible && styles.tierTotalDisabled]}>
          {calculateTotalCost()}
        </Text>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  visibilityButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  tierInputs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  tierInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    width: '30%',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  tierInputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    color: '#999',
  },
  tierTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    width: '30%',
    textAlign: 'right',
  },
  tierTotalDisabled: {
    color: '#999',
  },
}); 