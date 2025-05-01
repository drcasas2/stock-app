import React, { useState, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Keyboard, Animated, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TierRowProps {
  id: string;
  stockPrice: string;
  quantity: string;
  isVisible: boolean;
  onUpdateTier: (id: string, stockPrice: string, quantity: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onFocusProp: (id: string) => void;
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
  }).format(number || 0);
};

const TierRow = forwardRef((
  {
    id,
    stockPrice,
    quantity,
    isVisible,
    onUpdateTier,
    onToggleVisibility,
    onDelete,
    onFocusProp,
  }: TierRowProps,
  ref
) => {
  const [localStockPrice, setLocalStockPrice] = useState(stockPrice);
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const componentRef = useRef<View>(null);

  useImperativeHandle(ref, () => componentRef.current);

  useEffect(() => {
    setLocalStockPrice(stockPrice);
  }, [stockPrice]);

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const calculatedTotalCost = useMemo(() => {
    if (!localStockPrice || !localQuantity) return '$0.00';

    const priceNum = parseFloat(localStockPrice) / 100 || 0;
    const quantityNum = parseInt(localQuantity, 10) || 0;

    const total = priceNum * quantityNum;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total);
  }, [localStockPrice, localQuantity]);

  const handleStockPriceChange = (text: string) => {
    const rawValue = text.replace(/[^0-9]/g, '');
    setLocalStockPrice(rawValue);
    onUpdateTier(id, rawValue, localQuantity);
  };

  const handleQuantityChange = (text: string) => {
    const rawValue = text.replace(/[^0-9]/g, '');
    setLocalQuantity(rawValue);
    onUpdateTier(id, localStockPrice, rawValue);
  };

  return (
    <View ref={componentRef} style={styles.tierRow}>
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
          onFocus={() => onFocusProp(id)}
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
          onFocus={() => onFocusProp(id)}
        />
        <Text style={[styles.tierTotal, !isVisible && styles.tierTotalDisabled]}>
          {calculatedTotalCost}
        </Text>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </Pressable>
    </View>
  );
});

export default TierRow;

const styles = StyleSheet.create({
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  visibilityButton: {
    padding: 5,
    marginRight: 5,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 5,
  },
  tierInputs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '30%',
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
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
    paddingHorizontal: 5,
  },
  tierTotalDisabled: {
    color: '#999',
  },
}); 