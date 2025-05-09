import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
// Import the necessary types
import { MetricRange, MetricThreshold } from '../../types/gauge';
import { CircularGaugeProps } from './CircularGauge'; // Assuming CircularGaugeProps is exported
// If LinearGaugeProps is also defined and exported, import it too.
// import { LinearGaugeProps } from './LinearGauge'; 

interface GaugeCardProps {
  gaugeType: 'linear' | 'circular';
  ticker: string;
  metricName: string;
  // Add the new props for gauge data
  metricValue: number;
  metricMin: number;
  metricMax: number;
  metricRanges: MetricRange[];
  metricThresholds: MetricThreshold[];
  children: React.ReactNode; // The actual gauge component
  style?: StyleProp<ViewStyle>;
}

const screenWidth = Dimensions.get('window').width;
const cardHorizontalMargin = 15; // Margin on the left/right of the screen for linear cards
const gridItemMargin = 8; // Margin around each circular card in the grid
const circularCardPaddingHorizontal = 15; // Defined as a constant for clarity

const GaugeCard: React.FC<GaugeCardProps> = ({ 
  gaugeType,
  ticker,
  metricName,
  // Destructure the new props
  metricValue,
  metricMin,
  metricMax,
  metricRanges,
  metricThresholds,
  children,
  style 
}) => {

  // Determine specific styles based on gaugeType
  const typeSpecificStyle = gaugeType === 'linear' ? styles.linearCard : styles.circularCard;
  const metricContainerStyle = gaugeType === 'linear' ? styles.metricContainerLinear : styles.metricContainerCircular;

  let gaugeSpecificProps: Partial<CircularGaugeProps> = {}; // Use Partial if LinearGauge has different props
  if (gaugeType === 'circular') {
    // Calculate the width of the card itself (before this card's internal padding)
    const cardContentWidthBeforePadding = (screenWidth / 2) - (gridItemMargin * 2);
    // The actual size for the CircularGauge SVG should be this width MINUS the internal padding of the card
    const circularGaugeSvgSize = cardContentWidthBeforePadding - (circularCardPaddingHorizontal * 2);

    gaugeSpecificProps = {
      value: metricValue,
      min: metricMin,
      max: metricMax,
      ranges: metricRanges,
      thresholds: metricThresholds,
      size: circularGaugeSvgSize, // Pass the adjusted size
    };
  } else { // linear
    // If LinearGaugeProps are different or it also needs a size based on linearCard width
    gaugeSpecificProps = {
        value: metricValue,
        min: metricMin,
        max: metricMax,
        ranges: metricRanges,
        thresholds: metricThresholds,
        // size: screenWidth - (cardHorizontalMargin * 2), // Example if LinearGauge also needs size
    };
  }

  // Clone the child element (LinearGauge or CircularGauge) and pass the props
  const gaugeElement = React.isValidElement(children) 
    ? React.cloneElement(children as React.ReactElement<any>, gaugeSpecificProps)
    : children;

  return (
    // Apply base, type-specific, and override styles
    <View style={[styles.cardBase, typeSpecificStyle, style]}>
      {/* Ticker Section */}
      <View style={styles.tickerContainer}>
        <Text style={styles.tickerText}>{ticker}</Text>
      </View>

      {/* Main Content Area - Gauge */}
      <View style={styles.gaugeContainer}>
        {gaugeElement} 
      </View>

      {/* Metric Name Section - Apply conditional positioning */}
      <View style={[styles.metricContainerBase, metricContainerStyle]}>
        <Text style={styles.metricText}>{metricName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    // Base styles common to all cards
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15, 
    // Add shadow for card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    // Ensure content is laid out vertically initially
    flexDirection: 'column', 
  },
  linearCard: {
    width: screenWidth - (cardHorizontalMargin * 2), // Full width minus screen margins
    marginHorizontal: cardHorizontalMargin, // Center card on screen
    marginBottom: 15, // Vertical spacing between linear cards
  },
  circularCard: {
    width: (screenWidth / 2) - (gridItemMargin * 2), 
    marginHorizontal: gridItemMargin, 
    marginBottom: 15,
    minHeight: 225, //Changed from 150 to 225 to allow for more space for Circular Gauge
    aspectRatio: 1.2, 
    paddingHorizontal: circularCardPaddingHorizontal, // Use the constant
  },
  tickerContainer: {
    alignItems: 'center', // Center ticker text horizontally
    marginBottom: 12,     // Space below ticker
  },
  tickerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  gaugeContainer: {
    flex: 1, // Allow gauge area to take up available space
    justifyContent: 'center', // Center gauge placeholder vertically for now
    alignItems: 'center',   // Center gauge placeholder horizontally for now
    // Add minHeight if needed later to prevent collapse with small gauges
  },
  // Base styles for the metric container
  metricContainerBase: {
    marginTop: 0,
  },
  // Metric container style for CIRCULAR cards (bottom-center)
  metricContainerCircular: {
    alignItems: 'center',
  },
  // Metric container style for LINEAR cards (center, potentially overlay)
  metricContainerLinear: {
    // For now, same as circular - adjust later if overlay is needed
    alignItems: 'center',
    // Example for overlay (might need absolute positioning)
    // position: 'absolute', 
    // bottom: 10, 
    // left: 0,
    // right: 0,
  },
  metricText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Specific styles for linear/circular will be added later
});

export default GaugeCard;
