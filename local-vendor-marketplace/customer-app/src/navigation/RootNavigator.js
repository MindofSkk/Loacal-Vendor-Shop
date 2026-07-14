import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthScreen from '../screens/AuthScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import HomeScreen from '../screens/HomeScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopDetailsScreen from '../screens/ShopDetailsScreen';
import ShopListingScreen from '../screens/ShopListingScreen';
import { colors } from '../constants';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '600', fontSize: 17 } }}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ title: 'Order Success' }} />
    </Stack.Navigator>
  );
}

function getTabIcon(routeName, focused) {
  const icons = {
    Home: focused ? 'home' : 'home-outline',
    Search: focused ? 'search' : 'search-outline',
    Orders: focused ? 'receipt' : 'receipt-outline',
    Cart: focused ? 'cart' : 'cart-outline',
    Profile: focused ? 'person' : 'person-outline'
  };
  return icons[routeName] || 'ellipse-outline';
}

function AppTabs() {
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const cartQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const bottomInset = Math.max(insets.bottom, 8);
  const baseTabBarStyle = {
    height: 56 + bottomInset,
    paddingTop: 6,
    paddingBottom: bottomInset,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 10, marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarStyle:
          route.name === 'Home' && ['ShopDetails', 'ProductDetails'].includes(getFocusedRouteNameFromRoute(route) || '')
            ? { display: 'none' }
            : route.name === 'Cart' && ['Checkout', 'OrderSuccess'].includes(getFocusedRouteNameFromRoute(route) || '')
              ? { display: 'none' }
              : route.name === 'Orders' && ['OrderDetails'].includes(getFocusedRouteNameFromRoute(route) || '')
            ? { display: 'none' }
            : baseTabBarStyle,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={focused ? 23 : 22} color={color} />
        )
      })}
    >
      <Tabs.Screen name="Home" component={HomeStack} />
      <Tabs.Screen name="Search" component={ShopListingScreen} />
      <Tabs.Screen name="Orders" component={OrdersStack} />
      <Tabs.Screen
        name="Cart"
        component={CartStack}
        options={{
          tabBarBadge: cartQuantity > 0 ? cartQuantity : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff', fontWeight: '700' }
        }}
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="AppTabs" component={AppTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
