import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
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
  }, []);

  // Register token for user or employee
  useEffect(() => {
    const registerPushNotifications = async () => {
      try {
        // Get the device's push token
        const token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: '541303114598', // From google-services.json messagingSenderId
          })
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
