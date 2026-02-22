import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getPersonnel, createAppointment } from '../services/firebaseService';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

// ── Step indicators ──
const STEPS = [
  { key: 'personnel', label: 'Personel', icon: 'people-outline' },
  { key: 'services', label: 'Hizmet', icon: 'cut-outline' },
  { key: 'datetime', label: 'Tarih/Saat', icon: 'calendar-outline' },
  { key: 'summary', label: 'Özet', icon: 'checkmark-circle-outline' },
];

// ── Turkish month names ──
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const DAYS_HEADER = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

// ── Service catalog (name → { duration, price }) ──
const SERVICE_CATALOG = {
  'Saç Kesimi':          { duration: 30, price: 450 },
  'Sakal Tıraşı':        { duration: 20, price: 300 },
  'Saç-Sakal Kesimi':    { duration: 45, price: 600 },
  'Çocuk Tıraşı':        { duration: 30, price: 300 },
  'Saç Boyama':          { duration: 60, price: 1500 },
  'Saç Şekillendirme':   { duration: 30, price: 400 },
  'Saç Bakımı':          { duration: 45, price: 800 },
  'Saç Yıkama+Fön':      { duration: 30, price: 350 },
  'Saç Düzleştirme':     { duration: 60, price: 1000 },
  'Keratin Düzleştirme': { duration: 60, price: 2000 },
  'Saçta Renklendirme':  { duration: 75, price: 2000 },
  'Cilt Bakımı':         { duration: 30, price: 1500 },
  'Ağda(Tüm Vücut)':    { duration: 60, price: 1200 },
  'Yanak Kulak Ağda':    { duration: 15, price: 150 },
  'Kaş Alma':            { duration: 15, price: 200 },
  'Manikür':             { duration: 30, price: 400 },
  'Pedikür':             { duration: 45, price: 500 },
  'Tüm Hizmetler':       { duration: null, price: null },
};

function getServiceInfo(name) {
  return SERVICE_CATALOG[name] || { duration: null, price: null };
}

function generateTimeSlots(start = '10:00', end = '21:30', interval = 30) {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += interval;
  }
  return slots;
}

function generateDates() { return []; } // kept for compat

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday=0 ... Sunday=6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function AppointmentScreen({ navigation }) {
  const { user } = useUser();
  const scrollRef = useRef(null);

  const [step, setStep] = useState(0); // 0=personnel, 1=services, 2=datetime, 3=summary
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [personnel, setPersonnel] = useState([]);

  // Selections
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const calendarDays = getCalendarDays(calYear, calMonth);
  const timeSlots = generateTimeSlots();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      const data = await getPersonnel('tasarimhane');
      setPersonnel(data);
    } catch (error) {
      console.error('Error loading personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setSelectedServices([]);
    setStep(1);
    scrollToTop();
  };

  const toggleService = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleNextToDateTime = () => {
    if (selectedServices.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir hizmet seçin.');
      return;
    }
    setStep(2);
    scrollToTop();
  };

  const handleNextToSummary = () => {
    if (!selectedTime) {
      Alert.alert('Uyarı', 'Lütfen bir saat seçin.');
      return;
    }
    setStep(3);
    scrollToTop();
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await createAppointment({
        salonId: 'tasarimhane',
        userId: user?.id || null,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Misafir',
        userPhone: user?.phone || '',
        personnelId: selectedPerson.id,
        personnelName: `${selectedPerson.name} ${selectedPerson.surname}`,
        services: selectedServices,
        date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        time: selectedTime,
      });
      Alert.alert('Başarılı', 'Randevunuz oluşturuldu!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Randevu oluşturulurken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      scrollToTop();
    } else {
      navigation.goBack();
    }
  };

  // ── Render helpers ──

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {STEPS.map((s, i) => {
        const isActive = i === step;
        const isDone = i < step;
        return (
          <View key={s.key} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isDone && styles.stepCircleDone,
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Ionicons name={s.icon} size={16} color={isActive ? '#FFF' : COLORS.textMuted} />
              )}
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
              {s.label}
            </Text>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );

  const renderPersonnelStep = () => (
    <View style={styles.sectionContainer}>
      <LinearGradient
        colors={COLORS.headerGradient}
        style={styles.sectionHeader}
      >
        <Ionicons name="people" size={20} color="#FFF" />
        <Text style={styles.sectionHeaderText}>Personel Seçimi</Text>
      </LinearGradient>

      {personnel.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={styles.personCard}
          activeOpacity={0.7}
          onPress={() => handleSelectPerson(person)}
        >
          <View style={styles.personAvatarContainer}>
            {person.image ? (
              <Image source={{ uri: person.image }} style={styles.personAvatar} />
            ) : (
              <View style={styles.personAvatarPlaceholder}>
                <Ionicons name="person-outline" size={28} color={COLORS.textMuted} />
              </View>
            )}
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{person.name} {person.surname}</Text>
            <Text style={styles.personServiceCount}>
              {person.services?.length || 0} hizmet sunuyor
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderServicesStep = () => (
    <View style={styles.sectionContainer}>
      {/* Selected person info */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={styles.selectedPersonBanner}
      >
        <View style={styles.selectedPersonRow}>
          {selectedPerson?.image ? (
            <Image source={{ uri: selectedPerson.image }} style={styles.selectedPersonAvatar} />
          ) : (
            <View style={[styles.selectedPersonAvatar, styles.selectedPersonAvatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#FFF" />
            </View>
          )}
          <Text style={styles.selectedPersonName}>
            {selectedPerson?.name} {selectedPerson?.surname}
          </Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#8B5CF6', '#A78BFA']}
        style={styles.sectionHeader}
      >
        <MaterialCommunityIcons name="content-cut" size={20} color="#FFF" />
        <Text style={styles.sectionHeaderText}>Hizmet Seçiniz</Text>
      </LinearGradient>

      <View style={styles.servicesContainer}>
        <Text style={styles.servicesCategoryTitle}>Hizmetler</Text>
        <View style={styles.servicesDivider} />

        {(selectedPerson?.services || []).map((service, index) => {
          const isSelected = selectedServices.includes(service);
          const info = getServiceInfo(service);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
              activeOpacity={0.7}
              onPress={() => toggleService(service)}
            >
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                  {service}
                </Text>
                <View style={styles.serviceMetaRow}>
                  {info.duration != null && (
                    <View style={styles.serviceMetaItem}>
                      <Ionicons name="time-outline" size={14} color={isSelected ? COLORS.primaryLight : COLORS.textMuted} />
                      <Text style={[styles.serviceMetaText, isSelected && styles.serviceMetaTextSelected]}>
                        {info.duration} dakika
                      </Text>
                    </View>
                  )}
                  {info.price != null && (
                    <View style={styles.serviceMetaItem}>
                      <Ionicons name="pricetag-outline" size={14} color={isSelected ? COLORS.primaryLight : COLORS.textMuted} />
                      <Text style={[styles.serviceMetaText, isSelected && styles.serviceMetaTextSelected]}>
                        {info.price} ₺
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next button */}
      <TouchableOpacity onPress={handleNextToDateTime} activeOpacity={0.8}>
        <LinearGradient colors={COLORS.headerGradient} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>TARİH/SAAT SEÇ</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderDateTimeStep = () => (
    <View style={styles.sectionContainer}>
      {/* Selected person + services summary */}
      <LinearGradient colors={COLORS.headerGradient} style={styles.selectedPersonBanner}>
        <View style={styles.selectedPersonRow}>
          {selectedPerson?.image ? (
            <Image source={{ uri: selectedPerson.image }} style={styles.selectedPersonAvatar} />
          ) : (
            <View style={[styles.selectedPersonAvatar, styles.selectedPersonAvatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#FFF" />
            </View>
          )}
          <View>
            <Text style={styles.selectedPersonName}>
              {selectedPerson?.name} {selectedPerson?.surname}
            </Text>
            <Text style={styles.selectedServicesCount}>
              {selectedServices.length} hizmet seçildi
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Date selection - Calendar */}
      <View style={styles.calendarContainer}>
        {/* Month navigation */}
        <View style={styles.calMonthRow}>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
              else setCalMonth(calMonth - 1);
            }}
            style={styles.calArrow}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.calMonthTitle}>
            {MONTHS_TR[calMonth]} {calYear}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
              else setCalMonth(calMonth + 1);
            }}
            style={styles.calArrow}
          >
            <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.calDivider} />

        {/* Day headers */}
        <View style={styles.calWeekRow}>
          {DAYS_HEADER.map((d) => (
            <Text key={d} style={styles.calWeekDay}>{d}</Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.calGrid}>
          {calendarDays.map((day, i) => {
            if (day === null) return <View key={`e${i}`} style={styles.calDayCell} />;
            const cellDate = new Date(calYear, calMonth, day);
            cellDate.setHours(0, 0, 0, 0);
            const isPast = cellDate < today;
            const isToday = cellDate.getTime() === today.getTime();
            const isSelected = selectedDate.toDateString() === cellDate.toDateString();
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.calDayCell,
                  isToday && !isSelected && styles.calDayCellToday,
                  isSelected && styles.calDayCellSelected,
                ]}
                disabled={isPast}
                activeOpacity={0.7}
                onPress={() => { setSelectedDate(cellDate); setSelectedTime(null); }}
              >
                <Text
                  style={[
                    styles.calDayText,
                    isPast && styles.calDayTextPast,
                    isToday && !isSelected && styles.calDayTextToday,
                    isSelected && styles.calDayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected date display with arrows */}
        <View style={styles.calSelectedRow}>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              prev.setHours(0, 0, 0, 0);
              if (prev >= today) {
                setSelectedDate(prev);
                if (prev.getMonth() !== calMonth || prev.getFullYear() !== calYear) {
                  setCalMonth(prev.getMonth());
                  setCalYear(prev.getFullYear());
                }
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.calSelectedText}>
            {selectedDate.getDate()} {MONTHS_TR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next);
              if (next.getMonth() !== calMonth || next.getFullYear() !== calYear) {
                setCalMonth(next.getMonth());
                setCalYear(next.getFullYear());
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time selection */}
      <View style={styles.timeSection}>
        <Text style={styles.dateSectionTitle}>Saat Seçin</Text>
        <View style={styles.timeGrid}>
          {(() => {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const isToday = selectedDate.getDate() === now.getDate() &&
              selectedDate.getMonth() === now.getMonth() &&
              selectedDate.getFullYear() === now.getFullYear();
            return timeSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              const [slotH, slotM] = slot.split(':').map(Number);
              const slotMinutes = slotH * 60 + slotM;
              const isPast = isToday && slotMinutes <= nowMinutes;
              return (
                <TouchableOpacity
                  key={slot}
                  disabled={isPast}
                  style={[styles.timeSlot, isSelected && styles.timeSlotSelected, isPast && styles.timeSlotDisabled]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected, isPast && styles.timeSlotTextDisabled]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>

      {/* Next button */}
      <TouchableOpacity onPress={handleNextToSummary} activeOpacity={0.8}>
        <LinearGradient colors={COLORS.headerGradient} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>ÖZET</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderSummaryStep = () => {
    const dateStr = `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    return (
      <View style={styles.sectionContainer}>
        <LinearGradient colors={COLORS.headerGradient} style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.sectionHeaderText}>Randevu Özeti</Text>
        </LinearGradient>

        <View style={styles.summaryCard}>
          {/* Personnel */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBg}>
              {selectedPerson?.image ? (
                <Image source={{ uri: selectedPerson.image }} style={styles.summaryPersonAvatar} />
              ) : (
                <Ionicons name="person" size={20} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Personel</Text>
              <Text style={styles.summaryValue}>
                {selectedPerson?.name} {selectedPerson?.surname}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Services */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBg}>
              <MaterialCommunityIcons name="content-cut" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Hizmetler</Text>
              {selectedServices.map((s, i) => (
                <Text key={i} style={styles.summaryServiceItem}>• {s}</Text>
              ))}
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Date */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Tarih</Text>
              <Text style={styles.summaryValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Time */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Saat</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8} disabled={submitting}>
          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={[styles.nextButton, submitting && { opacity: 0.7 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={22} color="#FFF" />
                <Text style={styles.nextButtonText}>RANDEVUYU ONAYLA</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={COLORS.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Ekranı</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}

          {step === 0 && renderPersonnelStep()}
          {step === 1 && renderServicesStep()}
          {step === 2 && renderDateTimeStep()}
          {step === 3 && renderSummaryStep()}

          <View style={{ height: 40 }} />
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
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
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

  // ── Step indicator ──
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleDone: {
    backgroundColor: COLORS.success,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: COLORS.success,
  },

  // ── Section ──
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Personnel cards ──
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusMedium,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personAvatarContainer: {
    marginRight: 14,
  },
  personAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  personAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  personServiceCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // ── Selected person banner ──
  selectedPersonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 12,
  },
  selectedPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedPersonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  selectedPersonAvatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPersonName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedServicesCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // ── Services ──
  servicesContainer: {
    marginBottom: 16,
  },
  servicesCategoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  servicesDivider: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusMedium,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  serviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F5F3FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: COLORS.primary,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  serviceMetaTextSelected: {
    color: COLORS.primaryLight,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // ── Calendar ──
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  calMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  calDayTextPast: {
    color: '#D1D5DB',
  },
  calDayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 16,
  },
  calNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calSelectedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },

  // ── Time ──
  timeSection: {
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusSmall,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 72,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  timeSlotTextDisabled: {
    color: '#B0B0B0',
  },

  // ── Next button ──
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Summary ──
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  summaryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  summaryPersonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  summaryServiceItem: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
});
