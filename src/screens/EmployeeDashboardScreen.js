import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../constants/theme';
import { clearSession } from '../services/sessionService';
import { updatePersonnel, getPersonnelById, getPersonnelAppointments, uploadImage } from '../services/firebaseService';
import ServicesManager from '../components/ServicesManager';

export default function EmployeeDashboardScreen({ route, navigation }) {
  const { employee: initialEmployee } = route.params;
  const insets = useSafeAreaInsets();
  const [employee, setEmployee] = useState(initialEmployee);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // null = home, 'profile', 'appointments'

  // Editable fields
  const [name, setName] = useState(employee.name || '');
  const [surname, setSurname] = useState(employee.surname || '');
  const [role, setRole] = useState(employee.role || '');
  const [servicesList, setServicesList] = useState(
    Array.isArray(employee.services) && employee.services.length > 0
      ? employee.services.map((s, idx) => ({
          id: s.id || `service-${Date.now()}-${idx}`, // Use existing id or generate unique one
          name: typeof s === 'string' ? s : s.name || '',
          duration: typeof s === 'object' ? s.duration || '' : '',
          price: typeof s === 'object' ? s.price || '' : '',
        }))
      : []
  );
  const [workingHours, setWorkingHours] = useState(employee.workingHours || '');
  const [dayOff, setDayOff] = useState(employee.dayOff || '');
  const [about, setAbout] = useState(employee.about || '');
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Censoring helpers
  const censorName = (fullName) => {
    if (!fullName || fullName.trim().length === 0) return '***';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      const w = parts[0];
      if (w.length <= 1) return '*';
      return w[0] + '*'.repeat(w.length - 2) + w[w.length - 1];
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    const cFirst = first[0] + '*'.repeat(first.length - 1);
    const cLast = '*'.repeat(last.length - 1) + last[last.length - 1];
    return cFirst + ' ' + cLast;
  };

  const censorPhone = (phone) => {
    if (!phone) return '(***) *** ** **';
    const digits = phone.replace(/\D/g, '');
    // Get last 10 digits (strip country code)
    const local = digits.length > 10 ? digits.slice(-10) : digits;
    if (local.length < 10) return '(***) *** ** **';
    return `(${local[0]}**) *** ** ${local.slice(8, 10)}`;
  };

  const fetchAppointments = async () => {
    setLoadingAppts(true);
    try {
      const data = await getPersonnelAppointments(employee.id);
      setAppointments(data);
    } catch (error) {
      console.error('Randevular yüklenemedi:', error);
    } finally {
      setLoadingAppts(false);
    }
  };

  const openAppointments = async () => {
    setActiveTab('appointments');
    await fetchAppointments();
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getPersonnelById(employee.id);
      if (data) {
        setEmployee(data);
        setName(data.name || '');
        setSurname(data.surname || '');
        setRole(data.role || '');
        // Handle both old string format and new object array format
        if (Array.isArray(data.services) && data.services.length > 0) {
          if (typeof data.services[0] === 'object') {
            // Ensure each service has a unique id
            setServicesList(
              data.services.map((s, idx) => ({
                id: s.id || `service-${Date.now()}-${idx}`,
                name: s.name || '',
                duration: s.duration || '',
                price: s.price || '',
              }))
            );
          } else {
            // Convert old string format to objects with unique IDs
            setServicesList(
              data.services.map((s, idx) => ({
                id: `service-${Date.now()}-${idx}`,
                name: typeof s === 'string' ? s : s.name || '',
                duration: typeof s === 'object' ? s.duration || '' : '',
                price: typeof s === 'object' ? s.price || '' : '',
              }))
            );
          }
        } else {
          setServicesList([]);
        }
        setWorkingHours(data.workingHours || '');
        setDayOff(data.dayOff || '');
        setAbout(data.about || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Uyarı', 'İsim ve soyisim zorunludur.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = employee.image || null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage, `personnel/${employee.id}/profile.jpg`);
      }
      const data = {
        name: name.trim(),
        surname: surname.trim(),
        role: role.trim(),
        services: servicesList, // Now saving as array of objects with name, duration, price
        workingHours: workingHours.trim(),
        about: about.trim(),
        image: imageUrl,
      };
      await updatePersonnel(employee.id, data);
      setEmployee((prev) => ({ ...prev, ...data }));
      setSelectedImage(null);
      setEditing(false);
      Alert.alert('Başarılı', 'Profiliniz güncellendi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Güncellenirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(employee.name || '');
    setSurname(employee.surname || '');
    setRole(employee.role || '');
    // Reset servicesList to original values
    if (Array.isArray(employee.services) && employee.services.length > 0) {
      if (typeof employee.services[0] === 'object') {
        setServicesList(
          employee.services.map((s, idx) => ({
            id: s.id || `service-${Date.now()}-${idx}`,
            name: s.name || '',
            duration: s.duration || '',
            price: s.price || '',
          }))
        );
      } else {
        setServicesList(
          employee.services.map((s, idx) => ({
            id: `service-${Date.now()}-${idx}`,
            name: typeof s === 'string' ? s : s.name || '',
            duration: typeof s === 'object' ? s.duration || '' : '',
            price: typeof s === 'object' ? s.price || '' : '',
          }))
        );
      }
    } else {
      setServicesList([]);
    }
    setWorkingHours(employee.workingHours || '');
    setDayOff(employee.dayOff || '');
    setAbout(employee.about || '');
    setSelectedImage(null);
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1E293B', '#334155']} style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        {activeTab ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setActiveTab(null); setEditing(false); }}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeTab === 'profile' ? 'Profil Bilgileri' : activeTab === 'appointments' ? 'Randevularım' : 'Personel Paneli'}
          </Text>
          <Text style={styles.headerSubtitle}>Personel Hesabı</Text>
        </View>
        <View style={styles.empBadge}>
          <Ionicons name="person" size={14} color="#FFF" />
          <Text style={styles.empBadgeText}>Personel</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* ===== HOME TAB ===== */}
        {!activeTab && (
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                {employee.image ? (
                  <Image source={{ uri: employee.image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color={COLORS.textMuted} />
                  </View>
                )}
              </View>
              <Text style={styles.profileName}>{employee.name} {employee.surname}</Text>
              <Text style={styles.profileRole}>{employee.role}</Text>
              {employee.phone ? (
                <Text style={styles.profilePhone}>{employee.phone}</Text>
              ) : null}
            </View>

            {/* Hızlı İşlemler */}
            <Text style={styles.quickTitle}>Hızlı İşlemler</Text>

            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('profile')} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Profili Düzenle</Text>
                <Text style={styles.actionDesc}>Bilgilerini görüntüle ve düzenle</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={openAppointments} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Randevularım</Text>
                <Text style={styles.actionDesc}>Alınan randevuları görüntüle</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => {
                await clearSession();
                navigation.replace('Entry');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {editing ? 'Profili Düzenle' : 'Profil Bilgileri'}
              </Text>
              {!editing && (
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Ionicons name="create-outline" size={18} color="#FFF" />
                  <Text style={styles.editBtnText}>Düzenle</Text>
                </TouchableOpacity>
              )}
            </View>

            {editing ? (
              <View style={styles.formCard}>
                <TouchableOpacity style={styles.photoPickerContainer} onPress={pickImage} activeOpacity={0.7}>
                  {selectedImage || employee.image ? (
                    <Image source={{ uri: selectedImage || employee.image }} style={styles.photoPickerImage} />
                  ) : (
                    <View style={styles.photoPickerPlaceholder}>
                      <Ionicons name="person" size={40} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.photoPickerBadge}>
                    <Ionicons name="camera" size={14} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.photoPickerHint}>Fotoğraf değiştirmek için dokunun</Text>

                <Text style={styles.fieldLabel}>İsim</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.fieldLabel}>Soyisim</Text>
                <TextInput style={styles.input} value={surname} onChangeText={setSurname} />

                <Text style={styles.fieldLabel}>Rol / Ünvan</Text>
                <TextInput style={styles.input} value={role} onChangeText={setRole} />

                <ServicesManager
                  servicesList={servicesList}
                  onServicesChange={setServicesList}
                  readonly={false}
                />

                <Text style={styles.fieldLabel}>Çalışma Saatleri</Text>
                <TextInput style={styles.input} value={workingHours} onChangeText={setWorkingHours} placeholder="10:00 - 22:00" />

                <Text style={styles.fieldLabel}>İzin Günü</Text>
                <View style={[styles.input, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={{ fontSize: 15, color: '#94A3B8' }}>
                    {employee.dayOff || 'Belirtilmemiş'} (Patron tarafından belirlenir)
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Hakkında</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={about}
                  onChangeText={setAbout}
                  multiline
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.profilePhotoSection}>
                  {employee.image ? (
                    <Image source={{ uri: employee.image }} style={styles.photoPickerImage} />
                  ) : (
                    <View style={styles.photoPickerPlaceholder}>
                      <Ionicons name="person" size={40} color={COLORS.textMuted} />
                    </View>
                  )}
                  <Text style={styles.profilePhotoName}>{employee.name} {employee.surname}</Text>
                  {employee.role ? <Text style={styles.profilePhotoRole}>{employee.role}</Text> : null}
                </View>
                <View style={styles.infoCard}>
                  <InfoRow label="İsim" value={`${employee.name} ${employee.surname}`} />
                  <InfoRow label="Rol" value={employee.role} />
                  <ServicesManager
                    servicesList={employee.services || []}
                    onServicesChange={() => {}} // Read-only, no changes allowed
                    readonly={true}
                  />
                  <InfoRow label="Çalışma Saatleri" value={employee.workingHours || 'Belirtilmemiş'} />
                  <InfoRow label="İzin Günü" value={employee.dayOff || 'Belirtilmemiş'} />
                  <InfoRow label="Hakkında" value={employee.about || 'Belirtilmemiş'} last />
                </View>
              </>
            )}
          </>
        )}

        {/* ===== APPOINTMENTS TAB ===== */}
        {activeTab === 'appointments' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Randevularım</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchAppointments}>
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {loadingAppts ? (
              <View style={styles.apptLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : appointments.length === 0 ? (
              <View style={styles.emptyAppt}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyApptText}>Henüz randevu yok</Text>
              </View>
            ) : (
              appointments.map((appt) => {
                const statusMap = {
                  confirmed: { label: '', color: '#10B981', bg: '#D1FAE5' },
                  cancelled: { label: 'İptal', color: '#EF4444', bg: '#FEE2E2' },
                  completed: { label: 'Tamamlandı', color: '#6366F1', bg: '#E0E7FF' },
                };
                const st = statusMap[appt.status] || statusMap.confirmed;
                return (
                  <View key={appt.id} style={styles.apptCard}>
                    <View style={styles.apptHeader}>
                      <View style={styles.apptDateRow}>
                        <Ionicons name="calendar" size={16} color={COLORS.primary} />
                        <Text style={styles.apptDate}>{appt.date || '-'}</Text>
                        <Ionicons name="time" size={16} color={COLORS.primary} style={{ marginLeft: 12 }} />
                        <Text style={styles.apptTime}>{appt.time || '-'}</Text>
                      </View>
                      <View style={[styles.apptBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.apptBadgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                    <View style={styles.apptBody}>
                      <View style={styles.apptRow}>
                        <Ionicons name="person-outline" size={15} color={COLORS.textMuted} />
                        <Text style={styles.apptLabel}>Müşteri:</Text>
                        <Text style={styles.apptValue}>{censorName(appt.userName)}</Text>
                      </View>
                      <View style={styles.apptRow}>
                        <Ionicons name="call-outline" size={15} color={COLORS.textMuted} />
                        <Text style={styles.apptLabel}>Telefon:</Text>
                        <Text style={styles.apptValue}>{censorPhone(appt.userPhone)}</Text>
                      </View>
                      {appt.services && appt.services.length > 0 && (
                        <View style={styles.apptRow}>
                          <Ionicons name="cut-outline" size={15} color={COLORS.textMuted} />
                          <Text style={styles.apptLabel}>Hizmet:</Text>
                          <Text style={styles.apptValue} numberOfLines={2}>{appt.services.join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  empBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  empBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  // Profile Card
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  photoPickerImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  photoPickerPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  photoPickerHint: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  profilePhotoSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  profilePhotoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  profilePhotoRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  profileRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Quick Actions
  quickTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  // Info Display
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
  },
  infoRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  // Form
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayOffOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOffPickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '80%',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  dayOffPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  dayOffOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  dayOffOptionSelected: {
    backgroundColor: '#EDE9FE',
  },
  dayOffOptionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  dayOffOptionTextSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Appointments
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptLoading: {
    padding: 30,
    alignItems: 'center',
  },
  emptyAppt: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
  },
  emptyApptText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  apptCard: {
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: '#F8FAFC',
  },
  apptDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  apptDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  apptTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  apptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  apptBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  apptBody: {
    padding: 14,
    gap: 10,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apptLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    width: 65,
  },
  apptValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
