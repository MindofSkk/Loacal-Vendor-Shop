import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ActiveOrderProvider } from './src/context/ActiveOrderContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/context/ToastContext';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';

enableScreens(false);

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <NavigationContainer ref={navigationRef}>
              <ActiveOrderProvider>
                <RootNavigator />
              </ActiveOrderProvider>
            </NavigationContainer>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
