import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { loginWithPhone } from '../services/firebaseService';
import nativeAuth from '@react-native-firebase/auth';

export default function SalonLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '(' + cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += ') ' + cleaned.substring(3, 6);
    }
    if (cleaned.length > 6) {
      formatted += ' ' + cleaned.substring(6, 8);
    }
    if (cleaned.length > 8) {
      formatted += ' ' + cleaned.substring(8, 10);
    }
    return formatted;
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(formatPhoneNumber(text));
    }
  };

  const handleLogin = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir telefon numarası girin.');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = '+90' + phone.replace(/\D/g, '');
      const result = await loginWithPhone(cleanPhone);
      if (!result) {
        Alert.alert('Hata', 'Bu telefon numarası kayıtlı değil.\nYalnızca salon sahibi veya çalışanlar giriş yapabilir.');
        return;
      }
      // Send real SMS verification
      const confirmation = await nativeAuth().signInWithPhoneNumber(cleanPhone);
      navigation.navigate('SalonVerification', {
        phone: cleanPhone,
        role: result.role,
        data: result.data,
        confirmationId: confirmation.verificationId,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', error.message || 'Giriş sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: Math.max(insets.top, 12) + 6 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.6)" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Salon Girişi</Text>
        <Text style={styles.subtitle}>
          Salon yönetim paneline erişim için{'\n'}telefonunuzu doğrulayın
        </Text>

        {/* Phone Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Telefon Numarası</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <Text style={styles.countryCode}>+90</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="(5XX) XXX XX XX"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.loginButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="rgba(255,255,255,0.8)" size="small" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={22} color="rgba(255,255,255,0.8)" />
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </>
          )}
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 50,
    gap: 10,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },

});
