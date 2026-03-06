const admin = require('firebase-admin');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');

// ==================== 1. Firebase Başlatma ====================
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ==================== 2. WhatsApp İstemcisi ====================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('\n📱 Lütfen yukarıdaki QR kodu WhatsApp ile okutun.\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp bağlantısı başarılı, istemci hazır!');
  startCronJob();
});

client.on('auth_failure', (msg) => {
  console.error('❌ Kimlik doğrulama hatası:', msg);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Bağlantı kesildi:', reason);
});

client.initialize();

// ==================== HELPER: Phone Normalization ====================
function normalizePhone(p) {
  if (!p) return '';
  let cleaned = p.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+90')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('90') && cleaned.length > 10) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);
  return cleaned; // 10-digit format
}

// ==================== HELPER: Send FCM Push Notification ====================
async function sendPushNotificationToUserByPhone(phone, title, body, data = {}) {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    // Find user by normalized phone in users collection
    const usersSnapshot = await db
      .collection('users')
      .where('phone', '==', normalizedPhone)
      .get();

    if (usersSnapshot.empty) {
      console.log(`⚠️ No user found with phone: ${phone}`);
      return;
    }

    const userData = usersSnapshot.docs[0].data();
    const expoPushToken = userData?.expoPushToken;

    if (!expoPushToken) {
      console.log(`⚠️ No push token for user with phone: ${phone}`);
      return;
    }

    // Send push notification via Expo Push API
    const response = await axios.post('https://exp.host/--/api/v2/push/send', {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    }, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log(`✅ Push notification sent to user with phone: ${phone}`);
    } else {
      console.error(`❌ Push notification failed: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Error sending push notification: ${error.message}`);
  }
}

// ==================== 3. Zamanlayıcı ====================
function startCronJob() {
  // Her dakika kontrol et
  cron.schedule('* * * * *', async () => {
    const now = admin.firestore.Timestamp.now();

    try {
      const snapshot = await db
        .collection('reminders')
        .where('status', '==', 'pending')
        .where('sendAt', '<=', now)
        .get();

      if (snapshot.empty) return;

      console.log(`📋 ${snapshot.size} hatırlatma gönderilecek...`);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        // Format: 905xxxxxxxxx@c.us
        const chatId = `${data.phone}@c.us`;

        try {
          // Send WhatsApp message
          await client.sendMessage(chatId, data.message);
          console.log(`✅ WhatsApp mesaj gönderildi: ${data.phone} — ${data.appointmentId}`);

          // Send FCM Push Notification in parallel
          await sendPushNotificationToUserByPhone(
            data.phone,
            '⏰ Randevu Hatırlatması',
            data.message,
            { appointmentId: data.appointmentId }
          );

          await db.collection('reminders').doc(doc.id).update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          console.error(`❌ Mesaj gönderilemedi (${data.phone}):`, error.message);

          // Retry count — 3 denemeden sonra fail olarak işaretle
          const retries = (data.retries || 0) + 1;
          if (retries >= 3) {
            await db.collection('reminders').doc(doc.id).update({
              status: 'failed',
              error: error.message,
              retries,
            });
          } else {
            await db.collection('reminders').doc(doc.id).update({ retries });
          }
        }
      }
    } catch (error) {
      console.error('❌ Firebase çekme hatası:', error.message);
    }
  });

  console.log('⏰ Hatırlatma zamanlayıcı başlatıldı (her dakika kontrol edilecek)');
}
