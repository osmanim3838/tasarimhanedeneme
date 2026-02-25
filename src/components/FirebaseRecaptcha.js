import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDunPAqFJvk-xpcjWykW_L4yKKItTPiLzU',
  authDomain: 'tasarimhane-2c03b.firebaseapp.com',
  projectId: 'tasarimhane-2c03b',
  storageBucket: 'tasarimhane-2c03b.firebasestorage.app',
  messagingSenderId: '541303114598',
  appId: '1:541303114598:android:74f255d9457b7dab9616a7',
};

function buildHTML(phoneNumber) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 40px 20px 20px;
    }
    h2 { font-size: 18px; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #94A3B8; margin-bottom: 30px; text-align: center; }
    #recaptcha-box {
      background: #1E293B;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    #recaptcha-container { min-height: 78px; }
    #status {
      margin-top: 16px;
      font-size: 14px;
      text-align: center;
      min-height: 20px;
    }
    .loading { color: #7B61FF; }
    .error { color: #EF4444; }
    .success { color: #22C55E; }
    .spinner {
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #7B61FF;
      border-radius: 50%;
      width: 28px; height: 28px;
      animation: spin 0.7s linear infinite;
      margin: 12px auto 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hide { display: none; }
  </style>
</head>
<body>
  <h2>SMS Doğrulama</h2>
  <p class="subtitle">Aşağıdaki doğrulamayı tamamlayın</p>
  <div id="recaptcha-box">
    <div id="recaptcha-container"></div>
    <div id="status" class="loading">reCAPTCHA yükleniyor...</div>
    <div id="spinner" class="spinner"></div>
  </div>

  <script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js"><\/script>
  <script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js"><\/script>
  <script>
    var statusEl = document.getElementById('status');
    var spinnerEl = document.getElementById('spinner');
    var phone = "${phoneNumber}";

    function post(obj) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
    }

    function setStatus(text, cls) {
      statusEl.textContent = text;
      statusEl.className = cls || '';
    }

    var app, auth;
    try {
      app = firebase.initializeApp(${JSON.stringify(FIREBASE_CONFIG)});
      auth = firebase.auth();
      auth.languageCode = 'tr';
      post({ type: 'log', msg: 'Firebase OK' });
    } catch(e) {
      setStatus('Firebase hatası: ' + e.message, 'error');
      spinnerEl.className = 'hide';
      post({ type: 'error', message: 'Firebase başlatılamadı: ' + e.message });
    }

    if (auth) {
      try {
        var verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'normal',
          theme: 'dark',
          callback: function(token) {
            post({ type: 'log', msg: 'reCAPTCHA solved, sending SMS...' });
            setStatus('SMS gönderiliyor...', 'loading');
            spinnerEl.className = 'spinner';
            sendSMS();
          },
          'expired-callback': function() {
            setStatus('reCAPTCHA süresi doldu, sayfayı yenileyin.', 'error');
            spinnerEl.className = 'hide';
          }
        });

        verifier.render().then(function(widgetId) {
          post({ type: 'log', msg: 'reCAPTCHA rendered OK, widgetId=' + widgetId });
          setStatus('Yukarıdaki kutuyu işaretleyin', '');
          spinnerEl.className = 'hide';
        }).catch(function(e) {
          post({ type: 'log', msg: 'render error: ' + e.code + ' ' + e.message });
          setStatus('reCAPTCHA yüklenemedi: ' + e.message, 'error');
          spinnerEl.className = 'hide';
          post({ type: 'error', message: 'reCAPTCHA yüklenemedi: ' + e.message });
        });

        function sendSMS() {
          auth.signInWithPhoneNumber(phone, verifier)
            .then(function(result) {
              setStatus('SMS gönderildi! ✓', 'success');
              spinnerEl.className = 'hide';
              post({ type: 'success', verificationId: result.verificationId });
            })
            .catch(function(error) {
              spinnerEl.className = 'hide';
              var msg = error.code + ': ' + error.message;
              if (error.code === 'auth/invalid-phone-number') msg = 'Geçersiz telefon numarası.';
              else if (error.code === 'auth/too-many-requests') msg = 'Çok fazla istek. Lütfen biraz bekleyin.';
              else if (error.code === 'auth/quota-exceeded') msg = 'SMS kotası doldu.';
              else if (error.code === 'auth/operation-not-allowed') msg = 'Telefon doğrulaması Firebase Console\\'da etkin değil!';
              else if (error.code === 'auth/captcha-check-failed') msg = 'reCAPTCHA doğrulaması başarısız.';
              
              setStatus('Hata: ' + msg, 'error');
              post({ type: 'log', msg: 'signIn error: ' + error.code + ' - ' + error.message });
              post({ type: 'error', message: msg });
            });
        }
      } catch(e) {
        setStatus('Hata: ' + e.message, 'error');
        spinnerEl.className = 'hide';
        post({ type: 'error', message: e.message });
      }
    }
  <\/script>
</body>
</html>`;
}

const { width: SW, height: SH } = Dimensions.get('window');

const FirebaseRecaptcha = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [webViewKey, setWebViewKey] = useState(0);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);
  const timeoutRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useImperativeHandle(ref, () => ({
    sendVerification: (phone) => {
      return new Promise((resolve, reject) => {
        cleanup();
        resolveRef.current = resolve;
        rejectRef.current = reject;
        setPhoneNumber(phone);
        setWebViewKey((k) => k + 1);
        setVisible(true);

        timeoutRef.current = setTimeout(() => {
          setVisible(false);
          reject(new Error('Zaman aşımı. Lütfen tekrar deneyin.'));
        }, 60000);
      });
    },
  }));

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'log') {
        console.log('[SMS]', data.msg);
        return;
      }

      if (data.type === 'success') {
        cleanup();
        setVisible(false);
        resolveRef.current?.(data.verificationId);
      } else if (data.type === 'error') {
        cleanup();
        setVisible(false);
        rejectRef.current?.(new Error(data.message));
      }
    } catch (e) {}
  }, [cleanup]);

  const handleCancel = useCallback(() => {
    cleanup();
    setVisible(false);
    rejectRef.current?.(new Error('İptal edildi.'));
  }, [cleanup]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SMS Doğrulama</Text>
          <View style={{ width: 40 }} />
        </View>

        <WebView
          key={webViewKey}
          source={{
            html: buildHTML(phoneNumber),
            baseUrl: 'https://tasarimhane-2c03b.firebaseapp.com',
          }}
          onMessage={handleMessage}
          onError={(e) => {
            console.error('[SMS] WebView error:', e.nativeEvent);
            cleanup();
            setVisible(false);
            rejectRef.current?.(new Error('Sayfa yüklenemedi.'));
          }}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="compatibility"
          originWhitelist={['*']}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});

export default FirebaseRecaptcha;
