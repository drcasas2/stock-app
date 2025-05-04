import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Keep NavigationOption export
export interface NavigationOption {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

// Define props for SideMenu, including potential header icons component/data
interface SideMenuProps {
  navigationOptions: NavigationOption[];
  onClose: () => void; // For potential close button inside menu
  // Add the missing props for header icons
  onBellPress: () => void;
  onAvatarPress: () => void;
  bellIconSize: number;
  avatarIconSize: number;
  menuWidth: number; // Add prop for menu width
  // We can pass rendered components or data to render icons later
  // headerIcons?: React.ReactNode;
}

const SideMenu: React.FC<SideMenuProps> = ({
  navigationOptions,
  onClose,
  // Destructure the new props
  onBellPress,
  onAvatarPress,
  bellIconSize,
  avatarIconSize,
  menuWidth // Destructure menuWidth
}) => {
  // Calculate avatar border radius based on size
  const avatarBorderRadius = avatarIconSize / 2;

  return (
    // Use SafeAreaView to respect device notches/status bars within the menu
    <SafeAreaView style={[styles.safeArea, { width: menuWidth }]}>
      <View style={styles.menuContainer}>
        {/* Section for Header Icons */}
        <View style={styles.menuHeader}>
          {/* Render actual icons using passed props */}
          <View style={styles.headerIconsContainer}>
             {/* Bell Icon */}
             <Pressable onPress={onBellPress} style={styles.headerIconPressable}>
               <Ionicons
                 name="notifications-outline"
                 size={bellIconSize}
                 color="#333"
               />
             </Pressable>
             {/* Avatar Icon */}
             <Pressable onPress={onAvatarPress} style={styles.headerIconPressable}>
               {/* Use a simple View for the avatar placeholder */}
               <View style={[
                 styles.avatarPlaceholder,
                 {
                   width: avatarIconSize,
                   height: avatarIconSize,
                   borderRadius: avatarBorderRadius
                 }
               ]} />
             </Pressable>
          </View>
          {/* Optional: Add a dedicated close button if needed */}
           {/*<Pressable onPress={onClose} style={styles.closeButton}>
             <Ionicons name="close" size={28} color="#333" />
           </Pressable>*/}
        </View>

        {/* Navigation Links */}
        <View style={styles.navLinksContainer}>
          {navigationOptions.map((option, index) => (
            <Pressable key={index} style={styles.menuItem} onPress={option.onPress}>
              {option.iconName && (
                <Ionicons name={option.iconName} size={22} color="#333" style={styles.menuIcon} />
              )}
              <Text style={styles.menuItemText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Optional Footer */}
        {/* <View style={styles.menuFooter}> ... </View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Light background for the menu
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20, // Add some padding at the top
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align icons to the right
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    marginBottom: 15,
     borderBottomWidth: 1,
     borderBottomColor: '#eee',
  },
  headerIconsContainer: {
     flexDirection: 'row',
     alignItems: 'center',
  },
  headerIconPressable: { // Add Pressable style for touch feedback and spacing
     padding: 5,
     marginLeft: 8, // Add space between icons
  },
  avatarPlaceholder: { // Style for the avatar circle
     backgroundColor: '#ccc',
  },
  // closeButton: { // Style if a close button is added
  //   padding: 5,
  // },
  navLinksContainer: {
    paddingHorizontal: 10, // Horizontal padding for nav items container
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15, // Horizontal padding for each item
    borderRadius: 8,
    marginBottom: 5,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // menuFooter: { // Styles for optional footer
  //   padding: 20,
  //   borderTopWidth: 1,
  //   borderTopColor: '#eee',
  // }
});

export default SideMenu;