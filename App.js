import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, AppState } from 'react-native';
import * as Network from 'expo-network';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { seedDatabase } from './src/services/firebaseService';

function NoInternetOverlay({ visible }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>{'📡'}</Text>
          <Text style={styles.title}>İnternet Bağlantısı Yok</Text>
          <Text style={styles.message}>
            Uygulamayı kullanabilmek için lütfen internet bağlantınızı kontrol edin.
          </Text>
          <Text style={styles.hint}>Bağlantı sağlandığında otomatik olarak devam edilecektir.</Text>
        </View>
      </View>
    </Modal>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef(null);

  const checkConnection = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    checkConnection();

    intervalRef.current = setInterval(checkConnection, 3000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkConnection();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [checkConnection]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <AppNavigator />
      <NoInternetOverlay visible={!isConnected} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}
