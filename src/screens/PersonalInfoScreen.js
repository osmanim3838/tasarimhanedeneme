import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserProfile } from '../services/firebaseService';

export default function PersonalInfoScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Hata', 'Ad alanı boş olamaz');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Hata', 'Soyad alanı boş olamaz');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setUser({
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setIsEditing(false);
      Alert.alert('Başarılı', 'Kişisel bilgileriniz güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Bilgiler güncellenirken bir hata oluştu');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Ad</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, { borderColor: COLORS.primary, color: colors.textPrimary }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Adınızı girin"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={[styles.value, { color: colors.textPrimary }]}>{firstName}</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Soyadı</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, { borderColor: COLORS.primary, color: colors.textPrimary }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Soyadınızı girin"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={[styles.value, { color: colors.textPrimary }]}>{lastName}</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Telefon</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{user?.phone || ''}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Telefon numarası değiştirilemez</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: COLORS.primary }]}
              onPress={() => {
                setFirstName(user?.firstName || '');
                setLastName(user?.lastName || '');
                setIsEditing(false);
              }}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: COLORS.primary }]}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: SIZES.radiusMedium,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
