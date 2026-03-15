import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../constants/theme';
import { clearSession } from '../services/sessionService';
import AdminBookingModal from '../components/AdminBookingModal';
import ServicesManager from '../components/ServicesManager';
import {
  getSalon,
  getPersonnel,
  getSalonAppointments,
  updateSalon,
  updatePersonnel,
  addPersonnel,
  deletePersonnel,
  updateAppointmentStatus,
  uploadImage,
} from '../services/firebaseService';
import { db } from '../config/firebase';
import { query, where, collection, onSnapshot } from 'firebase/firestore';

export default function OwnerDashboardScreen({ route, navigation }) {
  const { salon: initialSalon } = route.params;
  const insets = useSafeAreaInsets();
  const [salon, setSalon] = useState(initialSalon);
  const [personnel, setPersonnel] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [salonEditModal, setSalonEditModal] = useState(false);
  const [personnelModal, setPersonnelModal] = useState(false);
  const [adminBookingModal, setAdminBookingModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [dayOffPickerVisible, setDayOffPickerVisible] = useState(false);

  const DAY_OFF_OPTIONS = ['Yok', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  // Helper function to get today's date in DD.MM.YYYY format
  const getTodayFormattedDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Salon edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAbout, setEditAbout] = useState('');

  // Personnel edit fields
  const [pName, setPName] = useState('');
  const [pSurname, setPSurname] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pRole, setPRole] = useState('');
  const [servicesList, setServicesList] = useState([]);
  const [pDayOff, setPDayOff] = useState('');
  const [pLunchStart, setPLunchStart] = useState('');
  const [pLunchEnd, setPLunchEnd] = useState('');
  const [lunchStartPickerVisible, setLunchStartPickerVisible] = useState(false);
  const [lunchEndPickerVisible, setLunchEndPickerVisible] = useState(false);
  const [pImage, setPImage] = useState(null);

  // Günlük Çalışma Saatleri (Daily Working Hours)
  const SHIFT_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const SHIFT_DAY_LABELS = { monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar' };
  const DEFAULT_SHIFT_START = '10:00';
  const DEFAULT_SHIFT_END = '19:00';
  const [pShiftStartTimes, setPShiftStartTimes] = useState(
    SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: DEFAULT_SHIFT_START }), {})
  );
  const [pShiftEndTimes, setPShiftEndTimes] = useState(
    SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: DEFAULT_SHIFT_END }), {})
  );
  const [shiftPickerVisible, setShiftPickerVisible] = useState(false);
  const [shiftPickerDay, setShiftPickerDay] = useState(null);
  const [shiftPickerType, setShiftPickerType] = useState('start'); // 'start' or 'end'
  const [ownerImage, setOwnerImage] = useState(salon.ownerImage || null);
  const [salonLogo, setSalonLogo] = useState(salon.logo || null);

  const pickSalonLogo = async () => {
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
      const uri = result.assets[0].uri;
      try {
        const url = await uploadImage(uri, `salons/${salon.id}/logo.jpg`);
        await updateSalon(salon.id, { logo: url });
        setSalonLogo(url);
        setSalon((prev) => ({ ...prev, logo: url }));
        Alert.alert('Başarılı', 'Salon logosu güncellendi.');
      } catch (error) {
        console.error(error);
        Alert.alert('Hata', 'Logo yüklenirken bir sorun oluştu.');
      }
    }
  };

  const pickPersonnelImage = async () => {
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
      setPImage(result.assets[0].uri);
    }
  };

  const pickOwnerImage = async () => {
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
      const uri = result.assets[0].uri;
      try {
        const url = await uploadImage(uri, `salons/${salon.id}/owner.jpg`);
        await updateSalon(salon.id, { ownerImage: url });
        setOwnerImage(url);
        setSalon((prev) => ({ ...prev, ownerImage: url }));
        Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi.');
      } catch (error) {
        console.error(error);
        Alert.alert('Hata', 'Fotoğraf yüklenirken bir sorun oluştu.');
      }
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [salonData, personnelData, appointmentData] = await Promise.all([
        getSalon(initialSalon.id),
        getPersonnel(initialSalon.id),
        getSalonAppointments(initialSalon.id).catch(() => []),
      ]);
      if (salonData) setSalon(salonData);
      setPersonnel(personnelData);
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialSalon.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time listener for today's appointments
  useEffect(() => {
    setIsLoadingCount(true);
    const todayDate = getTodayFormattedDate();
    
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('salonId', '==', salon.id),
      where('date', '==', todayDate)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      setTodayCount(snapshot.size);
      setIsLoadingCount(false);
    }, (error) => {
      console.error('Error fetching today\'s appointments:', error);
      setIsLoadingCount(false);
    });

    return () => unsubscribe();
  }, [salon.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const generateTimePickerOptions = () => {
    const times = [];
    for (let hour = 10; hour <= 21; hour++) {
      for (let min = 0; min < 60; min += 30) {
        times.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    return times;
  };

  // Shift end time options: 12:00 → 00:00 (midnight)
  const generateShiftEndTimeOptions = () => {
    const times = [];
    for (let hour = 12; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 30) {
        times.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    times.push('00:00');
    return times;
  };

  // ===== SALON EDIT =====
  const openSalonEdit = () => {
    setEditName(salon.name || '');
    setEditPhone(salon.phone || '');
    setEditAddress(salon.address || '');
    setEditAbout(salon.about || '');
    setSalonEditModal(true);
  };

  const saveSalonEdit = async () => {
    try {
      await updateSalon(salon.id, {
        name: editName,
        phone: editPhone,
        address: editAddress,
        about: editAbout,
      });
      setSalon((prev) => ({ ...prev, name: editName, phone: editPhone, address: editAddress, about: editAbout }));
      setSalonEditModal(false);
      Alert.alert('Başarılı', 'Salon bilgileri güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Güncellenirken bir sorun oluştu.');
    }
  };

  // ===== PERSONNEL EDIT/ADD =====
  const openPersonnelEdit = (person = null) => {
    if (person) {
      setEditingPerson(person);
      setPName(person.name || '');
      setPSurname(person.surname || '');
      setPPhone(person.phone || '');
      setPRole(person.role || '');
      // Convert old string array format to new object format if needed
      const services = (person.services || []).map((service) => {
        if (typeof service === 'string') {
          return { id: `service-${Date.now()}-${Math.random()}`, name: service, duration: '', price: '' };
        }
        return { ...service, id: service.id || `service-${Date.now()}-${Math.random()}` };
      });
      setServicesList(services);
      setPDayOff(person.dayOff || '');
      setPLunchStart(person.lunchBreak?.start || '');
      setPLunchEnd(person.lunchBreak?.end || '');
      setPImage(null);
      // Load existing shift times or use defaults
      const existingStart = person.shiftStartTimes || {};
      const existingEnd = person.shiftEndTimes || {};
      setPShiftStartTimes(
        SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: existingStart[day] || DEFAULT_SHIFT_START }), {})
      );
      setPShiftEndTimes(
        SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: existingEnd[day] || DEFAULT_SHIFT_END }), {})
      );
    } else {
      setEditingPerson(null);
      setPName('');
      setPSurname('');
      setPPhone('');
      setPRole('');
      setServicesList([]);
      setPDayOff('');
      setPLunchStart('');
      setPLunchEnd('');
      setPImage(null);
      setPShiftStartTimes(
        SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: DEFAULT_SHIFT_START }), {})
      );
      setPShiftEndTimes(
        SHIFT_DAY_KEYS.reduce((acc, day) => ({ ...acc, [day]: DEFAULT_SHIFT_END }), {})
      );
    }
    setPersonnelModal(true);
  };

  const savePersonnel = async () => {
    if (!pName.trim() || !pSurname.trim()) {
      Alert.alert('Uyarı', 'İsim ve soyisim zorunludur.');
      return;
    }
    const data = {
      name: pName.trim(),
      surname: pSurname.trim(),
      phone: pPhone.trim(),
      role: pRole.trim(),
      services: servicesList,
      dayOff: pDayOff.trim(),
      lunchBreak: {
        start: pLunchStart || null,
        end: pLunchEnd || null,
      },
      shiftStartTimes: pShiftStartTimes,
      shiftEndTimes: pShiftEndTimes,
      salonId: salon.id,
    };

    try {
      if (pImage) {
        const personId = editingPerson ? editingPerson.id : Date.now().toString();
        data.image = await uploadImage(pImage, `personnel/${personId}/profile.jpg`);
      }

      if (editingPerson) {
        await updatePersonnel(editingPerson.id, data);
        Alert.alert('Başarılı', 'Personel güncellendi.');
      } else {
        await addPersonnel(data);
        Alert.alert('Başarılı', 'Yeni personel eklendi.');
      }
      setPersonnelModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    }
  };

  const handleDeletePersonnel = (person) => {
    Alert.alert(
      'Personel Sil',
      `${person.name} ${person.surname} silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonnel(person.id);
              loadData();
              Alert.alert('Başarılı', 'Personel silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi başarısız.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesaptan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              navigation.replace('Entry');
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
            }
          },
        },
      ]
    );
  };

  // ===== APPOINTMENT STATUS =====
  const handleAppointmentAction = async (appointment, status) => {
    try {
      await updateAppointmentStatus(appointment.id, status);
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'İşlem başarısız.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Genel', icon: 'grid-outline' },
    { key: 'personnel', label: 'Personel', icon: 'people-outline' },
    { key: 'appointments', label: 'Randevu', icon: 'calendar-outline' },
    { key: 'settings', label: 'Salon', icon: 'settings-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={COLORS.headerGradient} style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{salon.name}</Text>
          <Text style={styles.headerSubtitle}>Yönetim Paneli</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.ownerBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFF" />
            <Text style={styles.ownerBadgeText}>Sahip</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'personnel' && renderPersonnel()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>

      {/* Salon Edit Modal */}
      <Modal visible={salonEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Salon Bilgilerini Düzenle</Text>
              <TouchableOpacity onPress={() => setSalonEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Salon Adı</Text>
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput style={styles.modalInput} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
              <Text style={styles.fieldLabel}>Adres</Text>
              <TextInput style={styles.modalInput} value={editAddress} onChangeText={setEditAddress} multiline />
              <Text style={styles.fieldLabel}>Hakkında</Text>
              <TextInput style={[styles.modalInput, { height: 100 }]} value={editAbout} onChangeText={setEditAbout} multiline textAlignVertical="top" />
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={saveSalonEdit}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Personnel Edit Modal */}
      <Modal visible={personnelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPerson ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </Text>
              <TouchableOpacity onPress={() => setPersonnelModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity style={styles.photoPickerContainer} onPress={pickPersonnelImage} activeOpacity={0.7}>
                {pImage || (editingPerson && editingPerson.image) ? (
                  <Image source={{ uri: pImage || editingPerson.image }} style={styles.photoPickerImage} />
                ) : (
                  <View style={styles.photoPickerPlaceholder}>
                    <Ionicons name="person" size={36} color={COLORS.textMuted} />
                  </View>
                )}
                <View style={styles.photoPickerBadge}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoPickerHint}>Fotoğraf değiştirmek için dokunun</Text>

              <Text style={styles.fieldLabel}>İsim *</Text>
              <TextInput style={styles.modalInput} value={pName} onChangeText={setPName} />
              <Text style={styles.fieldLabel}>Soyisim *</Text>
              <TextInput style={styles.modalInput} value={pSurname} onChangeText={setPSurname} />
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput style={styles.modalInput} value={pPhone} onChangeText={setPPhone} keyboardType="phone-pad" />
              <Text style={styles.fieldLabel}>Rol</Text>
              <TextInput style={styles.modalInput} value={pRole} onChangeText={setPRole} />
              
              <ServicesManager
                servicesList={servicesList}
                onServicesChange={setServicesList}
                readonly={false}
              />

              <Text style={styles.fieldLabel}>İzin Günü</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setDayOffPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownRow}>
                  <Text style={{ fontSize: 15, color: pDayOff ? COLORS.textPrimary : '#94A3B8' }}>
                    {pDayOff || 'Seçiniz'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              {/* Day Off Picker Modal */}
              <Modal visible={dayOffPickerVisible} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.dayOffOverlay}
                  activeOpacity={1}
                  onPress={() => setDayOffPickerVisible(false)}
                >
                  <View style={styles.dayOffPickerContainer}>
                    <Text style={styles.dayOffPickerTitle}>İzin Günü Seçin</Text>
                    {DAY_OFF_OPTIONS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayOffOption,
                          pDayOff === day && styles.dayOffOptionSelected,
                        ]}
                        onPress={() => {
                          setPDayOff(day === 'Yok' ? '' : day);
                          setDayOffPickerVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayOffOptionText,
                            pDayOff === day && styles.dayOffOptionTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                        {pDayOff === day && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                        {day === 'Yok' && !pDayOff && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Yemek Saati (Lunch Break) - START TIME */}
              <Text style={styles.fieldLabel}>Yemek Saati Başlangıcı</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setLunchStartPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownRow}>
                  <Text style={{ fontSize: 15, color: pLunchStart ? COLORS.textPrimary : '#94A3B8' }}>
                    {pLunchStart || 'Seçiniz (örn: 13:00)'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              {/* Yemek Saati (Lunch Break) - END TIME */}
              <Text style={styles.fieldLabel}>Yemek Saati Bitişi</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setLunchEndPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownRow}>
                  <Text style={{ fontSize: 15, color: pLunchEnd ? COLORS.textPrimary : '#94A3B8' }}>
                    {pLunchEnd || 'Seçiniz (örn: 14:00)'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              {/* Time Picker Modal for Lunch Start */}
              <Modal visible={lunchStartPickerVisible} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.dayOffOverlay}
                  activeOpacity={1}
                  onPress={() => setLunchStartPickerVisible(false)}
                >
                  <View style={styles.dayOffPickerContainer}>
                    <Text style={styles.dayOffPickerTitle}>Başlangıç Saati Seçin</Text>
                    {generateTimePickerOptions().map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.dayOffOption,
                          pLunchStart === time && styles.dayOffOptionSelected,
                        ]}
                        onPress={() => {
                          setPLunchStart(time);
                          setLunchStartPickerVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayOffOptionText,
                            pLunchStart === time && styles.dayOffOptionTextSelected,
                          ]}
                        >
                          {time}
                        </Text>
                        {pLunchStart === time && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Time Picker Modal for Lunch End */}
              <Modal visible={lunchEndPickerVisible} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.dayOffOverlay}
                  activeOpacity={1}
                  onPress={() => setLunchEndPickerVisible(false)}
                >
                  <View style={styles.dayOffPickerContainer}>
                    <Text style={styles.dayOffPickerTitle}>Bitiş Saati Seçin</Text>
                    {generateTimePickerOptions().map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.dayOffOption,
                          pLunchEnd === time && styles.dayOffOptionSelected,
                        ]}
                        onPress={() => {
                          setPLunchEnd(time);
                          setLunchEndPickerVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayOffOptionText,
                            pLunchEnd === time && styles.dayOffOptionTextSelected,
                          ]}
                        >
                          {time}
                        </Text>
                        {pLunchEnd === time && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* ===== Günlük Çalışma Saatleri (Daily Working Hours) ===== */}
              <Text style={[styles.fieldLabel, { marginTop: 12, fontSize: 15, fontWeight: '700', color: COLORS.primary }]}>
                Günlük Çalışma Saatleri
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
                Her gün için personelin giriş ve çıkış saatini belirleyin.
              </Text>
              {SHIFT_DAY_KEYS.map((dayKey) => (
                <View key={dayKey} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ width: 90, fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' }}>
                    {SHIFT_DAY_LABELS[dayKey]}
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalInput, { flex: 0, width: 70, marginBottom: 0, paddingVertical: 8, alignItems: 'center', marginRight: 4 }]}
                    onPress={() => { setShiftPickerDay(dayKey); setShiftPickerType('start'); setShiftPickerVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>
                      {pShiftStartTimes[dayKey] || DEFAULT_SHIFT_START}
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 14, color: COLORS.textMuted, marginHorizontal: 2 }}>-</Text>
                  <TouchableOpacity
                    style={[styles.modalInput, { flex: 0, width: 70, marginBottom: 0, paddingVertical: 8, alignItems: 'center' }]}
                    onPress={() => { setShiftPickerDay(dayKey); setShiftPickerType('end'); setShiftPickerVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.error || '#EF4444', fontWeight: '600' }}>
                      {pShiftEndTimes[dayKey] || DEFAULT_SHIFT_END}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Shift Time Picker Modal (shared for start & end) */}
              <Modal visible={shiftPickerVisible} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.dayOffOverlay}
                  activeOpacity={1}
                  onPress={() => setShiftPickerVisible(false)}
                >
                  <View style={styles.dayOffPickerContainer}>
                    <Text style={styles.dayOffPickerTitle}>
                      {shiftPickerDay
                        ? `${SHIFT_DAY_LABELS[shiftPickerDay]} - ${shiftPickerType === 'start' ? 'Giriş Saati' : 'Çıkış Saati'}`
                        : 'Saat Seçin'}
                    </Text>
                    <ScrollView style={{ maxHeight: 350 }}>
                      {(shiftPickerType === 'start' ? generateTimePickerOptions() : generateShiftEndTimeOptions()).map((time) => {
                        const currentValue = shiftPickerType === 'start'
                          ? pShiftStartTimes[shiftPickerDay]
                          : pShiftEndTimes[shiftPickerDay];
                        const isSelected = currentValue === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.dayOffOption,
                              isSelected && styles.dayOffOptionSelected,
                            ]}
                            onPress={() => {
                              if (shiftPickerDay) {
                                if (shiftPickerType === 'start') {
                                  setPShiftStartTimes((prev) => ({ ...prev, [shiftPickerDay]: time }));
                                } else {
                                  setPShiftEndTimes((prev) => ({ ...prev, [shiftPickerDay]: time }));
                                }
                              }
                              setShiftPickerVisible(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dayOffOptionText,
                                isSelected && styles.dayOffOptionTextSelected,
                              ]}
                            >
                              {time}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={savePersonnel}>
              <Text style={styles.saveButtonText}>{editingPerson ? 'Güncelle' : 'Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Admin Booking Modal */}
      <AdminBookingModal
        visible={adminBookingModal}
        onClose={() => setAdminBookingModal(false)}
        salon={salon}
      />
    </View>
  );

  // =================== RENDER FUNCTIONS ===================

  function renderOverview() {
    return (
      <View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
            <FontAwesome5 name="users" size={20} color={COLORS.primary} />
            <Text style={styles.statNumber}>{personnel.length}</Text>
            <Text style={styles.statLabel}>Personel</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="today" size={20} color="#22C55E" />
            {isLoadingCount ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <Text style={styles.statNumber}>{todayCount}</Text>
            )}
            <Text style={styles.statLabel}>Bugün</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('personnel')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="person-add" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickActionTitle}>Personel Yönetimi</Text>
            <Text style={styles.quickActionSub}>Ekle, düzenle veya sil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('appointments')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="calendar" size={20} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickActionTitle}>Randevular</Text>
            <Text style={styles.quickActionSub}>Onayla veya iptal et</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={openSalonEdit}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="settings" size={20} color={COLORS.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickActionTitle}>Salon Ayarları</Text>
            <Text style={styles.quickActionSub}>Bilgileri güncelle</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderPersonnel() {
    return (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personel Listesi</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.addButton} onPress={() => setAdminBookingModal(true)}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Randevu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => openPersonnelEdit()}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {personnel.map((person) => (
          <View key={person.id} style={styles.personnelCard}>
            <View style={styles.personnelAvatar}>
              {person.image ? (
                <Image source={{ uri: person.image }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={24} color={COLORS.textMuted} />
              )}
            </View>
            <View style={styles.personnelInfo}>
              <Text style={styles.personnelName}>{person.name} {person.surname}</Text>
              <Text style={styles.personnelRole}>{person.role}</Text>
              {person.phone ? (
                <Text style={styles.personnelPhone}>{person.phone}</Text>
              ) : null}
            </View>
            <View style={styles.personnelActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => openPersonnelEdit(person)}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.info} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDeletePersonnel(person)}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {personnel.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Henüz personel yok</Text>
          </View>
        )}
      </View>
    );
  }

  function renderAppointments() {
    return (
      <View>
        <Text style={styles.sectionTitle}>Randevular</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
          Personele tıklayarak randevularını görüntüleyin
        </Text>

        {personnel.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Henüz personel yok</Text>
          </View>
        ) : (
          personnel.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={styles.personnelApptCard}
              onPress={() => navigation.navigate('PersonnelAppointments', { person })}
              activeOpacity={0.7}
            >
              <View style={styles.personnelApptLeft}>
                {person.image ? (
                  <Image source={{ uri: person.image }} style={styles.personnelApptAvatar} />
                ) : (
                  <View style={styles.personnelApptAvatarPlaceholder}>
                    <Ionicons name="person" size={20} color={COLORS.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.personnelApptName}>{person.name} {person.surname}</Text>
                  <Text style={styles.personnelApptRole}>{person.role || 'Personel'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  }

  function renderSettings() {
    return (
      <View>
        <Text style={styles.sectionTitle}>Salon Bilgileri</Text>

        {/* Owner Profile Photo */}
        <View style={styles.ownerProfileSection}>
          <TouchableOpacity style={styles.photoPickerContainer} onPress={pickOwnerImage} activeOpacity={0.7}>
            {ownerImage ? (
              <Image source={{ uri: ownerImage }} style={styles.photoPickerImage} />
            ) : (
              <View style={styles.photoPickerPlaceholder}>
                <Ionicons name="person" size={36} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.photoPickerBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.ownerNameText}>{salon.owner?.name} {salon.owner?.surname}</Text>
          <Text style={styles.photoPickerHint}>Fotoğrafı değiştirmek için dokunun</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Salon Adı</Text>
            <Text style={styles.settingsValue}>{salon.name}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Telefon</Text>
            <Text style={styles.settingsValue}>{salon.phone}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Adres</Text>
            <Text style={styles.settingsValue}>{salon.address}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Kuruluş</Text>
            <Text style={styles.settingsValue}>{salon.foundedYear}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Sahip</Text>
            <Text style={styles.settingsValue}>{salon.owner?.name} {salon.owner?.surname}</Text>
          </View>
          <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingsLabel}>Logo</Text>
            <TouchableOpacity style={styles.logoPickerRow} onPress={pickSalonLogo}>
              {salonLogo ? (
                <Image source={{ uri: salonLogo }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={22} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.logoChangeBtn}>
                <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} />
                <Text style={styles.logoChangeBtnText}>Değiştir</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.editSalonBtn} onPress={openSalonEdit}>
          <Ionicons name="create-outline" size={20} color="#FFF" />
          <Text style={styles.editSalonBtnText}>Bilgileri Düzenle</Text>
        </TouchableOpacity>

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
      </View>
    );
  }
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.8)',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radiusMedium,
    gap: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Quick Actions
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickActionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Personnel
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  personnelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  personnelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  personnelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personnelName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  personnelRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  personnelPhone: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  personnelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Appointments - Personnel Selection
  personnelApptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
  },
  personnelApptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  personnelApptAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personnelApptAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personnelApptName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  personnelApptRole: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Appointment Cards
  appointmentCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: SIZES.radiusMedium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  aptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aptStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aptStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aptService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  aptCustomer: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  aptCustomerPhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 4,
  },
  aptDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aptActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  aptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  aptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  // Settings
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: SIZES.radiusMedium,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settingsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  editSalonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    gap: 8,
    marginBottom: 12,
  },
  editSalonBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
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
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Dropdown styles
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
  // Photo Picker
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
    marginBottom: 12,
  },
  ownerProfileSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  ownerNameText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  logoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPreview: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  logoChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoChangeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Services dynamic list styles
  servicesInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addServiceBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addServiceBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  expandServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandServicesBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  servicesListContainer: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMedium,
    padding: 12,
  },
  serviceCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  serviceCardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  serviceChipText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
});
