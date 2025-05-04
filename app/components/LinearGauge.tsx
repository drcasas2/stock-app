import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { MetricRange, MetricThreshold } from '../../types/gauge'; // Import types
import useGaugeLogic from '../hooks/useGaugeLogic'; // Corrected Import Path

// Define props for the LinearGauge
interface LinearGaugeProps {
  value: number;
  min: number;
  max: number;
  ranges?: MetricRange[];       
  thresholds?: MetricThreshold[]; 
}

// Wrap relevant Views with Animated.View
const AnimatedView = Animated.View;

const LinearGauge: React.FC<LinearGaugeProps> = ({ 
  value, 
  min, 
  max, 
  ranges,       // Destructure ranges
  thresholds    // Destructure thresholds
}) => {

  // Call the custom hook, passing thresholds and ranges
  const { 
    isValid, 
    valuePercent, 
    anchorPercent, 
    thresholdsPercent, // Destructure thresholdsPercent
    scenario 
  } = useGaugeLogic(value, min, max, thresholds, ranges); // Pass props to hook

  // Initialize animated shared value at the anchor point
  const animatedValuePercent = useSharedValue(anchorPercent);

  // Trigger the spring animation when valuePercent changes
  useEffect(() => {
    if (isValid) {
      animatedValuePercent.value = withSpring(valuePercent, { 
          damping: 15, 
          stiffness: 100,
          mass: 1, 
      });
    }
    // Initialize to anchor point if it changes (e.g. scenario changes)
    else {
        animatedValuePercent.value = anchorPercent; 
    }
  }, [valuePercent, anchorPercent, isValid, animatedValuePercent]); // Added anchorPercent dependency

  // Basic validation - use the isValid flag from the hook
  if (!isValid) {
    return (
      <View style={styles.container}> // Use regular View for error
        <Text style={styles.errorText}>Invalid min/max range.</Text>
      </View>
    );
  }

  // --- Define Animated Styles --- 

  const valueBarStyle = useAnimatedStyle(() => {
    const currentPercent = animatedValuePercent.value;
    const startPercent = Math.min(anchorPercent, currentPercent);
    const endPercent = Math.max(anchorPercent, currentPercent);
    const widthPercent = endPercent - startPercent;

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
    };
  });

  const needleStyle = useAnimatedStyle(() => {
    return {
      left: `${animatedValuePercent.value}%`,
      // Add transform to center the needle (width is 4, so shift left by 2)
      transform: [{ translateX: -2 }],
    };
  });

  const textContainerStyle = useAnimatedStyle(() => {
    return {
      left: `${animatedValuePercent.value}%`,
      // Apply transform to center the container (adjust -25 value as needed)
      transform: [{ translateX: -25 }], 
    };
  });

  return (
    // Use regular View for the main container
    <View style={styles.container}>
      {/* Background bar representing the full range (static) */}
      <View style={styles.gaugeBackground} />
      
      {/* Foreground bar representing the current value (Animated) */}
      <AnimatedView style={[styles.valueBar, valueBarStyle]} /> 

      {/* Value Needle (Animated) */}
      <AnimatedView style={[styles.valueNeedle, needleStyle]} />

      {/* Optional: Display Threshold markers (Static for now) */}
      {thresholdsPercent.map(threshold => {
        // No need to check percentage validity here, hook already filtered
        return (
          <View 
            key={`thresh-${threshold.id}`}
            style={[styles.thresholdMarker, { left: `${threshold.percent}%` }]}
          />
        );
      })}

      {/* Container for the value text (Animated) */}
      <AnimatedView 
        style={[
          styles.valueTextContainer,
          textContainerStyle // Apply animated style
        ]}
      >
         <Text style={styles.valueText}>
            {value.toFixed(2)}
         </Text> 
      </AnimatedView>

      {/* Display Min and Max Value Text (static) */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{min}</Text>
        <Text style={styles.labelText}>{max}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%', // Use most of the card width
    height: 50,   // Set a fixed height for the gauge area
    justifyContent: 'center',
    position: 'relative', // Needed for absolute positioning of elements
    // Remove placeholder background color
    // backgroundColor: '#e0f2f7', 
  },
  gaugeBackground: {
    width: '100%',
    height: 30,            // Height of the main bar
    backgroundColor: '#e0e0e0', // Light grey background
    borderRadius: 5,
    position: 'absolute', // Position behind the value bar
  },
  valueBar: {
    height: 30,            
    backgroundColor: '#007AFF',
    borderRadius: 0,
    position: 'absolute',
  },
  valueNeedle: {
    width: 4,
    height: 35, 
    backgroundColor: '#005EE5', 
    position: 'absolute',
    top: 8, 
  },
  thresholdMarker: {
    width: 2,
    height: 35, 
    backgroundColor: '#d9534f', 
    position: 'absolute',
    top: 8, 
    opacity: 0.8,
  },
  labelContainer: {
    width: '108%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: -15,
    top: 40, 
    paddingHorizontal: 0, 
  },
  labelText: {
    fontSize: 12,
    color: '#666',
  },
  valueTextContainer: {
    position: 'absolute',
    width: 'auto', 
    top: -17,
    bottom: 10,
    height: 21, 
    borderRadius: 5,
    paddingHorizontal: 5,
    justifyContent: 'center', 
    alignItems: 'center',   
    backgroundColor: 'rgba(211, 211, 211, 0.4)',
  },
  valueText: {
    fontSize: 18, 
    color: '#000000',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});

export default LinearGauge;

