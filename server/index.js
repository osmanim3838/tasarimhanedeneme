const admin = require('firebase-admin');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

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
          await client.sendMessage(chatId, data.message);
          console.log(`✅ Mesaj gönderildi: ${data.phone} — ${data.appointmentId}`);

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
