import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getSalon } from '../services/firebaseService';
import { useTheme } from '../context/ThemeContext';

export default function ContactScreen() {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, colors } = useTheme();

  useEffect(() => {
    loadSalon();
  }, []);

  const loadSalon = async () => {
    try {
      const data = await getSalon('tasarimhane');
      setSalon(data);
    } catch (error) {
      console.error('Error loading salon:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>İletişim</Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Salon Info Banner */}
        <LinearGradient
          colors={[...COLORS.headerGradient, '#C4B5FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.salonBanner}
        >
          <View style={styles.salonBannerLogo}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.salonLogo}
            />
          </View>
          <View style={styles.salonBannerInfo}>
            <Text style={styles.salonBannerName}>{salon?.name || 'TASARIMHANE'}</Text>
            <Text style={styles.salonBannerType}>{salon?.type || ''}</Text>
          </View>
        </LinearGradient>

        {/* Adres Bilgileri */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="location-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Adres Bilgileri</Text>
          </View>
          <View style={[styles.addressContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.addressText, { color: colors.textPrimary }]}>{salon?.address || ''}</Text>
          </View>
        </View>

        {/* Çalışma Saatleri */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="time-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Çalışma Saatleri</Text>
          </View>
          <View style={[styles.hoursContainer, { backgroundColor: colors.background }]}>
            {(salon?.workingHours || []).map((item, index) => (
              <View key={index} style={styles.hourRow}>
                <View style={styles.hourDayContainer}>
                  <View style={[styles.statusDot, item.isOpen ? styles.dotOpen : styles.dotClosed]} />
                  <Text style={[styles.hourDay, { color: colors.textPrimary }]}>{item.day}</Text>
                </View>
                <Text style={[styles.hourTime, { color: colors.textSecondary }]}>{item.hours}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sosyal Medya */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <FontAwesome5 name="share-alt" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sosyal Medya</Text>
          </View>
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7} onPress={() => Linking.openURL('https://www.instagram.com/tasarimhane.barbers.shop/')}>
              <View style={[styles.socialIconBg, { backgroundColor: isDark ? 'rgba(228, 64, 95, 0.15)' : '#FCE4EC' }]}>
                <FontAwesome5 name="instagram" size={22} color="#E4405F" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7} onPress={() => Linking.openURL('https://www.tiktok.com/@tasarimhane.barbers.shop')}>
              <View style={[styles.socialIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}>
                <FontAwesome5 name="tiktok" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 55,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  salonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 20,
  },
  salonBannerLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  salonLogo: {
    width: '100%',
    height: '100%',
  },
  salonBannerInfo: {
    flex: 1,
  },
  salonBannerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  salonBannerType: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  addressContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 14,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  hoursContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 14,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hourDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dotOpen: {
    backgroundColor: COLORS.success,
  },
  dotClosed: {
    backgroundColor: COLORS.error,
  },
  hourDay: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hourTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    alignItems: 'center',
  },
  socialIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
