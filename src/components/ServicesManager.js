/**
 * ServicesManager Component
 * Reusable services input and list rendering component
 * Used in both OwnerDashboardScreen (for personnel management)
 * and EmployeeDashboardScreen (for employee profile)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import styles from './ServicesManagerStyles';

export default function ServicesManager({
  servicesList = [],
  onServicesChange,
  readonly = false,
}) {
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);

  const toggleServicesExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsServicesExpanded(!isServicesExpanded);
  };

  const addService = () => {
    if (!serviceName.trim()) {
      Alert.alert('Uyarı', 'Lütfen hizmet adı girin.');
      return;
    }
    if (!serviceDuration.trim()) {
      Alert.alert('Uyarı', 'Lütfen süreyi girin.');
      return;
    }
    if (!servicePrice.trim()) {
      Alert.alert('Uyarı', 'Lütfen fiyatı girin.');
      return;
    }

    const newService = {
      id: `service-${Date.now()}-${Math.random()}`, // Unique ID generation
      name: serviceName.trim(),
      duration: serviceDuration.trim(),
      price: servicePrice.trim(),
    };

    const updatedList = [...servicesList, newService];
    onServicesChange(updatedList);

    // Clear inputs
    setServiceName('');
    setServiceDuration('');
    setServicePrice('');
  };

  const removeService = (id) => {
    const updatedList = servicesList.filter((service) => service.id !== id);
    onServicesChange(updatedList);
  };

  if (readonly) {
    // Display-only mode with dropdown
    return (
      <View>
        <Text style={styles.sectionTitle}>Hizmetler</Text>
        {servicesList.length > 0 ? (
          <View>
            <TouchableOpacity
              style={styles.expandServicesBtn}
              onPress={toggleServicesExpanded}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <Ionicons
                  name={isServicesExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
                <Text style={styles.expandServicesBtnText}>
                  Hizmetler ({servicesList.length})
                </Text>
              </View>
            </TouchableOpacity>

            {isServicesExpanded && (
              <View style={styles.servicesListContainer}>
                {servicesList.map((service, index) => (
                  <View key={service.id || `service-${index}`} style={styles.serviceCardItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceCardName}>{service.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.serviceCardMeta}>{service.duration} Dk</Text>
                        <Text style={{ color: '#CBD5E1' }}>•</Text>
                        <Text style={styles.serviceCardMeta}>{service.price} TL</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>Hizmet tanımlanmamış</Text>
        )}
      </View>
    );
  }

  // Edit mode with inputs and list
  return (
    <View>
      <Text style={styles.fieldLabel}>Hizmetler</Text>

      {/* Service Name Input */}
      <Text style={[styles.fieldLabel, { marginTop: 8, fontSize: 13 }]}>Hizmet Adı</Text>
      <TextInput
        style={styles.modalInput}
        placeholder="ör: Saç Kesimi"
        placeholderTextColor="#999"
        value={serviceName}
        onChangeText={setServiceName}
      />

      {/* Duration & Price - Side by Side */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldLabel, { fontSize: 13 }]}>Süre (Dk)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="30"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={serviceDuration}
            onChangeText={setServiceDuration}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldLabel, { fontSize: 13 }]}>Fiyat (TL)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="150"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={servicePrice}
            onChangeText={setServicePrice}
          />
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addServiceBtn} onPress={addService} activeOpacity={0.7}>
        <Ionicons name="add" size={20} color="#FFF" />
        <Text style={styles.addServiceBtnText}>Hizmet Ekle</Text>
      </TouchableOpacity>

      {/* Services List - Expandable */}
      {servicesList.length > 0 && (
        <View>
          <TouchableOpacity
            style={styles.expandServicesBtn}
            onPress={toggleServicesExpanded}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
              <Ionicons
                name={isServicesExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748B"
              />
              <Text style={styles.expandServicesBtnText}>
                Eklenen Hizmetler ({servicesList.length})
              </Text>
            </View>
          </TouchableOpacity>

          {isServicesExpanded && (
            <View style={styles.servicesListContainer}>
              {servicesList.map((service, index) => (
                <View key={service.id || `service-${index}`} style={styles.serviceCardItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceCardName}>{service.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.serviceCardMeta}>{service.duration} Dk</Text>
                      <Text style={{ color: '#CBD5E1' }}>•</Text>
                      <Text style={styles.serviceCardMeta}>{service.price} TL</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeService(service.id)} activeOpacity={0.6}>
                    <Ionicons name="trash" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
