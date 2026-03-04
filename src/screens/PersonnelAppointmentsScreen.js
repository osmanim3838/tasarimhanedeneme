import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../constants/theme';
import { getPersonnelAppointments, updateAppointmentStatus } from '../services/firebaseService';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const DAYS_HEADER = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function getCalendarDays(year, month) {
  let startDay = new Date(year, month, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function PersonnelAppointmentsScreen({ route, navigation }) {
  const { person } = route.params;
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  const calendarDays = getCalendarDays(calYear, calMonth);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getPersonnelAppointments(person.id);
      setAppointments(data);
    } catch (error) {
      console.error('Randevular yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [person.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleAction = async (appointment, status) => {
    try {
      await updateAppointmentStatus(appointment.id, status);
      fetchAppointments();
    } catch (error) {
      Alert.alert('Hata', 'İşlem başarısız.');
    }
  };

  const sendWhatsAppReminder = (apt) => {
    if (!apt.userPhone) {
      Alert.alert('Hata', 'Müşterinin telefon numarası bulunamadı.');
      return;
    }
    // Normalize phone to international format
    let phone = apt.userPhone.replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('0')) phone = '90' + phone.slice(1);
    else if (!phone.startsWith('+') && !phone.startsWith('90')) phone = '90' + phone;
    phone = phone.replace('+', '');

    const services = Array.isArray(apt.services) ? apt.services.join(', ') : (apt.services || '');
    const message = `Merhaba ${apt.userName || ''},\n\nTASARIMHANE randevu hatırlatması:\n\n📅 Tarih: ${apt.date}\n🕰 Saat: ${apt.time}\n✂️ Hizmet: ${services}\n💇 Personel: ${person.name} ${person.surname}\n\nSizi bekliyor olacağız. İyi günler!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'WhatsApp açılamadı. Lütfen WhatsApp yüklü olduğundan emin olun.');
    });
  };

  const statusMap = {
    confirmed: { label: '', color: '#10B981', bg: '#D1FAE5' },
    cancelled: { label: 'İptal', color: '#EF4444', bg: '#FEE2E2' },
    completed: { label: 'Tamamlandı', color: '#6366F1', bg: '#E0E7FF' },
  };

  // Seçili tarihe göre filtreleme
  const filteredAppointments = selectedDate
    ? appointments.filter((a) => {
        if (!a.date) return false;
        const [y, m, d] = a.date.split('-').map(Number);
        return y === selectedDate.getFullYear() &&
          (m - 1) === selectedDate.getMonth() &&
          d === selectedDate.getDate();
      })
    : appointments;

  const totalCount = filteredAppointments.length;
  const confirmedCount = filteredAppointments.filter((a) => a.status === 'confirmed').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7B61FF', '#9B85FF']} style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Randevular</Text>
          <Text style={styles.headerSubtitle}>{person.name} {person.surname}</Text>
        </View>
        <TouchableOpacity style={styles.refreshHeaderBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Person Info Bar */}
      <View style={styles.personBar}>
        <View style={styles.personBarLeft}>
          {person.image ? (
            <Image source={{ uri: person.image }} style={styles.personAvatar} />
          ) : (
            <View style={styles.personAvatarPlaceholder}>
              <Ionicons name="person" size={22} color={COLORS.textMuted} />
            </View>
          )}
          <View>
            <Text style={styles.personName}>{person.name} {person.surname}</Text>
            <Text style={styles.personRole}>{person.role || 'Personel'}</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.miniStat, { backgroundColor: '#E0E7FF' }]}>
            <Text style={[styles.miniStatLabel, { color: '#6366F1' }]}>Toplam</Text>
            <Text style={[styles.miniStatNum, { color: '#6366F1' }]}>{totalCount}</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <View style={styles.calMonthRow}>
          <View style={styles.calMonthRight}>
            {calendarExpanded && (
              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                  else setCalMonth(calMonth - 1);
                }}
                style={styles.calArrow}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setCalendarExpanded(!calendarExpanded)} activeOpacity={0.7} style={styles.calMonthTitleBtn}>
              <Text style={styles.calMonthTitle}>
                {selectedDate
                  ? `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                  : `${MONTHS_TR[calMonth]} ${calYear}`}
              </Text>
              <Ionicons name={calendarExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {calendarExpanded && (
              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                  else setCalMonth(calMonth + 1);
                }}
                style={styles.calArrow}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {calendarExpanded && (
          <>
            <View style={styles.calDivider} />

            <View style={styles.calWeekRow}>
              {DAYS_HEADER.map((d) => (
                <Text key={d} style={styles.calWeekDay}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarDays.map((day, i) => {
                if (day === null) return <View key={`e${i}`} style={styles.calDayCell} />;
                const cellDate = new Date(calYear, calMonth, day);
                cellDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = cellDate.getTime() === today.getTime();
                const isSelected = selectedDate && selectedDate.toDateString() === cellDate.toDateString();
                const hasAppointment = appointments.some((a) => {
                  if (!a.date) return false;
                  const [y, m, d] = a.date.split('-').map(Number);
                  return y === cellDate.getFullYear() && (m - 1) === cellDate.getMonth() && d === cellDate.getDate();
                });
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calDayCell,
                      isToday && !isSelected && styles.calDayCellToday,
                      isSelected && styles.calDayCellSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (selectedDate && selectedDate.toDateString() === cellDate.toDateString()) {
                        setSelectedDate(null);
                      } else {
                        setSelectedDate(cellDate);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isToday && !isSelected && styles.calDayTextToday,
                        isSelected && styles.calDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasAppointment && !isSelected && (
                      <View style={styles.calDayDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDate && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                <Text style={styles.clearFilterText}>
                  {selectedDate.getDate()} {MONTHS_TR[selectedDate.getMonth()]} — Filtreyi Kaldır
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Randevu Yok</Text>
              <Text style={styles.emptyDesc}>Bu personele henüz randevu alınmamış</Text>
            </View>
          ) : (
            filteredAppointments.map((apt) => {
              const st = statusMap[apt.status] || statusMap.confirmed;
              return (
                <View key={apt.id} style={styles.card}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardDateRow}>
                      <Ionicons name="calendar" size={16} color={COLORS.primary} />
                      <Text style={styles.cardDate}>{apt.date || '-'}</Text>
                      <Ionicons name="time" size={16} color={COLORS.primary} style={{ marginLeft: 12 }} />
                      <Text style={styles.cardTime}>{apt.time || '-'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <Ionicons name="person-outline" size={16} color={COLORS.textMuted} />
                      <Text style={styles.cardLabel}>Müşteri</Text>
                      <Text style={styles.cardValue}>{apt.userName || 'Belirtilmemiş'}</Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Ionicons name="call-outline" size={16} color={COLORS.textMuted} />
                      <Text style={styles.cardLabel}>Telefon</Text>
                      <Text style={styles.cardValue}>{apt.userPhone || '-'}</Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Ionicons name="cut-outline" size={16} color={COLORS.textMuted} />
                      <Text style={styles.cardLabel}>Hizmet</Text>
                      <Text style={styles.cardValue} numberOfLines={2}>
                        {(apt.services && apt.services.length > 0) ? apt.services.join(', ') : 'Belirtilmemiş'}
                      </Text>
                    </View>
                  </View>

                  {/* WhatsApp Reminder Button */}
                  {apt.status === 'confirmed' && apt.userPhone && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => sendWhatsAppReminder(apt)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                        <Text style={styles.actionBtnText}>Hatırlatma Gönder</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  refreshHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Person Info Bar
  personBar: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  personBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  personAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  personRole: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  miniStatNum: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  miniStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Calendar
  calendarContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  calMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  calMonthRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calMonthTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  calArrow: {
    padding: 6,
  },
  calMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  calDivider: {
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    marginBottom: 12,
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellToday: {
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
  },
  calDayCellSelected: {
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  calDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  calDayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calDayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0EDFF',
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Content
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Appointment Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    width: 60,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
