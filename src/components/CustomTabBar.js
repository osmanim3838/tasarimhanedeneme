import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const TAB_ITEMS = [
  { name: 'Home', label: 'Ana Sayfa', icon: 'home-outline', iconActive: 'home' },
  { name: 'About', label: 'Hakkımızda', icon: 'information-circle-outline', iconActive: 'information-circle' },
  { name: 'Contact', label: 'İletişim', icon: 'location-outline', iconActive: 'location' },
  { name: 'Profile', label: 'Profil', icon: 'person-outline', iconActive: 'person' },
];

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* FAB Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Appointment')}>
          <LinearGradient
            colors={COLORS.headerGradient}
            style={styles.fab}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, isDark && { backgroundColor: '#1E293B' }, { paddingBottom: Math.max(insets.bottom, 30) }]}>
        {TAB_ITEMS.map((tab, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {isFocused ? (
                <View style={styles.activeTabBg}>
                  <Ionicons
                    name={tab.iconActive}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
              ) : (
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color="rgba(255,255,255,0.5)"
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    top: -24,
    zIndex: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeTabBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
