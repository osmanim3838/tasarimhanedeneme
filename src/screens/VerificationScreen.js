import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getUserByPhone } from '../services/firebaseService';
import { useUser } from '../context/UserContext';
import { saveSession } from '../services/sessionService';
import auth from '@react-native-firebase/auth';
import { phoneConfirmation } from './EntryScreen';

export default function VerificationScreen({ route, navigation }) {
  const { phone } = route.params;
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [currentConfirmation, setCurrentConfirmation] = useState(phoneConfirmation);
  const inputRefs = useRef([]);
  const { setUser } = useUser();

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    // Handle paste (multi-digit)
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').split('').slice(0, 6);
      digits.forEach((digit, i) => {
        if (i + index < 6) {
          newCode[i + index] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = text.replace(/\D/g, '');
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Uyarı', 'Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    setLoading(true);
    try {
      // Verify SMS code via Firebase using the confirmation object
      if (!currentConfirmation) {
        Alert.alert('Hata', 'Doğrulama oturumu bulunamadı. Lütfen geri dönüp tekrar deneyin.');
        setLoading(false);
        return;
      }
      await currentConfirmation.confirm(fullCode);
      // Sign out from Firebase Auth (we use our own session)
      try { await auth().signOut(); } catch (e) {}

      // Check if user exists in our DB
      const existingUser = await getUserByPhone(phone);
      if (existingUser) {
        setUser(existingUser);
        await saveSession('user', existingUser);
        navigation.replace('MainTabs');
      } else {
        navigation.replace('NameInput', { phone });
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert('Hata', 'Geçersiz doğrulama kodu.');
      } else if (error.code === 'auth/code-expired') {
        Alert.alert('Hata', 'Kodun süresi doldu. Yeni kod isteyin.');
      } else {
        Alert.alert('Hata', 'Doğrulama başarısız: ' + (error.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setCurrentConfirmation(confirmation);
      setTimer(60);
      Alert.alert('Bilgi', 'Doğrulama kodu tekrar gönderildi.');
    } catch (error) {
      Alert.alert('Hata', 'SMS gönderilemedi: ' + (error.message || ''));
    }
  };

  const maskedPhone = phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3 $4 $5');

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      blurRadius={3}
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { top: Math.max(insets.top, 12) + 6 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Logo Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
            </View>
            <Text style={styles.title}>Doğrulama Kodu</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
              {'\n'}numarasına gönderilen 6 haneli kodu girin
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Doğrulama</Text>

              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit ? styles.codeInputFilled : null,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Timer / Resend */}
              <View style={styles.timerContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Tekrar gönder ({timer}s)
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleVerify} activeOpacity={0.8} disabled={loading}>
              <LinearGradient
                colors={['#7B61FF', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.verifyButton, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={styles.verifyButtonText}>Doğrula</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusMedium,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
