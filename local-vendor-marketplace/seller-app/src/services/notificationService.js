import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationApi, orderApi } from '../api/services';
import { navigateToSellerOrderDetails } from '../navigation/navigationRef';

const tokenKey = 'lvm_seller_expo_push_token';
const pendingTargetKey = 'lvm_seller_pending_notification_target';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const configureNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  const channels = [
    ['new-orders', 'New orders', Notifications.AndroidImportance.MAX, 'High priority alerts for new customer orders'],
    ['order-actions', 'Order actions', Notifications.AndroidImportance.HIGH, 'Order cancellation and status alerts'],
    ['shop-alerts', 'Shop alerts', Notifications.AndroidImportance.DEFAULT, 'Shop approval and operational alerts'],
    ['account', 'Account alerts', Notifications.AndroidImportance.DEFAULT, 'Account and security notifications']
  ];

  await Promise.all(channels.map(([id, name, importance, description]) =>
    Notifications.setNotificationChannelAsync(id, {
      name,
      description,
      importance,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      showBadge: true
    })
  ));
};

const getProjectId = () =>
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId ||
  Constants.expoConfig?.extra?.projectId;

export const registerForPushNotifications = async () => {
  await configureNotificationChannels();

  if (!Device.isDevice) {
    return { status: 'skipped', reason: 'Push notifications require a physical device.' };
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return { status: 'denied', reason: 'Notification permission denied.' };
  }

  const projectId = getProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const expoPushToken = tokenResult.data;
  const previousToken = await AsyncStorage.getItem(tokenKey);

  if (previousToken !== expoPushToken) {
    await notificationApi.registerToken({
      expoPushToken,
      platform: Platform.OS,
      deviceId: Constants.sessionId || Device.osBuildId || '',
      appType: 'seller'
    });
    await AsyncStorage.setItem(tokenKey, expoPushToken);
  }

  return { status: 'registered', expoPushToken };
};

export const unregisterPushToken = async () => {
  const expoPushToken = await AsyncStorage.getItem(tokenKey);
  if (!expoPushToken) return;
  try {
    await notificationApi.unregisterToken({ expoPushToken });
  } finally {
    await AsyncStorage.removeItem(tokenKey);
  }
};

export const storePendingNotificationTarget = async (target) => {
  await AsyncStorage.setItem(pendingTargetKey, JSON.stringify(target));
};

export const consumePendingNotificationTarget = async () => {
  const stored = await AsyncStorage.getItem(pendingTargetKey);
  if (!stored) return null;
  await AsyncStorage.removeItem(pendingTargetKey);
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const openNotificationTarget = async (data, isAuthenticated) => {
  if (!data?.orderId) return;

  if (!isAuthenticated) {
    await storePendingNotificationTarget(data);
    return;
  }

  const { data: orders } = await orderApi.sellerOrders();
  const order = orders.find((item) => item._id === data.orderId);
  if (order) navigateToSellerOrderDetails(order);
};
