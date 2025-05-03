import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons for close icon

const screenHeight = Dimensions.get('window').height;

// Export the interface
export interface NavigationOption {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap; // Optional icon name
  onPress: () => void;
}

interface DropdownMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigationOptions: NavigationOption[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isVisible, onClose, navigationOptions }) => {
  const translateY = useRef(new Animated.Value(-screenHeight)).current; // Start off-screen top

  useEffect(() => {
    if (isVisible) {
      // Animate in
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300, // Quick animation
        useNativeDriver: true,
      }).start();
    } else {
      // Animate out
      Animated.timing(translateY, {
        toValue: -screenHeight,
        duration: 250, // Slightly faster out
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, translateY]);

  // Don't render anything if not visible and animation finished
  // This prevents interaction when off-screen
  // Note: We might need a state to track when animation *starts* hiding
  // if (!isVisible && translateY._value === -screenHeight) {
  //   return null;
  // }
  // Actually, let's keep it rendered but off-screen for smoother transitions


  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <Pressable style={styles.backdrop} onPress={onClose} />
      )}

      {/* Menu Content */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.menuHeader}>
           <Text style={styles.menuTitle}>Navigation</Text>
           <Pressable onPress={onClose} style={styles.closeButton}>
               <Ionicons name="close" size={28} color="#333" />
           </Pressable>
        </View>
        {navigationOptions.map((option, index) => (
          <Pressable key={index} style={styles.menuItem} onPress={() => {
            option.onPress();
            onClose(); // Close menu on option press
          }}>
            {option.iconName && (
              <Ionicons name={option.iconName} size={22} color="#333" style={styles.menuIcon} />
            )}
            <Text style={styles.menuItemText}>{option.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black
    zIndex: 40, // Below menu, above content
  },
  menuContainer: {
    position: 'absolute',
    top: 0, // Align to top
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    zIndex: 50, // Above backdrop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
   menuHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 10,
     paddingBottom: 10,
     borderBottomWidth: 1,
     borderBottomColor: '#eee',
     marginBottom: 10,
   },
   menuTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: '#333',
   },
   closeButton: {
     padding: 5, // Hit area
   },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default DropdownMenu;