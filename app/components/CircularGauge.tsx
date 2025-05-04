import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MetricRange, MetricThreshold } from '../../types/gauge'; // Import types

// Define props for the CircularGauge
interface CircularGaugeProps {
  value: number;
  min: number;
  max: number;
  ranges?: MetricRange[];       // Optional for now
  thresholds?: MetricThreshold[]; // Optional for now
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ 
  value, 
  min, 
  max, 
  ranges, 
  thresholds 
}) => {
  
  // Basic validation
  if (min >= max) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Min must be less than Max.</Text>
      </View>
    );
  }

  // Calculate percentage for potential future use (e.g., with SVG)
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={styles.container}>
      {/* Display the current value prominently */}
      <Text style={styles.valueText}>{value.toFixed(2)}</Text>

      {/* Display Min and Max values */}
      <View style={styles.minMaxContainer}>
        <Text style={styles.minMaxText}>Min: {min}</Text>
        <Text style={styles.minMaxText}>Max: {max}</Text>
      </View>

      {/* Placeholder for threshold display if needed */}
      {/* {thresholds && thresholds.map(t => <Text key={t.thresholdId}>T: {t.value}</Text>)} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    width: '100%', 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // Remove placeholder background
    // backgroundColor: '#e8f5e9',
    padding: 10, // Add some internal padding
  },
  valueText: {
    fontSize: 28, // Make value prominent
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10, // Space below the main value
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%', // Don't let min/max text go to the edges
  },
  minMaxText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  // placeholderText: { // Remove old placeholder style
  //   fontSize: 12,
  //   color: '#388e3c',
  // },
});

export default CircularGauge;

