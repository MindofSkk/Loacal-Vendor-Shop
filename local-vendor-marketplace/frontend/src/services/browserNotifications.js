const permissionKey = 'lvm_browser_notification_permission_seen';

export const isBrowserNotificationSupported = () => 'Notification' in window;

export const getBrowserNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestBrowserNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  if (localStorage.getItem(permissionKey) && Notification.permission === 'default') return 'default';

  localStorage.setItem(permissionKey, 'true');
  return Notification.requestPermission();
};

export const registerBrowserPushToken = async () => {
  // Firebase Web config is intentionally not hardcoded. Add Firebase config and token
  // registration here when production web push credentials are available.
  return { configured: false, reason: 'Firebase Web config is not configured.' };
};

export const unregisterBrowserPushToken = async () => {
  return { configured: false };
};
