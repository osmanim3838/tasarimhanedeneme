import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getSalon } from '../services/firebaseService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const salonName = salon?.name || 'TASARIMHANE';
  const salonType = salon?.type || 'Bay/Bayan Güzellik Salonu';

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardInner}>
            {/* Salon Icon */}
            <View style={styles.salonIconContainer}>
              <Image source={require('../../assets/logo.png')} style={styles.salonLogo} />
            </View>

            <Text style={styles.salonName}>{salonName}</Text>
            <Text style={styles.welcomeText}>
              Hoş geldiniz! Size nasıl yardımcı olabiliriz?
            </Text>

            {/* Action Buttons Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => navigation.navigate('Appointment')}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Randevu Al</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => { const phone = salon?.phone?.replace(/\s/g, ''); if (phone) Linking.openURL(`tel:${phone}`); }}>
                <Ionicons name="call-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Ara</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => { const wp = (salon?.whatsapp || salon?.phone || '').replace(/\s/g, '').replace('+', ''); if (wp) Linking.openURL(`https://wa.me/${wp}`); }}>
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => { const addr = salon?.address; if (addr) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`); }}>
                <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Konum</Text>
              </TouchableOpacity>
            </View>

            {/* Salon Type Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{salonType}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {/* Randevular */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MyAppointments')}
          >
            <LinearGradient
              colors={COLORS.cardOrange}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIcon}>
                <Ionicons name="checkbox-outline" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>RANDEVULAR</Text>
              <Text style={styles.gridCardSubtitle}>Randevularınız</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Personeller */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PersonnelList')}
          >
            <LinearGradient
              colors={COLORS.cardPurple}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIcon}>
                <FontAwesome5 name="users" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>PERSONELLER</Text>
              <Text style={styles.gridCardSubtitle}>Ekibimizi tanıyın</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hakkımızda */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('About')}
          >
            <LinearGradient
              colors={COLORS.cardBlue}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIcon}>
                <Ionicons name="information-circle-outline" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>HAKKIMIZDA</Text>
              <Text style={styles.gridCardSubtitle}>Bizi tanıyın</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* İletişim */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Contact')}
          >
            <LinearGradient
              colors={COLORS.cardGreen}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIcon}>
                <Ionicons name="call-outline" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>İLETİŞİM</Text>
              <Text style={styles.gridCardSubtitle}>Bize ulaşın</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  headerCard: {
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerCardInner: {
    padding: 24,
    alignItems: 'center',
  },
  salonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  salonLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
  },
  salonName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    width: (width - 100) / 2,
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.cardGreen[0],
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  randevuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 16,
  },
  randevuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  randevuTextContainer: {
    flex: 1,
  },
  randevuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  randevuSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (width - 44) / 2,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  gridCardGradient: {
    padding: 20,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gridCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
});
