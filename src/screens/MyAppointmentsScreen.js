import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getUserAppointments, updateAppointmentStatus } from '../services/firebaseService';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const STATUS_MAP = {
  confirmed: { label: 'Onaylandı', color: COLORS.success, icon: 'checkmark-circle-outline', bg: '#DCFCE7' },
  cancelled: { label: 'İptal Edildi', color: COLORS.error, icon: 'close-circle-outline', bg: '#FEE2E2' },
  completed: { label: 'Tamamlandı', color: COLORS.info, icon: 'checkmark-done-outline', bg: '#DBEAFE' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = MONTHS_TR[parseInt(parts[1], 10) - 1] || '';
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

export default function MyAppointmentsScreen({ navigation }) {
  const { user } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getUserAppointments(user.id);
      // Sort by date (upcoming first, then past)
      data.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateA.localeCompare(dateB);
      });
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const getStatus = (status) => STATUS_MAP[status] || STATUS_MAP.confirmed;

  const handleCancel = (appointment) => {
    // Check if appointment is within 2 hours
    const [year, month, day] = appointment.date.split('-').map(Number);
    const [hour, minute] = (appointment.time || '00:00').split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      Alert.alert(
        'İptal Edilemez',
        'Randevunuza 2 saatten az kaldığı için iptal işlemi yapılamaz.'
      );
      return;
    }

    Alert.alert(
      'Randevuyu İptal Et',
      'Bu randevuyu iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAppointmentStatus(appointment.id, 'cancelled');
              loadAppointments();
            } catch (error) {
              Alert.alert('Hata', 'İptal işlemi başarısız oldu.');
            }
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.menuIconBg1 }]}>
        <Ionicons name="calendar-outline" size={56} color={COLORS.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Henüz randevunuz yok</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        İlk randevunuzu oluşturmak için aşağıdaki butona tıklayın
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Appointment')}
      >
        <LinearGradient colors={COLORS.headerGradient} style={styles.emptyButton}>
          <Ionicons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={styles.emptyButtonText}>Randevu Oluştur</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderAppointmentCard = (appointment, isPast) => {
    const status = getStatus(appointment.status);
    return (
      <View key={appointment.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, isPast && { opacity: 0.65 }]}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={16} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Personnel */}
        <View style={styles.cardRow}>
          <View style={[styles.cardIconBg, { backgroundColor: colors.menuIconBg1 }]}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.cardRowContent}>
            <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>Personel</Text>
            <Text style={[styles.cardRowValue, { color: colors.textPrimary }]}>{appointment.personnelName || '-'}</Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.cardRow}>
          <View style={[styles.cardIconBg, { backgroundColor: colors.menuIconBg2 }]}>
            <MaterialCommunityIcons name="content-cut" size={18} color={COLORS.warning} />
          </View>
          <View style={styles.cardRowContent}>
            <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>Hizmetler</Text>
            <Text style={[styles.cardRowValue, { color: colors.textPrimary }]}>
              {(appointment.services || []).join(', ') || '-'}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.cardRow}>
          <View style={[styles.cardIconBg, { backgroundColor: colors.statusCompletedBg }]}>
            <Ionicons name="calendar" size={18} color={COLORS.info} />
          </View>
          <View style={styles.cardRowContent}>
            <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>Tarih & Saat</Text>
            <Text style={[styles.cardRowValue, { color: colors.textPrimary }]}>
              {formatDate(appointment.date)} — {appointment.time || ''}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        {appointment.status === 'confirmed' && !isPast && (() => {
          const [y, m, d] = appointment.date.split('-').map(Number);
          const [h, min] = (appointment.time || '00:00').split(':').map(Number);
          const apptDate = new Date(y, m - 1, d, h, min);
          const hoursLeft = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
          const canCancel = hoursLeft >= 2;
          return (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.deleteButtonBg }, !canCancel && { opacity: 0.5 }]}
              onPress={() => handleCancel(appointment)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" />
              <Text style={styles.cancelButtonText}>
                {canCancel ? 'Randevuyu İptal Et' : 'İptal süresi doldu'}
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={COLORS.headerGradient} style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevularım</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Appointment')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {appointments.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = appointments.filter((a) => a.date >= today && a.status !== 'cancelled');
                const past = appointments.filter((a) => a.date < today || a.status === 'cancelled');
                return (
                  <>
                    {upcoming.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Yaklaşan Randevular</Text>
                        {upcoming.map((a) => renderAppointmentCard(a, false))}
                      </>
                    )}
                    {past.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { marginTop: upcoming.length > 0 ? 20 : 0, color: colors.textPrimary }]}>Geçmiş Randevular</Text>
                        {past.map((a) => renderAppointmentCard(a, true))}
                      </>
                    )}
                    {upcoming.length === 0 && past.length === 0 && renderEmpty()}
                  </>
                );
              })()}
            </>
          )}
          <View style={{ height: 30 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 14,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 18,
    marginBottom: 12,
    marginLeft: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardRowContent: {
    flex: 1,
  },
  cardRowLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 3,
  },
  cardRowValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // ── Cancel button ──
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },

  // ── Empty state ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: SIZES.radiusMedium,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
