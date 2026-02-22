import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { seedDatabase } from './src/services/firebaseService';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}
