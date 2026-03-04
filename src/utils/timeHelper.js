/**
 * Time Helper Utilities for Flexible Work Appointment Logic
 * Handles conversion and comparison of shift times with appointment slots
 */

/**
 * Convert HH:mm time string to minutes since midnight
 * @param {string} timeStr - Time in HH:mm format (e.g., "14:30")
 * @returns {number} Minutes since midnight (e.g., 870 for 14:30)
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight back to HH:mm format
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:mm format
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Main function: Check if a time slot is available based on shift constraints and flexible work setting
 * 
 * BUSINESS RULES:
 * - Rule 1 (Strict Mode): Appointment must finish at or before shift ends
 * - Rule 2 (Flexible Mode): Appointment only needs to START before shift ends (can finish after)
 * - Rule 3 (Security): Slots at or after shift end time must NEVER be available
 * 
 * @param {string} slotStartTime - Slot start time in HH:mm format (e.g., "21:45")
 * @param {number} serviceDuration - Service duration in minutes (e.g., 30)
 * @param {string} shiftEndTime - Shift end time in HH:mm format (e.g., "22:00")
 * @param {boolean} isFlexibleWorkOn - Whether flexible work is enabled (true/false)
 * @returns {boolean} True if slot is available, false otherwise
 * 
 * @example
 * // Strict mode: 21:45 + 30min = 22:15 (after 22:00 shift end) = BLOCKED
 * checkSlotAvailability("21:45", 30, "22:00", false); // returns false
 * 
 * // Flexible mode: 21:45 starts before 22:00 = ALLOWED
 * checkSlotAvailability("21:45", 30, "22:00", true); // returns true
 */
const checkSlotAvailability = (slotStartTime, serviceDuration, shiftEndTime, isFlexibleWorkOn) => {
  const slotStartMinutes = timeToMinutes(slotStartTime);
  const shiftEndMinutes = timeToMinutes(shiftEndTime);
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  // Rule 3 (CRITICAL): Never allow slots at or after shift end time
  if (slotStartMinutes >= shiftEndMinutes) {
    console.warn(
      `⚠️ Slot ${slotStartTime} is at or after shift end ${shiftEndTime}. Blocking.`
    );
    return false;
  }

  if (isFlexibleWorkOn) {
    // Rule 2: Flexible Mode - Just needs to START before shift ends
    const isAvailable = slotStartMinutes < shiftEndMinutes;
    if (!isAvailable) {
      console.warn(
        `Flexible mode: Slot ${slotStartTime} starts at/after shift end ${shiftEndTime}.`
      );
    }
    return isAvailable;
  } else {
    // Rule 1: Strict Mode - Must FINISH at or before shift ends
    const isAvailable = slotEndMinutes <= shiftEndMinutes;
    if (!isAvailable) {
      console.warn(
        `Strict mode: Slot ${slotStartTime} + ${serviceDuration}min = ${minutesToTime(slotEndMinutes)} ends after shift ${shiftEndTime}.`
      );
    }
    return isAvailable;
  }
};

/**
 * Generate available time slots for a given day, respecting shift boundaries
 * @param {string} shiftStartTime - Shift start time in HH:mm format
 * @param {string} shiftEndTime - Shift end time in HH:mm format
 * @param {number} slotIntervalMinutes - Interval between slots (e.g., 15 for 15-min intervals)
 * @returns {Array<string>} Array of time slot strings in HH:mm format
 * 
 * @example
 * generateTimeSlots("10:00", "22:00", 15);
 * // Returns: ["10:00", "10:15", "10:30", ..., "21:45"]
 * // Note: "22:00" is NOT included (never at or after shift end)
 */
const generateTimeSlots = (shiftStartTime, shiftEndTime, slotIntervalMinutes = 15) => {
  const startMinutes = timeToMinutes(shiftStartTime);
  const endMinutes = timeToMinutes(shiftEndTime);
  const slots = [];

  for (let time = startMinutes; time < endMinutes; time += slotIntervalMinutes) {
    slots.push(minutesToTime(time));
  }

  return slots;
};

/**
 * Filter time slots based on service duration and flex work setting
 * @param {Array<string>} slots - Array of time slot strings in HH:mm format
 * @param {number} serviceDuration - Service duration in minutes
 * @param {string} shiftEndTime - Shift end time in HH:mm format
 * @param {boolean} isFlexibleWorkOn - Whether flexible work is enabled
 * @returns {Array<string>} Filtered array of available slots
 */
const filterAvailableSlots = (slots, serviceDuration, shiftEndTime, isFlexibleWorkOn) => {
  return slots.filter(slot =>
    checkSlotAvailability(slot, serviceDuration, shiftEndTime, isFlexibleWorkOn)
  );
};

export {
  timeToMinutes,
  minutesToTime,
  checkSlotAvailability,
  generateTimeSlots,
  filterAvailableSlots,
};
