import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/context/ToastContext';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';

enableScreens(false);

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer ref={navigationRef}>
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
