/**
 * CalendarDatePicker Component
 * Reusable calendar UI for date selection
 * Used in both AppointmentScreen and AdminBookingModal
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

// Turkish month names
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const DAYS_HEADER = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

// Map Turkish day-off names to JS getDay() values (0=Sun,1=Mon,...,6=Sat)
const DAY_OFF_MAP = {
  'Pazartesi': 1,
  'Salı': 2,
  'Çarşamba': 3,
  'Perşembe': 4,
  'Cuma': 5,
  'Cumartesi': 6,
  'Pazar': 0,
};

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function CalendarDatePicker({
  selectedDate,
  onSelectDate,
  selectedPerson,
  colors = { calendarBg: '#FFFFFF', border: '#E2E8F0', textPrimary: '#1F2937' },
  minDate = new Date(),
}) {
  const [calMonth, setCalMonth] = useState(selectedDate.getMonth());
  const [calYear, setCalYear] = useState(selectedDate.getFullYear());

  const calendarDays = getCalendarDays(calYear, calMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handlePrevDate = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);
    
    // Skip day-off days
    const dayOffNum = selectedPerson?.dayOff ? DAY_OFF_MAP[selectedPerson.dayOff] : undefined;
    while (dayOffNum !== undefined && prev.getDay() === dayOffNum && prev >= minDate) {
      prev.setDate(prev.getDate() - 1);
    }
    
    if (prev >= minDate) {
      onSelectDate(prev);
      if (prev.getMonth() !== calMonth || prev.getFullYear() !== calYear) {
        setCalMonth(prev.getMonth());
        setCalYear(prev.getFullYear());
      }
    }
  };

  const handleNextDate = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    
    // Skip day-off days
    const dayOffNum = selectedPerson?.dayOff ? DAY_OFF_MAP[selectedPerson.dayOff] : undefined;
    while (dayOffNum !== undefined && next.getDay() === dayOffNum) {
      next.setDate(next.getDate() + 1);
    }
    
    onSelectDate(next);
    if (next.getMonth() !== calMonth || next.getFullYear() !== calYear) {
      setCalMonth(next.getMonth());
      setCalYear(next.getFullYear());
    }
  };

  return (
    <View style={[styles.calendarContainer, { backgroundColor: colors.calendarBg, borderColor: colors.border }]}>
      {/* Month navigation */}
      <View style={styles.calMonthRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.calArrow}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.calMonthTitle, { color: colors.textPrimary }]}>
          {MONTHS_TR[calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.calArrow}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calDivider} />

      {/* Day headers */}
      <View style={styles.calWeekRow}>
        {DAYS_HEADER.map((d) => (
          <Text key={d} style={styles.calWeekDay}>
            {d}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.calGrid}>
        {calendarDays.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.calDayCell} />;

          const cellDate = new Date(calYear, calMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          
          const isPast = cellDate < minDate;
          const isDayOff = !!(selectedPerson?.dayOff && DAY_OFF_MAP[selectedPerson.dayOff] === cellDate.getDay());
          const isDisabled = !!(isPast || isDayOff);
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = selectedDate.toDateString() === cellDate.toDateString();

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calDayCell,
                isToday && !isSelected && styles.calDayCellToday,
                isSelected && !isDayOff && styles.calDayCellSelected,
                isDayOff && !isPast && styles.calDayCellDayOff,
              ]}
              disabled={isDisabled}
              activeOpacity={0.7}
              onPress={() => onSelectDate(cellDate)}
            >
              <Text
                style={[
                  styles.calDayText,
                  isPast && styles.calDayTextPast,
                  isDayOff && !isPast && styles.calDayTextDayOff,
                  isToday && !isSelected && !isDayOff && styles.calDayTextToday,
                  isSelected && !isDayOff && styles.calDayTextSelected,
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
        <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevDate}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.calSelectedText, { color: colors.textPrimary }]}>
          {selectedDate.getDate()} {MONTHS_TR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        <TouchableOpacity style={styles.calNavBtn} onPress={handleNextDate}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
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
  calDayCellDayOff: {
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  calDayTextDayOff: {
    color: '#EF4444',
    fontWeight: '600',
    textDecorationLine: 'line-through',
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
  },
});
