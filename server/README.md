# TASARIMHANE WhatsApp Hatırlatma Sunucusu

## Kurulum

1. **Firebase Service Account Key**
   - [Firebase Console](https://console.firebase.google.com) → Proje Ayarları → Hizmet Hesapları
   - "Yeni özel anahtar oluştur" butonuna tıklayın
   - İndirilen JSON dosyasını `server/serviceAccountKey.json` olarak kaydedin

2. **Bağımlılıkları Yükle**
   ```bash
   cd server
   npm install
   ```

3. **Sunucuyu Başlat**
   ```bash
   npm start
   ```

4. **QR Kod**
   - Terminalde bir QR kod görünecek
   - WhatsApp → Ayarlar → Bağlı Cihazlar → Cihaz Bağla
   - QR kodu okutun
   - İlk seferden sonra oturum hatırlanır (`LocalAuth`)

## Nasıl Çalışır?

- Uygulama üzerinden randevu oluşturulduğunda, Firestore'da `reminders` koleksiyonuna otomatik olarak bir hatırlatma belgesi eklenir
- `sendAt` zamanı = randevu saati - 1 saat
- Sunucu her dakika `reminders` koleksiyonunu kontrol eder
- Zamanı gelen hatırlatmaları WhatsApp ile gönderir ve durumu `sent` olarak günceller
- Randevu iptal edilirse hatırlatma da `cancelled` olarak işaretlenir

## Hatırlatma Mesaj Formatı

```
Merhaba [İsim],

TASARIMHANE randevu hatırlatması:

📅 Tarih: 2026-02-25
🕐 Saat: 14:00
✂️ Hizmet: Saç Kesimi
💇 Personel: Ahmet Yılmaz

Sizi bekliyor olacağız. İyi günler!
```
