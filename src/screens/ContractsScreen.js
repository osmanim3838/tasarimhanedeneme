import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ContractsScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedContract, setSelectedContract] = useState(null);

  const contracts = [
    {
      id: 'kvkk',
      title: 'KVKK - Kişisel Veri Koruma Kanunu',
      icon: 'document-text-outline',
      content: `KVKK - KİŞİSEL VERİ KORUMA KANUNU

Son Güncelleme: Şubat 2026

1. GİRİŞ

Tasarimhane olarak, müşterilerimizin kişisel verilerinin korunması ve gizliliğine önem vermekteyiz. Bu belge, 6698 sayılı Kişisel Veri Koruma Kanunu ("KVKK") hükümleri uyarınca hazırlanmıştır.

2. VERİ SORUMLUSU

Tasarimhane olarak, kişisel verileriniz hakkında veri sorumlusudur.

3. TOPLANAN KİŞİSEL VERİLER

Hizmetlerimizi size sunabilmek için aşağıdaki kişisel verileriniz toplanmaktadır:
- Ad, Soyad
- Telefon Numarası
- E-mail Adresi
- Randevu Tarihleri ve Saatleri
- Hizmet Geçmişi

4. VERİLERİN İŞLENME AMACI

Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
- Salon hizmetlerinin sağlanması
- Randevu yönetimi
- İletişim
- Müşteri hizmetleri
- İstatistiksel analiz

5. VERİLERİN İŞLENME HUKUKI SEBEBİ

Kişisel verilerinizin işlenmesinin hukuki sebebi, KVKK'nın 5. maddesi gereğince:
- Sözleşme yükümlülüğünün yerine getirilmesi
- Rıza

6. VERİ SAHİPLERİNİN HAKLARI

KVKK'nın 12. maddesi gereğince, aşağıdaki haklara sahipsiniz:
- Kişisel verilerinize erişme hakkı
- Yanlış verilerin düzeltilmesini isteme hakkı
- Verilerin silinmesini isteme hakkı
- İşlenmesine itiraz etme hakkı
- İşlenmesine yönelik sınırlandırma isteme hakkı

Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.

7. VERİ GÜVENLİĞİ

Kişisel verilerinizin korunması için uygun teknik ve idari tedbirler almaktayız. Verileriniz, yetkisiz erişim, değiştirilme, bozulma veya kayıp risklerine karşı korunmaktadır.

8. İLETİŞİM

Bu politika veya kişisel verilerinizle ilgili sorularınız için lütfen bizimle iletişime geçiniz.

Email: info@tasarimhane.com
Telefon: +90 (212) 123-45-67`,
    },
    {
      id: 'privacy',
      title: 'Gizlilik Politikası',
      icon: 'shield-outline',
      content: `GİZLİLİK POLİTİKASI

Son Güncelleme: Şubat 2026

1. GENEL

Bu Gizlilik Politikası, Tasarimhane tarafından sağlanan hizmetleri kullanırken kişisel bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.

2. TOPLANAN BİLGİLER

Aşağıdaki bilgileri toplayabiliriz:
- İletişim Bilgileri (ad, soyad, telefon, e-posta)
- Randevu Bilgileri (tercih edilen tarih, saat, hizmet türü)
- Kullanım Verileri (uygulamayı nasıl kullandığınız)
- Cihaz Bilgileri (cihaz türü, işletim sistemi, tarayıcı bilgisi)

3. BİLGİLERİN KULLANIMI

Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:
- Randevu talebinizi karşılamak
- Size bilgi sağlamak
- Hizmet kalitesini iyileştirmek
- İstatistiksel amaçlar
- Yasalara uyum sağlamak

4. BİLGİLERİN PAYLAŞILMASI

Kişisel verileriniz, yasal zorunluluğu hariç, üçüncü taraflar ile paylaşılmaz. Hizmet sağlayıcılarımız (örn. SMS gönderimi, bildirim servisleri) gizlilik yükümlülüğü altındadır.

5. VERİ SAKLAMA

Kişisel verileriniz, amaca ulaşıncaya kadar veya yasalarca gerekli olan süre kadar saklanır. İhtiyaç duyulmayan veriler silinir.

6. GÜVENLİK

Verilerinizi korumak için endüstri standardı güvenlik ölçüleri kullanıyoruz. Ancak hiçbir internet aktarımı %100 güvenli değildir.

7. ÇEREZLER (COOKIES)

Uygulamada, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanılabilir. Çerezleri tarayıcı ayarlarından kontrol edebilirsiniz.

8. YAŞA DAYALI KISITWLAMALAR

Hizmetlerimiz 18 yaşından büyük kişiler için tasarlanmıştır. 18 yaşından küçük çocukların verilerini kasıtlı olarak toplamıyoruz.

9. POLİTİKA DEĞİŞİKLİKLERİ

Bu politikayı zaman zaman güncelleyebiliriz. Değişiklikler uygulamada yayınlandığında geçerlidir.

10. İLETİŞİM

Gizlilik hakkında sorularınız varsa, lütfen bizimle iletişime geçiniz:

Email: privacy@tasarimhane.com
Telefon: +90 (212) 123-45-67`,
    },
  ];

  const handleContractSelect = (contractId) => {
    setSelectedContract(contractId === selectedContract ? null : contractId);
  };

  if (selectedContract) {
    const contract = contracts.find(c => c.id === selectedContract);
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={COLORS.headerGradient}
          style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedContract(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{contract.title}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.contractContent, { color: colors.textPrimary }]}>
            {contract.content}
          </Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Sözleşmeler</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {contracts.map((contract) => (
          <TouchableOpacity
            key={contract.id}
            style={[styles.contractCard, { backgroundColor: colors.card }]}
            onPress={() => handleContractSelect(contract.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.contractIcon, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name={contract.icon} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.contractInfo}>
              <Text style={[styles.contractTitle, { color: colors.textPrimary }]}>
                {contract.title}
              </Text>
              <Text style={[styles.contractDesc, { color: colors.textMuted }]}>
                Tıklayarak okuyun
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}

        <View style={{ height: 50 }} />
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
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contractIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contractInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  contractDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  contractContent: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.textPrimary,
    textAlign: 'justify',
  },
});
