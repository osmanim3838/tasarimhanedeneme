import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getSalon } from '../services/firebaseService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 32;

export default function AboutScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSalon();
  }, []);

  const loadSalon = async () => {
    try {
      const data = await getSalon('tasarimhane');
      setSalon(data);
    } catch (error) {
      console.error('Error loading salon:', error);
    } finally {
      setLoading(false);
    }
  };

  const onScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.headerGradient}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}
      >
        <Text style={styles.headerTitle}>Salon Hakkında</Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={salon?.images || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            snapToInterval={IMAGE_WIDTH}
            decelerationRate="fast"
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <Image source={{ uri: item }} style={styles.carouselImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageOverlay}
                >
                  <Text style={styles.imageSalonName}>{salon?.name || 'TASARIMHANE'}</Text>
                  <Text style={styles.imageSalonType}>Kadın / Erkek Kuaförü</Text>
                </LinearGradient>
              </View>
            )}
          />
          {/* Dots */}
          <View style={styles.dotsContainer}>
            {(salon?.images || []).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Salon Bilgileri Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Salon Bilgileri</Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome5 name="user-tie" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Salon Sahibi</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{salon?.owner?.name ? `${salon.owner.name} ${salon.owner.surname || ''}`.trim() : '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kuruluş Yılı</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{salon?.foundedYear || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome5 name="users" size={16} color={COLORS.primary} style={styles.infoIcon} />
            <View>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Personel Sayısı</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{salon?.staffCount || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Salon Hakkında Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Salon Hakkında</Text>
          </View>

          <View style={[styles.aboutContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.aboutText, { color: colors.textPrimary }]}>{salon?.about || ''}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
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
    alignItems: 'center',
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
  carouselContainer: {
    marginBottom: 20,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: 220,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  imageSalonName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  imageSalonType: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIcon: {
    width: 32,
    textAlign: 'center',
    marginRight: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  aboutContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMedium,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlign: 'justify',
  },
});
