# 📱 Appointment Notification System - Implementation Guide

## Overview
The app now has a complete push notification system that automatically sends notifications to both personnel and customers when appointments are created or their status changes.

---

## 🎯 Notification Triggers

### 1. **When Customer Books an Appointment** ✅
**Location:** `AppointmentScreen.js` → `createAppointment()`

#### Notification to Personnel (Employee):
- **Title:** 🎯 Yeni Randevu
- **Message:** "[Customer Name] adlı müşteri [Date] tarihinde saat [Time]'de randevu aldı. 📌 Hizmet: [Services]"
- **Trigger:** Immediately when appointment is created
- **Recipients:** All personnel in the appointment

#### Notification to Customer:
- **Title:** ✅ Randevu Onaylandı
- **Message:** "[Date] tarihinde saat [Time]'de randevunuz onaylanmıştır. 👤 Personel: [Personnel Name] 📌 Hizmet: [Services]"
- **Trigger:** Immediately when appointment is created
- **Recipients:** Customer who booked the appointment

#### WhatsApp Reminder (Automatic):
- **Message:** Formatted appointment details with date, time, services, and personnel
- **Trigger:** Automatically scheduled for 1 hour before appointment
- **Recipients:** Customer's phone number
- **Status:** Sent via backend service

---

### 2. **When Appointment is Cancelled** ✅ (NEW)
**Location:** `PersonnelAppointmentsScreen.js` → `updateAppointmentStatus('cancelled')`

#### Notification to Customer:
- **Title:** ❌ Randevu İptal Edildi
- **Message:** "[Date] tarihindeki [Time] saatindeki randevunuz iptal edilmiştir."
- **Trigger:** When personnel clicks "Cancel" button
- **Action:** Pending WhatsApp reminders are also cancelled

---

### 3. **When Appointment is Completed** ✅ (NEW)
**Location:** `PersonnelAppointmentsScreen.js` → `updateAppointmentStatus('completed')`

#### Notification to Customer:
- **Title:** ✅ Hizmet Tamamlandı
- **Message:** "[Personnel Name] tarafından sunulan hizmetiniz tamamlanmıştır. Ziyaret ettiğiniz için teşekkürler!"
- **Trigger:** When personnel marks appointment as complete
- **Purpose:** Thank you message and service confirmation

---

### 4. **When Appointment is Re-confirmed** ✅ (NEW)
**Location:** `PersonnelAppointmentsScreen.js` → `updateAppointmentStatus('confirmed')`

#### Notification to Customer:
- **Title:** ✅ Randevu Onaylandı
- **Message:** "[Date] tarihinde saat [Time]'de randevunuz onaylanmıştır. 👤 Personel: [Personnel Name] 📌 Hizmet: [Services]"
- **Trigger:** When appointment status is set to confirmed (useful for re-confirmations)

---

## 🔧 Technical Implementation

### Architecture

```
App.js
  └── PushNotificationManager
       ├── Registers device push token on user/employee login
       ├── Stores token in Firebase (users/personnel collection)
       └── Listens for incoming notifications
```

### Key Components

#### 1. **PushNotificationManager** (`src/services/PushNotificationManager.js`)
- Initializes notification handler
- Gets device's Expo Push Token
- Registers token in Firebase for both users and employees
- Automatically updates when user logs in/out

#### 2. **Firebase Service** (`src/services/firebaseService.js`)
Push notification functions:

- `registerPushTokenForUser(userId, token)` - Saves user's push token
- `registerPushTokenForEmployee(employeeId, token)` - Saves employee's push token
- `sendPushNotificationToUser(userId, title, body, data)` - Sends to specific user
- `sendPushNotificationToEmployee(employeeId, title, body, data)` - Sends to employee
- `sendPushNotificationToUserByPhone(phone, title, body, data)` - Sends by phone number
- `createAppointment(data)` - Creates appointment + sends initial notifications
- `updateAppointmentStatus(appointmentId, status)` - Updates status + sends status notifications

### Data Flow

```
Customer Books Appointment
    ↓
createAppointment() called
    ├─ Save to appointments collection
    ├─ Send notification to Employee via Expo Push API
    ├─ Send notification to Customer via Expo Push API
    └─ Create WhatsApp reminder (1 hour before)
    
Personnel Updates Status
    ↓
updateAppointmentStatus() called
    ├─ Update appointment status in Firebase
    ├─ If cancelled: Cancel pending reminders
    └─ Send appropriate notification based on new status:
        ├─ 'cancelled' → Cancellation notification
        ├─ 'completed' → Completion notification
        └─ 'confirmed' → Confirmation notification
```

---

## 💾 Data Storage

### Push Tokens
- **Users:** `users/{userId}/expoPushToken`
- **Personnel:** `personnel/{personnelId}/expoPushToken`

### Reminders
- **Collection:** `reminders/`
- **Fields:**
  - `appointmentId` - Reference to appointment
  - `phone` - Normalized phone number (90XXXXXXXXXX)
  - `message` - WhatsApp message content
  - `sendAt` - Scheduled send time
  - `status` - 'pending' or 'cancelled'
  - `createdAt` - Creation timestamp

### Appointments
- **Collection:** `appointments/`
- **Status values:** 'confirmed', 'cancelled', 'completed', 'pending'

---

## 🚀 How to Use

### For Customers:
1. Book an appointment through AppointmentScreen
2. Receive instant push notification confirming the appointment
3. Receive WhatsApp reminder 1 hour before appointment
4. Receive notifications for status changes (cancellation, completion)

### For Personnel:
1. Receive push notification when customer books appointment
2. View appointments in PersonnelAppointmentsScreen
3. Update status to confirm, cancel, or complete
4. Customer automatically receives notification about status change

---

## 📝 Requirements

- Device must have Expo Notifications enabled
- User/Employee must be logged in (to have a registered push token)
- Firebase database with `users`, `personnel`, `appointments`, and `reminders` collections
- Expo project configured with proper `projectId`

---

## ✅ Testing Checklist

- [ ] Book an appointment and verify both personnel and customer receive notifications
- [ ] Cancel an appointment and verify customer receives cancellation notification
- [ ] Complete an appointment and verify customer receives completion notification
- [ ] Verify push tokens are stored in Firebase after login
- [ ] Verify WhatsApp reminders are scheduled 1 hour before appointment
- [ ] Test on both user and employee logins

---

## 🔗 Related Files

- `App.js` - App initialization with PushNotificationManager
- `src/services/PushNotificationManager.js` - Notification setup
- `src/services/firebaseService.js` - Firebase operations and notifications
- `src/screens/AppointmentScreen.js` - Customer appointment booking
- `src/screens/PersonnelAppointmentsScreen.js` - Personnel appointment management
- `server/index.js` - Backend WhatsApp reminder service

---

## 🐛 Troubleshooting

### Notifications not received?
1. Check that user/employee is logged in
2. Verify push token is stored in Firebase
3. Ensure notification permissions are granted on device
4. Check browser console for errors in `firebaseService.js`

### Phone number issues?
- Phone numbers are normalized to 10-digit format internally
- Service handles various formats: +905551234567, 05551234567, 5551234567, etc.

### WhatsApp reminders not working?
- Verify phone number is stored correctly
- Check backend service (server/index.js) is running
- Reminders are scheduled via backend, not the app

---

**Last Updated:** March 7, 2026
**Version:** 1.0 - Complete Implementation with Status Change Notifications
