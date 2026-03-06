# 📝 Notification Messages - Turkish Reference

## All Notification Messages

### 🎯 New Appointment (To Personnel)
```
Title: 🎯 Yeni Randevu
Body: [CustomerName] adlı müşteri [Date] tarihinde saat [Time]'de randevu aldı.
📌 Hizmet: [Service1, Service2, ...]
```
**Example:**
```
Title: 🎯 Yeni Randevu
Body: Ali Yıldız adlı müşteri 2026-03-10 tarihinde saat 14:30'de randevu aldı.
📌 Hizmet: Saç Kesimi, Tıraş
```

---

### ✅ Appointment Confirmed (To Customer)
```
Title: ✅ Randevu Onaylandı
Body: [Date] tarihinde saat [Time]'de randevunuz onaylanmıştır.
👤 Personel: [PersonnelName]
📌 Hizmet: [Service1, Service2, ...]
```
**Example:**
```
Title: ✅ Randevu Onaylandı
Body: 2026-03-10 tarihinde saat 14:30'de randevunuz onaylanmıştır.
👤 Personel: Fatma Toprakçı
📌 Hizmet: Saç Kesimi, Tıraş
```

---

### ❌ Appointment Cancelled (To Customer)
```
Title: ❌ Randevu İptal Edildi
Body: [Date] tarihindeki [Time] saatindeki randevunuz iptal edilmiştir.
```
**Example:**
```
Title: ❌ Randevu İptal Edildi
Body: 2026-03-10 tarihindeki 14:30 saatindeki randevunuz iptal edilmiştir.
```

---

### ✅ Service Completed (To Customer)
```
Title: ✅ Hizmet Tamamlandı
Body: [PersonnelName] tarafından sunulan hizmetiniz tamamlanmıştır.
Ziyaret ettiğiniz için teşekkürler!
```
**Example:**
```
Title: ✅ Hizmet Tamamlandı
Body: Fatma Toprakçı tarafından sunulan hizmetiniz tamamlanmıştır.
Ziyaret ettiğiniz için teşekkürler!
```

---

### ✅ Appointment Re-confirmation (To Customer)
```
Title: ✅ Randevu Onaylandı
Body: [Date] tarihinde saat [Time]'de randevunuz onaylanmıştır.
👤 Personel: [PersonnelName]
📌 Hizmet: [Service1, Service2, ...]
```
**Example:**
```
Title: ✅ Randevu Onaylandı
Body: 2026-03-10 tarihinde saat 14:30'de randevunuz onaylanmıştır.
👤 Personel: Fatma Toprakçı
📌 Hizmet: Saç Kesimi, Tıraş
```

---

### 💬 WhatsApp Reminder (1 hour before appointment)
```
Merhaba [CustomerName],

TASARIMHANE randevu hatırlatması:

📅 Tarih: [Date]
🕰 Saat: [Time]
✂️ Hizmet: [Service1, Service2, ...]
💇 Personel: [PersonnelName]

Sizi bekliyor olacağız. İyi günler!
```
**Example:**
```
Merhaba Ali Yıldız,

TASARIMHANE randevu hatırlatması:

📅 Tarih: 2026-03-10
🕰 Saat: 14:30
✂️ Hizmet: Saç Kesimi, Tıraş
💇 Personel: Fatma Toprakçı

Sizi bekliyor olacağız. İyi günler!
```

---

## 📊 Notification Summary Table

| Event | To Whom | Title | Emoji | Status |
|-------|---------|-------|-------|--------|
| Appointment Created | Personnel | Yeni Randevu | 🎯 | ✅ Push |
| Appointment Created | Customer | Randevu Onaylandı | ✅ | ✅ Push |
| Appointment Created | Customer | (WhatsApp Reminder) | 🕰 | ✅ In 1 hour |
| Cancelled | Customer | Randevu İptal Edildi | ❌ | ✅ Push |
| Completed | Customer | Hizmet Tamamlandı | ✅ | ✅ Push |
| Confirmed (Resync) | Customer | Randevu Onaylandı | ✅ | ✅ Push |

---

## 🔧 Message Field Sources

### Fields used in Notifications:

| Field | Where From | Example |
|-------|-----------|---------|
| [Date] | `appointment.date` | 2026-03-10 |
| [Time] | `appointment.time` | 14:30 |
| [CustomerName] | `appointment.userName` | Ali Yıldız |
| [PersonnelName] | `appointment.personnelName` | Fatma Toprakçı |
| [Services] | `appointment.services` | Saç Kesimi, Tıraş |

---

## 🌍 Language Notes

All messages are in **Turkish (Türkçe)** with appropriate emoji:
- 🎯 Target/New
- ✅ Confirm/Success
- ❌ Cancel
- 💬 WhatsApp
- 📅 Date
- 🕰 Time
- ✂️ Tools/Services
- 💇 Personnel/Barber
- 👤 Person
- 📌 Note/Service

---

## 🎯 Customer Experience Timeline

```
T-00:00:00   Customer books appointment
             ↓
             📱 PUSH: "✅ Randevu Onaylandı"
             (received immediately)

T-23:59:00   (23 hours 59 minutes to appointment)
             ↓
             (waiting...)

T-01:00:00   1 hour before appointment
             ↓
             💬 WHATSAPP: "TASARIMHANE randevu hatırlatması..."
             (received automatically)

T-00:05:00   5 minutes before appointment
             ↓
             (customer should be at salon)

T-00:00:00   Appointment time
             ↓
             (service in progress)

T+00:30:00   30 minutes after start
             ↓
             (service might be completed)

T+01:00:00   1 hour after start
             ↓
             Personnel marks as complete
             ↓
             📱 PUSH: "✅ Hizmet Tamamlandı"
             (received immediately)
```

---

## 🔐 Security & Privacy

- **Push tokens** are stored encrypted in Firebase
- **Phone numbers** are normalized to 10-digit format for consistency
- **Messages contain only appointment details**, no sensitive personal info
- **WhatsApp messages** are sent via backend (not exposed in app)
- **Notifications are only sent to registered users** with valid push tokens

---

## ✏️ How to Modify Messages

To change notification messages, edit `src/services/firebaseService.js`:

1. **For new appointments:** Lines ~420-460 in `createAppointment()`
2. **For status changes:** Lines ~195-245 in `updateAppointmentStatus()`
3. **For WhatsApp reminders:** Lines ~465-485 in `createAppointment()`

Each message has a `title` and `body` variable that can be customized.

---

**Version:** 1.0
**Last Updated:** March 7, 2026
**Locale:** Turkish (TR)
