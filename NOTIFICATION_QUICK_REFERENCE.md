# 🔔 Notification System - Quick Reference

## What's Implemented

### ✅ Push Notifications for Personnel
When a customer books an appointment, personnel automatically receive a push notification:
```
🎯 Yeni Randevu
[Customer Name] müşteri [Date] [Time]'de randevu aldı.
📌 Hizmet: [Services]
```

### ✅ Push Notifications for Customers
When booking an appointment, customers receive an instant confirmation:
```
✅ Randevu Onaylandı
[Date] saat [Time]'de randevunuz [Personnel] ile onaylanmıştır.
📌 Hizmet: [Services]
```

### ✅ Automatic WhatsApp Reminders
1 hour before the appointment, customers receive a WhatsApp message:
```
Merhaba [Customer],

TASARIMHANE randevu hatırlatması:

📅 Tarih: [Date]
🕰 Saat: [Time]
✂️ Hizmet: [Services]
💇 Personel: [Personnel Name]

Sizi bekliyor olacağız. İyi günler!
```

### ✅ NEW: Cancellation Notifications
When personnel cancels an appointment, customer receives:
```
❌ Randevu İptal Edildi
[Date] [Time]'deki randevunuz iptal edilmiştir.
```

### ✅ NEW: Completion Notifications
When personnel marks appointment as complete, customer receives:
```
✅ Hizmet Tamamlandı
[Personnel] tarafından sunulan hizmetiniz tamamlanmıştır.
Ziyaret ettiğiniz için teşekkürler!
```

### ✅ NEW: Re-confirmation Notifications
When appointment is confirmed (useful for rescheduling), customer receives the confirmation message again.

---

## 📊 Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│          CUSTOMER BOOKS APPOINTMENT                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    📱 PUSH TO     📱 PUSH TO     💬 WHATSAPP
    PERSONNEL     CUSTOMER       REMINDER
    
    🎯 Yeni      ✅ Randevu    📅 Scheduled
    Randevu      Onaylandı     1hr before


▼ (Personnel lifecycle management) ▼

┌─────────────────────────────────────────────────────────────┐
│        PERSONNEL UPDATES APPOINTMENT STATUS                 │
└──────────────┬──────────────────────┬──────────────────────┘
               │                      │
    ┌──────────┴──────┐      ┌────────┴──────────┐
    │                 │      │                   │
    ▼                 ▼      ▼                   ▼
Cancel Status    Complete      Confirm       Unknown
    │             Status       Status          Status
    │               │             │
    │               │             │
    ▼               ▼             ▼
❌ Cancel      ✅ Completed   ✅ Confirmed
Notification   Notification   Notification


📱 ALL SENT TO CUSTOMER
```

---

## 🔐 Registration Flow

```
USER/EMPLOYEE LOGS IN
        │
        ▼
PushNotificationManager detects login
        │
        ▼
getExpoPushToken() from device
        │
        ▼
registerPushTokenForUser/Employee()
        │
        ▼
Firebase stores: users/{userId}/expoPushToken
               OR personnel/{empId}/expoPushToken
        │
        ▼
✅ Ready to receive notifications
```

---

## 📱 Technologies Used

- **Expo Notifications** - Push notification service
- **Firebase Cloud Firestore** - Token and appointment storage
- **Firebase Realtime Updates** - Get appointment details
- **Expo Push API** - Send notifications to devices
- **WhatsApp API** - Send reminder messages (via backend)

---

## 🎯 User Journey

### Customer Path:
```
1. Open app → Login with phone
2. Browse services and personnel
3. Select date, time, and services
4. Confirm appointment
   ▼ 📱 PUSH: Appointment confirmed
5. Receive reminder
   ▼ 💬 WHATSAPP: 1 hour before appointment
6. Attend appointment
7. Receive completion notification
   ▼ 📱 PUSH: Thank you message
```

### Personnel Path:
```
1. Open app → Login with credentials
2. View all appointments
   ▼ 📱 PUSH: New appointment notification (on new booking)
3. Accept/Confirm appointment
   ▼ 📱 PUSH sent to customer: Confirmation
4. Complete appointment
   ▼ 📱 PUSH sent to customer: Thank you
5. OR Cancel appointment
   ▼ 📱 PUSH sent to customer: Cancellation
```

---

## 🧪 How to Test

### Test 1: Book Appointment
1. Login as customer (AppointmentScreen)
2. Select personnel, services, date, time
3. Click confirm
4. ✅ You should see push notification from personnel's phone
5. ✅ You should see push notification on your phone

### Test 2: Cancel Appointment
1. Login as personnel
2. Go to PersonnelAppointmentsScreen
3. Find appointment and click "Iptal Et" (Cancel)
4. ✅ Customer should receive cancellation notification

### Test 3: Complete Appointment
1. Login as personnel
2. Go to PersonnelAppointmentsScreen
3. Find appointment and click "Tamamla" (Complete)
4. ✅ Customer should receive completion notification

### Test 4: WhatsApp Reminder
1. Book appointment for future time
2. Wait for 1 hour before appointment time
3. ✅ Customer should receive WhatsApp message from TASARIMHANE

---

## ⚙️ Configuration

### Expo Project ID
- Location: `src/services/PushNotificationManager.js` line 19
- Current value: `'541303114598'` (from google-services.json messagingSenderId)
- This connects to Firebase Cloud Messaging

### Firebase Collections
- `users` - Customer profiles with expoPushToken
- `personnel` - Employee profiles with expoPushToken
- `appointments` - Appointment records
- `reminders` - WhatsApp reminder queue

---

## 🐛 Debugging

### Enable Logging
Check browser/simulator console:
```javascript
console.log('📲 Expo Push Token:', token);
console.log('✅ Push token registered for user:', userId);
console.log('✅ Push notification sent to employee:', employeeId);
```

### Common Issues

| Issue | Solution |
|-------|----------|
| No notifications received | Ensure user is logged in and has a push token registered |
| Token not stored | Check Firebase Firestore for users/{userId}/expoPushToken |
| Notification error in logs | Check if expoPushToken exists and is valid |
| WhatsApp reminder not received | Verify phone number format and backend service running |

---

**Status:** ✅ Complete Implementation Active
**Last Updated:** March 7, 2026
