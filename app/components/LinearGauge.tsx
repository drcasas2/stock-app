import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Props will be added later when implementing the actual gauge
interface LinearGaugeProps {}

const LinearGauge: React.FC<LinearGaugeProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Linear Gauge Area</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up all available space in the parent (GaugeCard's gaugeContainer)
    width: '100%', // Ensure it stretches horizontally
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2f7', // Light blue background for visibility
    borderRadius: 5,
  },
  placeholderText: {
    fontSize: 12,
    color: '#0077cc',
  },
});

export default LinearGauge;

