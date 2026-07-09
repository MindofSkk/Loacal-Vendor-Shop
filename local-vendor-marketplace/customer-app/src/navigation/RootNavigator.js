import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '900' } }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'LocalShop' }} />
      <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} options={{ title: 'Shop Details' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '900' } }}>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '900' } }}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
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
  const cartQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '900', fontSize: 12 },
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.border,
          backgroundColor: '#fff'
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={22} color={color} />
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
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff', fontWeight: '900' }
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
