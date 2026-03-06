import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUser } from '../context/UserContext';
import { getSession } from '../services/sessionService';

import EntryScreen from '../screens/EntryScreen';
import VerificationScreen from '../screens/VerificationScreen';
import NameInputScreen from '../screens/NameInputScreen';
import HomeScreen from '../screens/HomeScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import ContractsScreen from '../screens/ContractsScreen';
import PersonnelListScreen from '../screens/PersonnelListScreen';
import PersonnelDetailScreen from '../screens/PersonnelDetailScreen';
import SalonLoginScreen from '../screens/SalonLoginScreen';
import SalonVerificationScreen from '../screens/SalonVerificationScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import EmployeeDashboardScreen from '../screens/EmployeeDashboardScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import PersonnelAppointmentsScreen from '../screens/PersonnelAppointmentsScreen';
import CustomTabBar from '../components/CustomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
      <Tab.Screen name="Contact" component={ContactScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialParams, setInitialParams] = useState({});
  const { setUser, setEmployee } = useUser();

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session) {
          if (session.role === 'user') {
            setUser(session.data);
            setInitialRoute('MainTabs');
          } else if (session.role === 'owner') {
            setInitialRoute('OwnerDashboard');
            setInitialParams({ salon: session.data });
          } else if (session.role === 'employee') {
            setEmployee(session.data);
            setInitialRoute('EmployeeDashboard');
            setInitialParams({ employee: session.data });
          } else {
            setInitialRoute('Entry');
          }
        } else {
          setInitialRoute('Entry');
        }
      } catch {
        setInitialRoute('Entry');
      }
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="NameInput" component={NameInputScreen} />
        <Stack.Screen name="SalonLogin" component={SalonLoginScreen} />
        <Stack.Screen name="SalonVerification" component={SalonVerificationScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} initialParams={initialRoute === 'OwnerDashboard' ? initialParams : undefined} />
        <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} initialParams={initialRoute === 'EmployeeDashboard' ? initialParams : undefined} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} />
        <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
        <Stack.Screen name="PersonnelList" component={PersonnelListScreen} />
        <Stack.Screen name="PersonnelDetail" component={PersonnelDetailScreen} />
        <Stack.Screen name="PersonnelAppointments" component={PersonnelAppointmentsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Contracts" component={ContractsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
