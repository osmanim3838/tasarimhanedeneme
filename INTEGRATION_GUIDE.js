/**
 * INTEGRATION GUIDE: Flexible Work Toggle Implementation
 * 
 * How to integrate the TimeSlotSelector and timeHelper into your AppointmentScreen
 */

// ============================================================================
// STEP 1: Import the helper functions and component
// ============================================================================

import { checkSlotAvailability, filterAvailableSlots, generateTimeSlots } from '../utils/timeHelper';
import TimeSlotSelector from '../components/TimeSlotSelector';

// ============================================================================
// STEP 2: Example integration in AppointmentScreen.js
// ============================================================================

/*
import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import TimeSlotSelector from '../components/TimeSlotSelector';
import { UserContext } from '../context/UserContext';

const AppointmentScreen = () => {
  const { user, selectedService, employee } = useContext(UserContext);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const shiftStartTime = employee?.shiftStart || '10:00';
  const shiftEndTime = employee?.shiftEnd || '22:00';
  const isFlexibleWorkOn = employee?.isFlexibleWorkEnabled || false;
  const serviceDuration = selectedService?.duration || 30; // minutes

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    console.log(`Selected slot: ${slot}`);
    // Continue with booking logic...
  };

  return (
    <View style={styles.container}>
      <TimeSlotSelector
        shiftStartTime={shiftStartTime}
        shiftEndTime={shiftEndTime}
        serviceDuration={serviceDuration}
        isFlexibleWorkOn={isFlexibleWorkOn}
        selectedSlot={selectedSlot}
        onSlotSelect={handleSlotSelection}
        slotIntervalMinutes={15}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default AppointmentScreen;
*/

// ============================================================================
// STEP 3: Manual Filtering Example (if you need custom logic)
// ============================================================================

/*
import { checkSlotAvailability } from '../utils/timeHelper';

// Example: You have all possible 15-min slots from 10:00 to 22:00
const allSlots = ['10:00', '10:15', '10:30', ..., '21:45'];

// Filter based on flexible work toggle
const filteredSlots = allSlots.filter(slot =>
  checkSlotAvailability(
    slot,
    selectedService.duration,      // e.g., 30 minutes
    employee.shiftEnd,            // e.g., "22:00"
    employee.isFlexibleWorkEnabled // true or false
  )
);

// Render the filtered slots
const slotButtons = filteredSlots.map(slot => (
  <TouchableOpacity
    key={slot}
    onPress={() => setSelectedSlot(slot)}
    style={styles.slotButton}
  >
    <Text>{slot}</Text>
  </TouchableOpacity>
));
*/

// ============================================================================
// STEP 4: Firebase Schema Updates
// ============================================================================

/*
When storing employee data in Firebase, add the flexible work toggle:

// /employees/{employeeId}
{
  "id": "emp_001",
  "name": "Mehmet",
  "shiftStart": "10:00",
  "shiftEnd": "22:00",
  "isFlexibleWorkEnabled": false,  // <-- NEW FIELD
  "services": ["haircut", "beard"],
  ...
}

// Update Realtime Database or Firestore accordingly
*/

// ============================================================================
// STEP 5: Business Logic Test Cases
// ============================================================================

/*
TEST CASE 1: Strict Mode (toggle OFF)
- Shift: 10:00 - 22:00
- Service: 30 minutes
- Slot "21:45": 21:45 + 30 = 22:15 (AFTER 22:00)
- Result: BLOCKED ❌

TEST CASE 2: Flexible Mode (toggle ON), Same Setup
- Shift: 10:00 - 22:00
- Service: 30 minutes
- Slot "21:45": Starts BEFORE 22:00 ✓
- Result: ALLOWED ✅ (Employee stays until 22:15)

TEST CASE 3: Security Rule - Slot at shift end
- Shift ends at 22:00
- Slot "22:00": Starts AT or AFTER shift end
- Result: BLOCKED ❌ (Both modes)

TEST CASE 4: Strict Mode - Last valid slot
- Shift: 10:00 - 22:00
- Service: 15 minutes
- Slot "21:45": 21:45 + 15 = 22:00 (Exactly at shift end)
- Result: ALLOWED ✅

TEST CASE 5: Multiple filters with services
- Services: ["haircut" (30min), "beard" (15min), "full" (60min)]
- Flexible: OFF
- Available slots for "haircut": More than for "full"
- Result: Correct filtering per service ✅
*/

// ============================================================================
// STEP 6: Helper Function Quick Reference
// ============================================================================

/*
checkSlotAvailability(slotStartTime, serviceDuration, shiftEndTime, isFlexibleWorkOn)
├─ Rule 1 (Security): Rejects slots >= shiftEndTime
├─ Rule 2 (Strict): Accepts only if (slotStart + duration) <= shiftEnd
├─ Rule 3 (Flexible): Accepts only if slotStart < shiftEnd
└─ Returns: boolean

generateTimeSlots(shiftStart, shiftEnd, interval)
├─ Generates all slots from shiftStart to shiftEnd
├─ Never includes the shiftEnd time itself
└─ Returns: Array of "HH:mm" strings

filterAvailableSlots(slots, duration, shiftEnd, isFlexible)
├─ Filters array using checkSlotAvailability
└─ Returns: Array of available "HH:mm" strings
*/

// ============================================================================
// STEP 7: Toggle Implementation in Employee Profile
// ============================================================================

/*
// In your EmployeeDashboardScreen or EmployeeProfileScreen:

import { Switch } from 'react-native-gesture-handler';
import { updateEmployeeFlexibleWork } from '../services/firebaseService';

const EmployeeProfileScreen = () => {
  const [isFlexibleWorkOn, setIsFlexibleWorkOn] = useState(false);

  const handleToggle = async (value) => {
    setIsFlexibleWorkOn(value);
    await updateEmployeeFlexibleWork(currentEmployee.id, value);
  };

  return (
    <View>
      <Text>Flexible Work Mode</Text>
      <Switch
        value={isFlexibleWorkOn}
        onValueChange={handleToggle}
      />
      <Text style={{ fontSize: 12, color: '#666' }}>
        {isFlexibleWorkOn
          ? 'ON: Can accept bookings that finish after shift'
          : 'OFF: Strict schedule - all services must finish by shift end'}
      </Text>
    </View>
  );
};
*/

// ============================================================================
// STEP 8: Common Issues & Solutions
// ============================================================================

/*
ISSUE 1: Slots appearing at or after shift end time
SOLUTION: Ensure you're using generateTimeSlots() which has built-in protection,
          or manually ensure: slot < shiftEnd in your loop

ISSUE 2: Same slots available regardless of toggle state
SOLUTION: Ensure isFlexibleWorkOn is being passed correctly from context/state
          Debug with console.logs in checkSlotAvailability()

ISSUE 3: Time conversion problems (24-hour format)
SOLUTION: Use timeToMinutes() and minutesToTime() helpers
          They handle zero-padding and conversion automatically

ISSUE 4: Performance issues with many slots
SOLUTION: Use useMemo() to cache filtered results (already done in TimeSlotSelector)
          Recalculate only when dependencies change
*/

export { checkSlotAvailability, filterAvailableSlots, generateTimeSlots };
