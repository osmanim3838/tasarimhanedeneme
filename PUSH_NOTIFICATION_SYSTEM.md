/**
 * PUSH NOTIFICATION SYSTEM - COMPLETE IMPLEMENTATION GUIDE
 * ==========================================================
 * 
 * This document explains how the push notification system works after the updates.
 */

// ==================== 1. INITIALIZATION FLOW ====================
/*
   App.js
   ├── ThemeProvider
   │   └── UserProvider
   │       └── AppContent()
   │           ├── PushNotificationManager
   │           │   ├── Sets up Notifications handler
   │           │   ├── Gets device's Expo Push Token
   │           │   └── Registers token in Firebase (users/employees collection)
   │           │
   │           ├── AppNavigator
   │           │   └── Screens (screens log in/out users)
   │           │
   │           └── NoInternetOverlay
*/

// ==================== 2. FCM TOKEN REGISTRATION FLOW ====================
/*
   When user/employee LOGS IN:
   
   1. UserContext updates: user.id or employee.id changes
   2. PushNotificationManager detects the change (useEffect dependency)
   3. Calls Notifications.getExpoPushTokenAsync()
   4. Gets token like: "ExponentPushToken[xxxxx...]"
   5. Calls registerPushTokenForUser() or registerPushTokenForEmployee()
   6. Token saved in Firebase:
      - users/{userId}/expoPushToken = "ExponentPushToken[...]"
      - personnel/{employeeId}/expoPushToken = "ExponentPushToken[...]"
      
   When user/employee LOGS OUT:
   - UserContext clears user/employee data
   - PushNotificationManager's useEffect cleanup would happen
   - Token remains in Firebase (user can still receive notifications via that device)
*/

// ==================== 3. PHONE NUMBER NORMALIZATION ====================
/*
   CRITICAL: Phone numbers must be stored consistently!
   
   Function: normalizePhone(phone)
   Location: src/services/firebaseService.js (exported)
   
   Converts ANY phone format to 10-digit format:
   
   Examples:
   - "905551234567"    → "5551234567"
   - "+905551234567"   → "5551234567"
   - "05551234567"     → "5551234567"
   - "+90 555 123 4567" → "5551234567"
   - "(555) 123-4567"  → "5551234567"
   
   USED IN:
   - createOrGetUser(phone, ...) - Saves normalized phone
   - getUserByPhone(phone) - Queries by normalized phone
   - sendPushNotificationToUserByPhone(phone, ...) - Finds user by normalized phone
*/

// ==================== 4. APPOINTMENT CREATION FLOW ====================
/*
   When createAppointment(data) is called with:
   {
     userId: "user-123",
     userPhone: "905551234567",
     userName: "Ali",
     personnelId: "emp-456",
     personnelName: "Fatma",
     date: "2026-03-10",
     time: "14:30",
     services: ["Saç Kesimi", "Saç Boyama"]
   }
   
   STEP 1: Create appointment in Firebase
   ├── Save to appointments/{appointmentId}
   
   STEP 2: Send notification to EMPLOYEE
   ├── Get personnel/{personnelId}
   ├── Extract expoPushToken
   ├── Send via Expo Push API
   ├── Title: "🎯 Yeni Randevu"
   ├── Body: "[Customer name] ordered appointment on [date] at [time]"
   
   STEP 3: Send notification to CUSTOMER
   ├── Get users/{userId}
   ├── Extract expoPushToken
   ├── Send via Expo Push API
   ├── Title: "✅ Randevu Onaylandı"
   ├── Body: "Your appointment on [date] at [time] is confirmed with [employee]"
   
   STEP 4: Create WhatsApp reminder (1 hour before)
   ├── Normalize phone: "905551234567" → "5551234567"
   ├── Save to reminders/{reminderId}
   ├── Backend (server/index.js) will pick this up and send WhatsApp
*/

// ==================== 5. FINDING USER BY PHONE NUMBER ====================
/*
   SCENARIO: Backend needs to send notification based on phone number
   
   Function: sendPushNotificationToUserByPhone(phone, title, body, data)
   
   PROCESS:
   1. Normalize phone: sendPushNotificationToUserByPhone("905551234567")
   2. Create query: where('phone', '==', '5551234567')
   3. Find user in Firebase: users collection
   4. Extract user's expoPushToken
   5. Send via Expo Push API
   
   EXAMPLE:
   ```javascript
   await sendPushNotificationToUserByPhone(
     "905551234567",
     "⏰ Randevu Hatırlatması",
     "30 dakika sonra sorumlu personeliz Fatma ile randevunuz var",
     { appointmentId: "apt-123" }
   );
   ```
*/

// ==================== 6. DATABASE SCHEMA ====================
/*
   USERS COLLECTION:
   users/{userId}
   {
     firstName: "Ali",
     lastName: "Kaya",
     phone: "5551234567",              // NORMALIZED (10-digit)
     expoPushToken: "ExponentPushToken[xxxx...]",  // Device token
     pushTokenUpdatedAt: Timestamp,    // When token was registered
     createdAt: Timestamp
   }
   
   PERSONNEL COLLECTION:
   personnel/{employeeId}
   {
     name: "Fatma",
     surname: "Gül",
     phone: "+905551000001",           // Can be any format (normalized on query)
     expoPushToken: "ExponentPushToken[yyyy...]",  // Device token
     pushTokenUpdatedAt: Timestamp,    // When token was registered
     role: "Kadın/Erkek Kuaförü",
     salonId: "tasarimhane",
     services: ["Saç Kesimi", "Saç Boyama"],
     ...
   }
   
   APPOINTMENTS COLLECTION:
   appointments/{appointmentId}
   {
     userId: "user-123",
     userName: "Ali",
     userPhone: "5551234567",          // NORMALIZED
     personnelId: "emp-456",
     personnelName: "Fatma",
     salonId: "tasarimhane",
     date: "2026-03-10",
     time: "14:30",
     services: ["Saç Kesimi", "Saç Boyama"],
     status: "confirmed",
     createdAt: Timestamp
   }
   
   REMINDERS COLLECTION:
   reminders/{reminderId}
   {
     appointmentId: "apt-123",
     phone: "905551234567",             // 90XXXXXXXXXX format (for WhatsApp)
     message: "WhatsApp message text...",
     sendAt: Timestamp,                 // When to send
     status: "pending" | "sent" | "failed",
     createdAt: Timestamp
   }
   
   NOTIFICATION FLOW:
   Push Notifications ────> Devices
   (Expo API)              (via Expo SDK)
   
   WhatsApp Notifications → WhatsApp API → Phones
   (Backend cron job)      (WhatsApp Web)
*/

// ==================== 7. NEW FUNCTIONS ADDED ====================
/*
   In src/services/firebaseService.js:
   
   1. registerPushTokenForUser(userId, token)
      - Saves FCM token for customer user
      
   2. registerPushTokenForEmployee(employeeId, token)
      - Saves FCM token for salon employee
      
   3. sendPushNotificationToEmployee(employeeId, title, body, data)
      - Sends notification to employee by ID
      
   4. sendPushNotificationToUser(userId, title, body, data)
      - Sends notification to customer user by ID
      
   5. sendPushNotificationToUserByPhone(phone, title, body, data)
      - Finds user by PHONE NUMBER and sends notification
      - This is the critical function for phone-based notifications
      
   6. normalizePhone(phone) [EXPORTED]
      - Converts any phone format to 10-digit normalized format
      - Used everywhere for consistency
*/

// ==================== 8. IMPORTANT NOTES ====================
/*
   ✅ WHAT WORKS NOW:
   - Employees get notified when new appointment is created
   - Customers get notified when their appointment is confirmed
   - Phone numbers are normalized consistently
   - Push tokens are registered on login
   - Backend can send notifications via phone number lookup
   
   ⚠️ WHAT TO REMEMBER:
   - PushNotificationManager must be INSIDE UserProvider (it uses useUser hook)
   - Phone numbers in users collection are stored NORMALIZED (10-digit)
   - Phone numbers in reminders collection are stored as 90XXXXXXXXXX (for WhatsApp)
   - Token registration happens automatically on login (useEffect dependency)
   - Notifications won't work if user hasn't accepted permissions
   
   🔴 POSSIBLE ISSUES:
   - If phone number format changes after createOrGetUser, user won't be found
   - If expoPushToken is empty, notification will be skipped (logged as warning)
   - Android requires android.permission.POST_NOTIFICATIONS (added to app.json)
   - Token expires after ~60-90 days on device change
*/

// ==================== 9. TESTING CHECKLIST ====================
/*
   To verify the system works:
   
   □ Install app on 2 devices (or 1 device + emulator)
   □ Open app on both devices
   □ Customer logs in on device 1
   □ Employee logs in on device 2
   □ Check Firebase console:
     - users/{customerId} should have expoPushToken field
     - personnel/{employeeId} should have expoPushToken field
   □ Customer creates appointment from device 1
   □ Verify device 2 (employee) receives push notification
   □ Verify device 1 (customer) receives confirmation push notification
   □ Check Firebase reminders collection:
     - Should have a pending reminder for WhatsApp
   □ Server backend should send WhatsApp in 1 hour (if running)
*/

// ==================== 10. INTEGRATION WITH BACKEND ====================
/*
   If you want to send notifications from backend (Node.js):
   
   const admin = require('firebase-admin');
   
   // Example 1: Send to employee by ID
   const db = admin.firestore();
   const personnel = await db.collection('personnel').doc('emp-456').get();
   const token = personnel.data().expoPushToken;
   
   if (token) {
     await fetch('https://exp.host/--/api/v2/push/send', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         to: token,
         sound: 'default',
         title: '🎯 Yeni Randevu',
         body: 'Ali adında müşteri...',
       }),
     });
   }
   
   // Example 2: Send to customer by phone number
   const users = await db.collection('users')
     .where('phone', '==', '5551234567')  // Normalized phone
     .get();
   
   if (!users.empty) {
     const token = users.docs[0].data().expoPushToken;
     // Send notification...
   }
*/
