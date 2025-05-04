import React, { useState, useRef, useEffect } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Pressable,
  Modal,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GaugeConfig, MetricRange, MetricThreshold } from '../types/gauge';
import { useRouter } from 'expo-router';

// Import components
import GaugeCard from './components/GaugeCard';
import LinearGauge from './components/LinearGauge';
import CircularGauge from './components/CircularGauge';
import SideMenu from './components/SideMenu';
import { NavigationOption } from './components/SideMenu';

// Default values for new gauges
const DEFAULT_TICKER = "TSLA";
const DEFAULT_METRIC_NAME = "P/S";
const DEFAULT_VALUE = 8.0;
const DEFAULT_MIN = 0.0;
const DEFAULT_MAX = 20.0;
const DEFAULT_RANGES: MetricRange[] = [
  {rangeId : 1, start: 0, end: 5},
  {rangeId: 2, start:5, end:8},
  {rangeId: 3, start:8, end:12},
  {rangeId: 4, start: 12, end: 20}
];
const DEFAULT_THRESHOLDS: MetricThreshold[] = [
  {thresholdId: 1, value: 5},
  {thresholdId: 2, value: 7.37},
  {thresholdId: 3, value: 10}
];

// Type definition for the processed row structure
type LayoutRow = GaugeConfig | GaugeConfig[];

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const menuWidth = screenWidth * 0.8; // 80% of screen width for menu

// Define valid route paths (can be moved to a shared types file later)
type RoutePath = '/' | '/dashboard' | '/tier-sim';

export default function DashboardScreen() {
  const [gaugeConfigs, setGaugeConfigs] = useState<GaugeConfig[]>([]);
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetTranslateX = isMenuOpen ? menuWidth : 0;
    const targetOverlayOpacity = isMenuOpen ? 0.3 : 0;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetTranslateX,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: targetOverlayOpacity,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  }, [isMenuOpen, translateX, overlayOpacity]);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigation = (path: RoutePath) => {
    closeMenu();
    setTimeout(() => {
       router.push(path);
    }, 100);
  };

  // Define handlers for SideMenu icons
  const handleBellPress = () => {
    console.log('SideMenu Bell Pressed');
    // Add navigation or action later
    closeMenu();
 };

  const handleAvatarPress = () => {
    console.log('SideMenu Avatar Pressed');
    // Add navigation or action later
    closeMenu();
  };

  // Helper function to build the layout rows based on pairing logic
  const buildLayoutRows = (configs: GaugeConfig[]): LayoutRow[] => {
    const layoutRows: LayoutRow[] = [];
    // Map to track which row index a gauge config ended up in
    const rowMap: { [key: string]: number } = {}; 

    configs.forEach((currentConfig, i) => {
      if (currentConfig.type === 'linear') {
        layoutRows.push(currentConfig); // Linear gauge gets its own row object
        rowMap[currentConfig.id] = layoutRows.length - 1;
      } else {
        // Circular gauge: try to pair with the previous circular gauge
        let foundPair = false;
        // Search backwards for the most recent previous circular gauge
        let prevCircularIndex = -1;
        for (let j = i - 1; j >= 0; j--) {
          if (configs[j].type === 'circular') {
            prevCircularIndex = j;
            break;
          }
        }

        if (prevCircularIndex !== -1) {
          const prevCircularId = configs[prevCircularIndex].id;
          const targetRowIndex = rowMap[prevCircularId];
          
          // Check if the previous circular gauge's row exists, is an array, and has only 1 item
          if (targetRowIndex !== undefined && 
              Array.isArray(layoutRows[targetRowIndex]) && 
              (layoutRows[targetRowIndex] as GaugeConfig[]).length === 1) 
          {
            // Add the current gauge to that existing row
            (layoutRows[targetRowIndex] as GaugeConfig[]).push(currentConfig);
            rowMap[currentConfig.id] = targetRowIndex; // Map current gauge to the same row
            foundPair = true;
          }
        }

        // If no pair was found, start a new row for this circular gauge
        if (!foundPair) {
          layoutRows.push([currentConfig]); // Start a new row array
          rowMap[currentConfig.id] = layoutRows.length - 1;
        }
      }
    });

    return layoutRows;
  };

  const handleAddButtonPress = () => {
    setIsSelectionVisible(true);
  };

  // Function to create and add a new gauge configuration
  const handleAddGauge = (type: 'linear' | 'circular') => {
    const newGauge: GaugeConfig = {
      id: Date.now().toString(), // Simple unique ID for now
      type: type,
      ticker: DEFAULT_TICKER,
      metricName: DEFAULT_METRIC_NAME,
      metricValue: DEFAULT_VALUE,
      metricMin: DEFAULT_MIN,
      metricMax: DEFAULT_MAX,
      metricRanges: DEFAULT_RANGES,
      metricThresholds: DEFAULT_THRESHOLDS,
    };

    setGaugeConfigs(prevConfigs => [...prevConfigs, newGauge]);
  };

  const handleSelectGaugeType = (type: 'linear' | 'circular') => {
    // console.log("Selected gauge type:", type);
    handleAddGauge(type); // Call the function to add the gauge to state
    setIsSelectionVisible(false); 
  };

  // Header animations (similar to tier-sim)
  const headerFontSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [24, 18],
    extrapolate: 'clamp'
  });

  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 100 * 0.75],
    outputRange: [10, 0], // Adjusted slightly from tier-sim
    extrapolate: 'clamp'
  });

  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 100 * 0.75],
    outputRange: [10, 5], // Adjusted slightly
    extrapolate: 'clamp'
  });

  // Restore headerBorder interpolation
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

  // Add animated margin bottom for the header
  const headerMarginBottomAnimated = scrollY.interpolate({
      inputRange: [0, 100], // Same range as other animations
      outputRange: [10, 0], // Start with 10 margin, end with 0
      extrapolate: 'clamp'
  });

  // Navigation options for the dropdown menu
  const navigationOptions: NavigationOption[] = [
    { label: 'Home', iconName: 'home-outline', onPress: () => handleNavigation('/') },
    { label: 'Tier Simulator', iconName: 'layers-outline', onPress: () => handleNavigation('/tier-sim') },
    // Add other options as needed
  ];

  // Process the configs into layout rows before rendering
  const processedRows = buildLayoutRows(gaugeConfigs);

  // Animated style for the page container
  const pageAnimatedStyle = {
    transform: [{ translateX: translateX }],
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: isMenuOpen ? 0.15 : 0,
    shadowRadius: 5,
    elevation: isMenuOpen ? 5 : 0,
  };

  // Animated style for the internal overlay
  const internalOverlayAnimatedStyle = {
    opacity: overlayOpacity,
  };

  return (
    <View style={styles.rootContainer}>
      <SideMenu
        navigationOptions={navigationOptions}
        onClose={closeMenu}
        onBellPress={handleBellPress}
        onAvatarPress={handleAvatarPress}
        bellIconSize={bellSizeLarge}
        avatarIconSize={avatarSizeLarge}
        menuWidth={menuWidth}
      />

      <Animated.View style={[styles.pageContainer, pageAnimatedStyle]}>
        <SafeAreaView style={styles.safeAreaForPage}>
          <Animated.View style={[
              styles.header,
              {
                  paddingTop: headerPaddingTop,
                  paddingBottom: headerPaddingBottom,
                  borderBottomWidth: headerBorder,
                  marginBottom: headerMarginBottomAnimated,
              }
          ]}>
             <Pressable onPress={openMenu} style={styles.headerIconContainer} hitSlop={10}>
                <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    <Ionicons name="menu-outline" size={iconSizeLarge} color="#333" />
                </Animated.View>
             </Pressable>
             <View style={styles.headerTitleContainer}>
                <Animated.Text style={[ styles.headerTitle, { fontSize: headerFontSize } ]}>
                    Dashboard
                </Animated.Text>
             </View>
             <View style={styles.headerRightContainer}>
                 <Pressable onPress={() => console.log('Header Bell Pressed')} style={styles.headerIconContainer}>
                    <Animated.View style={{ transform: [{ scale: bellScale }] }}>
                        <Ionicons name="notifications-outline" size={bellSizeLarge} color="#333" />
                    </Animated.View>
                </Pressable>
                 <Pressable onPress={() => console.log('Header Avatar Pressed')} style={styles.headerIconContainer}>
                    <Animated.View style={[ styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarBorderRadius } ]} />
                 </Pressable>
             </View>
          </Animated.View>

          <Animated.ScrollView
              style={styles.scrollView}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: false }
              )}
              scrollEnabled={!isMenuOpen}
          >
              {processedRows.length === 0 && (
                  <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No gauges added yet.</Text>
                      <Text style={styles.emptyText}>Press the '+' button to add one.</Text>
                  </View>
              )}

              {processedRows.map((rowItem, index) => {
                  if (Array.isArray(rowItem)) {
                      // --- Render a row of Circular Gauges ---
                      return (
                          <View key={`row-${index}`} style={styles.circularGaugeContainer}>
                              {rowItem.map((gaugeConfig) => (
                                  <GaugeCard
                                      key={gaugeConfig.id}
                                      gaugeType={gaugeConfig.type} // Should always be 'circular' here
                                      ticker={gaugeConfig.ticker}
                                      metricName={gaugeConfig.metricName}
                                  >
                                      <CircularGauge />
                                      {/* Pass detailed props later */}
                                  </GaugeCard>
                              ))}
                          </View>
                      );
                  } else {
                      // --- Render a single Linear Gauge row ---
                      const gaugeConfig = rowItem as GaugeConfig; // Type assertion
                      return (
                          <GaugeCard
                              key={gaugeConfig.id}
                              gaugeType={gaugeConfig.type} // Should always be 'linear' here
                              ticker={gaugeConfig.ticker}
                              metricName={gaugeConfig.metricName}
                          >
                              <LinearGauge />
                              {/* Pass detailed props later */}
                          </GaugeCard>
                      );
                  }
              })}
          </Animated.ScrollView>

          <Pressable style={styles.addButton} onPress={handleAddButtonPress}>
             <Ionicons name="add-circle" size={50} color="#007AFF" />
          </Pressable>

          <Modal
             animationType="fade"
             transparent={true}
             visible={isSelectionVisible}
             onRequestClose={() => { setIsSelectionVisible(false); }}
          >
             <Pressable
                 style={styles.modalBackdrop}
                 onPress={() => setIsSelectionVisible(false)}
             >
                 <View
                     style={styles.modalContainer}
                     onStartShouldSetResponder={() => true}
                 >
                      <Text style={styles.modalTitle}>Choose Gauge Type</Text>
                      
                      <Pressable 
                          style={styles.modalButton} 
                          onPress={() => handleSelectGaugeType('linear')}
                      >
                          <Text style={styles.modalButtonText}>Linear Gauge</Text>
                      </Pressable>
                      
                      <Pressable 
                          style={styles.modalButton} 
                          onPress={() => handleSelectGaugeType('circular')}
                      >
                          <Text style={styles.modalButtonText}>Circular Gauge</Text>
                      </Pressable>

                      <Pressable 
                          style={[styles.modalButton, styles.cancelButton]} 
                          onPress={() => setIsSelectionVisible(false)}
                      >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                 </View>
             </Pressable>
          </Modal>

          <Pressable
            style={styles.internalOverlayPressable}
            onPress={closeMenu}
            disabled={!isMenuOpen}
            pointerEvents={isMenuOpen ? 'auto' : 'none'}
          >
            <Animated.View style={[styles.internalOverlayAnimatedView, internalOverlayAnimatedStyle]} />
          </Pressable>

        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  pageContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  safeAreaForPage: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    // Background handled by safeAreaForPage
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    position: 'relative',
    borderBottomColor: '#eee',
    zIndex: 10, // Keep header above scroll content
  },
  headerTitleContainer: { // New style for absolute positioning
    position: 'absolute',
    left: 60, // Adjust left/right to prevent overlap with icons
    right: 60,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(255,0,0,0.1)', // Optional: for debugging layout
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    // Remove textAlign: center here, handled by parent alignment
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    padding: 5, 
    // Center the icon wrapper vertically if needed
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: { // Base styles, animated ones applied inline
    backgroundColor: '#ccc',
    marginLeft: 8, 
  },
  scrollView: {
    flex: 1,
    // Add top padding to prevent content from going under initial header state
    // This might need adjustment based on initial header height
    // paddingTop: 60, // Example value, adjust as needed
  },
  circularGaugeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    // Remove padding, rely on card margins for spacing within the row
    // Set marginBottom so total space below row (container + card margin) is 15px
    marginBottom: 0, // 8 card bottom margin found in GaugeCard.tsx (see gridItemMargin) + 0 here = 8 total desired margin between rows
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200, // Ensure it takes some space
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    // Revert to bottom position
    bottom: 30, 
    backgroundColor: 'white',
    borderRadius: 25, 
    padding: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    // zIndex: 10, // Not usually needed for bottom position
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%', // Make buttons fill container width
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  internalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100, // Above page content, below modals
  },
  internalOverlayAnimatedView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
});