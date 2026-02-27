import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function PersonnelDetailScreen({ route, navigation }) {
  const { person } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={[styles.header, { paddingTop: Math.max(insets.top, 8) + 4 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {person.name} {person.surname}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <LinearGradient
          colors={[...COLORS.headerGradient, '#C4B5FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarLargeContainer}>
            {person.image ? (
              <Image source={{ uri: person.image }} style={styles.avatarLarge} />
            ) : (
              <View style={styles.avatarLargePlaceholder}>
                <Ionicons name="person-outline" size={48} color={COLORS.primary} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>
            {person.name} {person.surname}
          </Text>
          <Text style={styles.profileSalon}>TASARIMHANE</Text>
        </LinearGradient>

        {/* Hizmetlerim */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <MaterialCommunityIcons name="content-cut" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Hizmetlerim</Text>
          </View>
          {person.services.map((service, index) => (
            <View key={index} style={[styles.serviceRow, { backgroundColor: colors.background }]}>
              <View style={styles.serviceDot} />
              <Text style={[styles.serviceText, { color: colors.textPrimary }]}>{service}</Text>
              <Ionicons name="checkmark" size={22} color={COLORS.success} />
            </View>
          ))}
        </View>

        {/* Hakkımda */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Hakkımda</Text>
          </View>
          <View style={[styles.aboutContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.aboutText, { color: colors.textPrimary }]}>{person.about}</Text>
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
            <View style={styles.hourInfoRow}>
              <Text style={[styles.hourLabel, { color: colors.textSecondary }]}>Çalışma Saatleri:</Text>
              <Text style={styles.hourValue}>{person.workingHours}</Text>
            </View>
            <View style={styles.hourInfoRow}>
              <Text style={styles.hourLabel}>Personel Tatil Günü:</Text>
              <Text style={[styles.hourValue, { color: COLORS.warning }]}>{person.dayOff}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Appointment Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.appointmentButton}>
          <LinearGradient
            colors={['#1E6F5C', '#2D9B7B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.appointmentGradient}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.appointmentText}>
              {person.name} ile Randevu Al
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: SIZES.radiusLarge,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLargeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatarLarge: {
    width: '100%',
    height: '100%',
  },
  avatarLargePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSalon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 14,
    marginBottom: 8,
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  serviceText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  aboutContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  hoursContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 16,
  },
  hourInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  hourLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  hourValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.info,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appointmentButton: {
    borderRadius: SIZES.radiusMedium,
    overflow: 'hidden',
  },
  appointmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  appointmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
