import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getPersonnel, getBookedSlots, createAppointment } from '../services/firebaseService';
import CalendarDatePicker from './CalendarDatePicker';

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

function isTimeInLunchBreak(timeSlot, lunchBreak) {
  if (!lunchBreak || !lunchBreak.start || !lunchBreak.end) return false;

  const [slotH, slotM] = timeSlot.split(':').map(Number);
  const slotMinutes = slotH * 60 + slotM;

  const [startH, startM] = lunchBreak.start.split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = lunchBreak.end.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

export default function AdminBookingModal({ visible, onClose, salon }) {
  const [step, setStep] = useState(0); // 0: customer name, 1: employee, 2: service, 3: date/time
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);

  // Data
  const [personnel, setPersonnel] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (visible) {
      loadPersonnel();
    }
  }, [visible]);

  // Fetch booked slots when employee or date changes
  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      getBookedSlots(selectedEmployee.id, dateStr)
        .then(setBookedSlots)
        .catch(() => setBookedSlots([]));
    } else {
      setBookedSlots([]);
    }
  }, [selectedEmployee, selectedDate]);

  const loadPersonnel = async () => {
    try {
      setLoading(true);
      const data = await getPersonnel(salon.id);
      setPersonnel(data);
    } catch (error) {
      console.error('Error loading personnel:', error);
      Alert.alert('Hata', 'Personel yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setStep(0);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedEmployee(null);
    setSelectedService(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
    onClose();
  };

  const handleNext = () => {
    if (step === 0) {
      if (!customerName.trim()) {
        Alert.alert('Uyarı', 'Lütfen müşteri adını girin.');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!selectedEmployee) {
        Alert.alert('Uyarı', 'Lütfen bir personel seçin.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedService) {
        Alert.alert('Uyarı', 'Lütfen bir hizmet seçin.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSaveAppointment = async () => {
    if (!selectedTime) {
      Alert.alert('Uyarı', 'Lütfen bir saat seçin.');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      await createAppointment({
        salonId: salon.id,
        userId: null, // Admin booking - no user ID
        userName: customerName.trim(),
        userPhone: customerPhone.trim(),
        personnelId: selectedEmployee.id,
        personnelName: `${selectedEmployee.name} ${selectedEmployee.surname}`,
        services: [selectedService],
        date: dateStr,
        time: selectedTime,
      });

      Alert.alert('Başarılı', 'Randevu başarıyla oluşturuldu!', [
        {
          text: 'Tamam',
          onPress: handleClose,
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Randevu oluşturulurken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      // Customer Name & Phone
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Müşteri Bilgileri</Text>
          <Text style={styles.stepDescription}>Müşteri adı ve telefon numarasını girin</Text>
          
          <Text style={styles.inputLabel}>Ad Soyadı</Text>
          <TextInput
            style={styles.input}
            placeholder="ör: Ahmet Yılmaz"
            placeholderTextColor="#94A3B8"
            value={customerName}
            onChangeText={setCustomerName}
          />
          
          <Text style={styles.inputLabel}>Telefon Numarası (İsteğe Bağlı)</Text>
          <TextInput
            style={styles.input}
            placeholder="ör: 555 123 4567"
            placeholderTextColor="#94A3B8"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </View>
      );
    }

    if (step === 1) {
      // Employee Selection
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Personel Seçin</Text>
          <Text style={styles.stepDescription}>Randevu hangi personel için?</Text>
          {personnel.map((emp) => (
            <TouchableOpacity
              key={emp.id}
              style={[
                styles.optionCard,
                selectedEmployee?.id === emp.id && styles.optionCardSelected,
              ]}
              onPress={() => {
                setSelectedEmployee(emp);
                setSelectedService(null); // Reset service
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionCardText, selectedEmployee?.id === emp.id && styles.optionCardTextSelected]}>
                {emp.name} {emp.surname}
              </Text>
              <Text style={[styles.optionCardSub, selectedEmployee?.id === emp.id && styles.optionCardSubSelected]}>
                {emp.role}
              </Text>
              {selectedEmployee?.id === emp.id && (
                <View style={styles.optionCheckmark}>
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (step === 2) {
      // Service Selection
      const getServiceName = (service) => {
        return typeof service === 'string' ? service : service?.name || 'Unknown';
      };

      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Hizmet Seçin</Text>
          <Text style={styles.stepDescription}>Hangi hizmeti sunacaksınız?</Text>
          {selectedEmployee?.services?.length > 0 ? (
            selectedEmployee.services.map((service, idx) => {
              const serviceName = getServiceName(service);
              const isSelected = selectedService === serviceName;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedService(serviceName)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionCardText, isSelected && styles.optionCardTextSelected]}>
                    {serviceName}
                  </Text>
                  {isSelected && (
                    <View style={styles.optionCheckmark}>
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Bu personel için hizmet tanımlanmamış.</Text>
          )}
        </View>
      );
    }

    if (step === 3) {
      // Date & Time Selection
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Tarih ve Saat Seçin</Text>
          <Text style={styles.stepDescription}>Randevu hangi tarih ve saatte?</Text>

          {/* Beautiful Calendar Date Picker */}
          <CalendarDatePicker
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            selectedPerson={selectedEmployee}
            colors={{
              calendarBg: '#FFFFFF',
              border: '#E2E8F0',
              textPrimary: '#1F2937',
            }}
            minDate={new Date()}
          />

          {/* Time Picker */}
          <View style={styles.timePickerSection}>
            <Text style={styles.dateSectionLabel}>Saat</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isLunchBreak = isTimeInLunchBreak(slot, selectedEmployee?.lunchBreak);
                const isDisabled = isBooked || isLunchBreak;
                const isSelected = selectedTime === slot;

                return (
                  <TouchableOpacity
                    key={slot}
                    disabled={isDisabled}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotSelected,
                      isDisabled && styles.timeSlotDisabled,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                        isDisabled && styles.timeSlotTextDisabled,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Randevu Ekle</Text>
          <Text style={styles.stepIndicator}>Adım {step + 1} / 4</Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {renderStepContent()}
          </ScrollView>
        )}

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleBack}>
              <Text style={styles.buttonSecondaryText}>Geri</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, !step && { marginLeft: 0 }]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>İleri</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, !step && { marginLeft: 0 }]}
              onPress={handleSaveAppointment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Randevu Oluştur</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: SIZES.radiusMedium,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F5F3FF',
  },
  optionCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionCardTextSelected: {
    color: COLORS.primary,
  },
  optionCardSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  optionCardSubSelected: {
    color: COLORS.primaryLight,
  },
  optionCheckmark: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -9,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  datePickerSection: {
    marginBottom: 24,
  },
  dateSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  dateDisplayText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerSection: {
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 70,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
