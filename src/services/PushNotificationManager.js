import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useUser } from '../context/UserContext';
import { registerPushTokenForUser, registerPushTokenForEmployee } from './firebaseService';

/**
 * PushNotificationManager Component
 * 
 * This component:
 * 1. Configures Expo Notification handler for all incoming notifications
 * 2. Registers the device's FCM token to Firebase when user logs in
 * 3. Automatically updates token when user/employee changes
 */
export default function PushNotificationManager() {
  const { user, employee } = useUser();

  // Configure notification handler (global)
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Create default notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Varsayılan',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
  }, []);

  // Register token for user or employee
  useEffect(() => {
    const registerPushNotifications = async () => {
      try {
        // Request permissions first
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('⚠️ Push notification permission not granted');
          return;
        }

        // Get projectId from app config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 'cc7033c9-c811-4219-8a58-398a50b7a863';
        
        // Get the device's push token
        const token = (
          await Notifications.getExpoPushTokenAsync({ projectId })
        ).data;

        console.log('📲 Expo Push Token:', token);

        // Register token based on user role
        if (user?.id) {
          await registerPushTokenForUser(user.id, token);
          console.log('✅ Push token registered for user:', user.id);
        } else if (employee?.id) {
          await registerPushTokenForEmployee(employee.id, token);
          console.log('✅ Push token registered for employee:', employee.id);
        }
      } catch (err) {
        console.error('❌ Failed to register push token:', err);
      }
    };

    // Only register if user or employee is logged in
    if (user?.id || employee?.id) {
      registerPushNotifications();
    }
  }, [user?.id, employee?.id]);

  return null; // This component doesn't render anything
}
