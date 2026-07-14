import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loader } from '../components/ui';
import { colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import BusinessSettingsScreen from '../screens/BusinessSettingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DeliveryBoysScreen from '../screens/DeliveryBoysScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopProfileScreen from '../screens/ShopProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} options={{ title: 'Shop Profile' }} />
      <Stack.Screen name="DeliveryBoys" component={DeliveryBoysScreen} options={{ title: 'Delivery Boys' }} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Product Form' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="SettingsMain" component={BusinessSettingsScreen} options={{ title: 'Business Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function getTabIcon(routeName, focused) {
  const icons = {
    Dashboard: focused ? 'storefront' : 'storefront-outline',
    Orders: focused ? 'receipt' : 'receipt-outline',
    Products: focused ? 'cube' : 'cube-outline',
    Settings: focused ? 'settings' : 'settings-outline'
  };
  return icons[routeName] || 'ellipse-outline';
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const baseTabBarStyle = {
    height: 54 + bottomInset,
    paddingTop: 6,
    paddingBottom: bottomInset,
    borderTopColor: colors.border,
    backgroundColor: '#fff'
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 10 },
        tabBarStyle:
          route.name === 'Dashboard' && ['ShopProfile', 'DeliveryBoys'].includes(getFocusedRouteNameFromRoute(route) || '')
            ? { display: 'none' }
            : route.name === 'Products' && ['ProductForm'].includes(getFocusedRouteNameFromRoute(route) || '')
              ? { display: 'none' }
              : route.name === 'Orders' && ['OrderDetails'].includes(getFocusedRouteNameFromRoute(route) || '')
                ? { display: 'none' }
                : route.name === 'Settings' && ['Profile'].includes(getFocusedRouteNameFromRoute(route) || '')
                  ? { display: 'none' }
                  : baseTabBarStyle,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={22} color={color} />
        )
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardStack} />
      <Tabs.Screen name="Orders" component={OrdersStack} />
      <Tabs.Screen name="Products" component={ProductsStack} />
      <Tabs.Screen name="Settings" component={SettingsStack} options={{ title: 'More' }} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? <Stack.Screen name="AppTabs" component={AppTabs} /> : <Stack.Screen name="Auth" component={AuthScreen} />}
    </Stack.Navigator>
  );
}
