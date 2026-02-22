import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { createOrGetUser } from '../services/firebaseService';
import { saveSession } from '../services/sessionService';

export default function NameInputScreen({ route, navigation }) {
  const { phone } = route.params;
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const capitalizeWords = (text) => {
    return text.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/(?<=\b\w)\w+/g, (w) => w.toLowerCase());
  };

  const handleNameChange = (text) => {
    // Allow only letters, spaces, and Turkish characters
    const cleaned = text.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
    setFullName(capitalizeWords(cleaned));
  };

  const handleComplete = async () => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      Alert.alert('Uyarı', 'Lütfen ad ve soyadınızı girin.');
      return;
    }

    const firstName = parts.slice(0, -1).join(' ');
    const lastName = parts[parts.length - 1];

    setLoading(true);
    try {
      const userData = await createOrGetUser(phone, firstName, lastName);
      setUser(userData);
      await saveSession('user', userData);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

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
          {/* Logo Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
            </View>
            <Text style={styles.title}>Hoş Geldiniz!</Text>
            <Text style={styles.subtitle}>
              Sizi tanıyalım — adınızı ve soyadınızı girin
            </Text>
          </View>

          {/* Name Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Kayıt Bilgileri</Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyadınızı girin"
                    placeholderTextColor={COLORS.textMuted}
                    value={fullName}
                    onChangeText={handleNameChange}
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Complete Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleComplete} activeOpacity={0.8} disabled={loading}>
              <LinearGradient
                colors={['#7B61FF', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.completeButton, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={22} color="#FFF" />
                    <Text style={styles.completeButtonText}>Tamamla</Text>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    marginLeft: 4,
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
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  buttonContainer: {
    gap: 12,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
