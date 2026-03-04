/**
 * TimeSlotSelector Component
 * 
 * Renders available appointment time slots filtered based on:
 * - Service duration
 * - Staff member's shift end time
 * - Flexible work toggle state
 * 
 * This is an example implementation for the AppointmentScreen
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import {
  checkSlotAvailability,
  generateTimeSlots,
  filterAvailableSlots,
} from '../utils/timeHelper';

const TimeSlotSelector = ({
  shiftStartTime = '10:00',
  shiftEndTime = '22:00',
  serviceDuration = 30, // in minutes
  isFlexibleWorkOn = false,
  onSlotSelect,
  selectedSlot,
  slotIntervalMinutes = 15,
}) => {
  // Generate and filter available slots
  const availableSlots = useMemo(() => {
    const allSlots = generateTimeSlots(shiftStartTime, shiftEndTime, slotIntervalMinutes);
    return filterAvailableSlots(allSlots, serviceDuration, shiftEndTime, isFlexibleWorkOn);
  }, [shiftStartTime, shiftEndTime, serviceDuration, isFlexibleWorkOn, slotIntervalMinutes]);

  // Generate all slots to show greyed-out unavailable ones
  const allSlots = useMemo(() => {
    return generateTimeSlots(shiftStartTime, shiftEndTime, slotIntervalMinutes);
  }, [shiftStartTime, shiftEndTime, slotIntervalMinutes]);

  const isSlotAvailable = (slot) => availableSlots.includes(slot);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Appointment Times</Text>
        <Text style={styles.subtitle}>
          {isFlexibleWorkOn ? '🔄 Flexible Work ON' : '⏰ Strict Schedule'}
        </Text>
        <Text style={styles.info}>
          Duration: {serviceDuration} min | Shift: {shiftStartTime} - {shiftEndTime}
        </Text>
      </View>

      <ScrollView 
        style={styles.slotsContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.slotsContent}
      >
        {allSlots.length > 0 ? (
          allSlots.map((slot) => {
            const available = isSlotAvailable(slot);
            const isSelected = selectedSlot === slot;

            return (
              <TouchableOpacity
                key={slot}
                disabled={!available}
                style={[
                  styles.slotButton,
                  isSelected && styles.slotButtonSelected,
                  !available && styles.slotButtonDisabled,
                ]}
                onPress={() => {
                  if (available && onSlotSelect) {
                    onSlotSelect(slot);
                  }
                }}
              >
                <Text
                  style={[
                    styles.slotText,
                    isSelected && styles.slotTextSelected,
                    !available && styles.slotTextDisabled,
                  ]}
                >
                  {slot}
                </Text>
                {!available && (
                  <Text style={styles.slotUnavailableLabel}>Unavailable</Text>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noSlotsContainer}>
            <Text style={styles.noSlotsText}>
              No available slots for {serviceDuration} min service
            </Text>
          </View>
        )}
      </ScrollView>

      {availableSlots.length > 0 && (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {availableSlots.length} of {allSlots.length} slots available
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    color: '#999',
  },
  slotsContainer: {
    flex: 1,
  },
  slotsContent: {
    padding: 12,
    gap: 8,
  },
  slotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 4,
    alignItems: 'center',
  },
  slotButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  slotButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  slotTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  slotTextDisabled: {
    color: '#999',
  },
  slotUnavailableLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noSlotsContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  stats: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default TimeSlotSelector;
