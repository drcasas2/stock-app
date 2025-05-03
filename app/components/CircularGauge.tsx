import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Props will be added later when implementing the actual gauge
interface CircularGaugeProps {}

const CircularGauge: React.FC<CircularGaugeProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Circular Gauge Area</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up all available space in the parent (GaugeCard's gaugeContainer)
    width: '100%', // Ensure it stretches horizontally (important even for circular because of aspectRatio in parent)
    height: '100%', // Ensure it stretches vertically
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e9', // Light green background for visibility
    borderRadius: 5, // Optional: slight rounding inside the card
  },
  placeholderText: {
    fontSize: 12,
    color: '#388e3c',
  },
});

export default CircularGauge;

