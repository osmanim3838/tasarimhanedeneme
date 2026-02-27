import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { deleteUser } from '../services/firebaseService';
import { clearSession } from '../services/sessionService';

export default function ProfileScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { isDark, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="person" size={48} color={COLORS.primary} />
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.firstName || ''} {user?.lastName || ''}</Text>
          <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{user?.phone || ''}</Text>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PersonalInfo')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: colors.menuIconBg1 }]}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Kişisel Bilgiler</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyAppointments')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: colors.menuIconBg2 }]}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Randevularım</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Contracts')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: colors.menuIconBg3 }]}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Sözleşmeler</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.deleteButtonBg, borderColor: colors.deleteButtonBorder }]}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              'Hesabı Sil',
              'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Evet, Sil',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (user?.id) await deleteUser(user.id);
                      setUser(null);
                      await clearSession();
                      navigation.replace('Entry');
                    } catch (e) {
                      console.error(e);
                      Alert.alert('Hata', 'Hesap silinirken bir sorun oluştu.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteText}>Hesabı Sil</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.deleteButtonBg }]}
          activeOpacity={0.7}
          onPress={async () => {
            setUser(null);
            await clearSession();
            navigation.replace('Entry');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeToggle: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
    marginBottom: 16,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
