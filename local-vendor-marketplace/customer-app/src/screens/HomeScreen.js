import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { CompactLocationHeader, EmptyState, Loader, ProductCard, ProductListCard, SearchBar, SectionHeader, ShopCard, styles } from '../components/ui';
import { colors } from '../constants';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { getOrderStatusMeta } from '../utils/orderStatus';

const MODE_STORAGE_KEY = 'lvm_customer_home_mode';
const twemoji = (code) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`;

const modeConfigs = [
  {
    key: 'food',
    label: 'Food',
    image: twemoji('1f354'),
    businessType: 'Restaurant',
    searchPlaceholder: 'Search for biryani, pizza, burger...',
    categoryTitle: 'Food Categories',
    shopTitle: 'Nearby Restaurants',
    productTitle: 'Popular Dishes',
    recommendedTitle: 'Recommended Restaurants',
    recommendedKind: 'shops',
    recommendedEmptyTitle: 'No more restaurants nearby',
    recommendedEmptyMessage: 'Try changing your location or food category.',
    matchingTitle: 'Matching Food',
    noShopTitle: 'No restaurants found',
    noProductTitle: 'No matching food items found',
    categories: [
      { label: 'Biryani', image: twemoji('1f35a'), keywords: ['biryani', 'main course'] },
      { label: 'Pizza', image: twemoji('1f355'), keywords: ['pizza', 'snacks'] },
      { label: 'Burger', image: twemoji('1f354'), keywords: ['burger', 'snacks'] },
      { label: 'Snacks', image: twemoji('1f950'), keywords: ['snacks', 'starter'] },
      { label: 'Drinks', image: twemoji('1f964'), keywords: ['drinks'] }
    ]
  },
  {
    key: 'grocery',
    label: 'Grocery',
    image: twemoji('1f9fa'),
    businessType: 'Grocery / Kirana Store',
    searchPlaceholder: 'Search for atta, haldi, oil, rice...',
    categoryTitle: 'Grocery Categories',
    shopTitle: 'Nearby Kirana Stores',
    productTitle: 'Popular Essentials',
    recommendedTitle: 'Recommended Grocery Products',
    recommendedKind: 'products',
    recommendedEmptyTitle: 'No more grocery products',
    recommendedEmptyMessage: 'Try another grocery category or keyword.',
    matchingTitle: 'Matching Grocery Products',
    noShopTitle: 'No grocery shops found',
    noProductTitle: 'No matching grocery products found',
    categories: [
      { label: 'Atta, Rice & Flour', image: twemoji('1f35a'), keywords: ['atta', 'rice', 'flour'] },
      { label: 'Pulses & Dals', image: twemoji('1f963'), keywords: ['dal', 'pulses'] },
      { label: 'Oils & Ghee', image: twemoji('1f95b'), keywords: ['oil', 'ghee'] },
      { label: 'Masala & Spices', image: twemoji('1f336-fe0f'), keywords: ['masala', 'spice', 'haldi', 'turmeric'] },
      { label: 'Packaged Food', image: twemoji('1f371'), keywords: ['snacks', 'packaged'] },
      { label: 'Personal Care', image: twemoji('1f9fc'), keywords: ['personal care', 'soap', 'shampoo'] }
    ]
  },
  {
    key: 'dairy',
    label: 'Dairy',
    image: twemoji('1f95b'),
    businessType: 'Dairy and Bakery',
    searchPlaceholder: 'Search for milk, curd, bread, cake...',
    categoryTitle: 'Fresh Categories',
    shopTitle: 'Nearby Dairy & Bakery Stores',
    productTitle: 'Fresh Picks',
    recommendedTitle: 'Recommended Dairy & Bakery Items',
    recommendedKind: 'products',
    recommendedEmptyTitle: 'No more fresh items',
    recommendedEmptyMessage: 'Try another dairy or bakery category.',
    matchingTitle: 'Matching Dairy & Bakery Products',
    noShopTitle: 'No dairy or bakery shops found',
    noProductTitle: 'No matching dairy or bakery products found',
    categories: [
      { label: 'Milk', image: twemoji('1f95b'), keywords: ['milk', 'dairy'] },
      { label: 'Curd', image: twemoji('1f963'), keywords: ['curd', 'dairy'] },
      { label: 'Bread', image: twemoji('1f35e'), keywords: ['bread', 'bakery'] },
      { label: 'Cake', image: twemoji('1f370'), keywords: ['cake', 'bakery'] },
      { label: 'Paneer', image: twemoji('1f9c0'), keywords: ['paneer', 'dairy'] }
    ]
  }
];

const searchableProductText = (product) =>
  `${product.name || ''} ${product.businessType || ''} ${product.brand || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''} ${product.dairyBakeryType || ''} ${product.description || ''}`.toLowerCase();

const matchesModeCategory = (product, category) => {
  if (!category) return true;
  const text = searchableProductText(product);
  return category.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

export default function HomeScreen({ navigation }) {
  const { addItem } = useCart();
  const { activeOrder, refreshActiveOrder, orderNumber, shopName, totalAmount, itemCount, estimatedDeliveryTime, currentStatus } = useActiveOrder();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [allShops, setAllShops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeMode, setActiveMode] = useState('grocery');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const locationParams = location ? { latitude: location.latitude, longitude: location.longitude } : {};
      const [shopRes, productRes] = await Promise.all([
        shopApi.list({ category: '', ...locationParams }),
        productApi.list({})
      ]);
      setAllShops(shopRes.data);
      setAllProducts(productRes.data);
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [location, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      refreshActiveOrder({ silent: true, notify: true });
    }, [refreshActiveOrder])
  );

  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY)
      .then((storedMode) => {
        if (modeConfigs.some((mode) => mode.key === storedMode)) setActiveMode(storedMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(MODE_STORAGE_KEY, activeMode).catch(() => {});
  }, [activeMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const activeConfig = useMemo(() => modeConfigs.find((mode) => mode.key === activeMode) || modeConfigs[0], [activeMode]);

  const selectMode = useCallback((modeKey) => {
    setActiveMode(modeKey);
    setSelectedCategory(null);
    setSearch('');
    setDebouncedSearch('');
  }, []);

  const filteredShops = useMemo(() => {
    return allShops
      .filter((shop) => shop.businessType === activeConfig.businessType)
      .filter((shop) => {
        if (!debouncedSearch) return true;
        return `${shop.name || ''} ${shop.businessType || ''} ${shop.location?.area || ''} ${shop.location?.city || ''}`.toLowerCase().includes(debouncedSearch);
      });
  }, [activeConfig.businessType, allShops, debouncedSearch]);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => product.businessType === activeConfig.businessType)
      .filter((product) => matchesModeCategory(product, selectedCategory))
      .filter((product) => {
        if (!debouncedSearch) return true;
        return searchableProductText(product).includes(debouncedSearch);
      });
  }, [activeConfig.businessType, allProducts, debouncedSearch, selectedCategory]);

  const captureLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Unable to fetch location. Please enter manually.';
        setLocationError(message);
        showToast({ type: 'warning', message });
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      showToast({ type: 'success', message: 'Location added' });
    } catch (_err) {
      const message = 'Unable to fetch location. Please enter manually.';
      setLocationError(message);
      showToast({ type: 'warning', message });
    } finally {
      setLocationLoading(false);
    }
  }, [showToast]);

  const addToCart = useCallback((product) => {
    try {
      addItem(product);
      showToast({
        type: 'success',
        message: 'Added to cart',
        actionLabel: 'View Cart',
        onAction: () => navigation.navigate('Cart', { screen: 'CartMain' })
      });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  }, [addItem, navigation, showToast]);

  const openProfile = useCallback(() => {
    navigation.getParent()?.navigate('Profile');
  }, [navigation]);

  const hasSearch = Boolean(debouncedSearch);
  const noSearchResults = hasSearch && filteredShops.length === 0 && filteredProducts.length === 0;

  const headerComponent = useMemo(() => (
    <View style={{ gap: 12 }}>
      <CompactLocationHeader
        greeting="Hello, SkK!"
        addressText={location ? 'Current location selected' : 'nagri, Ranchi, 835303'}
        loading={locationLoading}
        notificationCount={unreadCount}
        onPressLocation={captureLocation}
        onPressNotifications={() => navigation.navigate('Notifications')}
        onPressProfile={openProfile}
      />
      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

      <View style={styles.modeTabs}>
        {modeConfigs.map((mode) => {
          const active = activeMode === mode.key;
          return (
            <Pressable key={mode.key} onPress={() => selectMode(mode.key)} style={({ pressed }) => [styles.modeTab, active ? styles.modeTabActive : null, pressed ? styles.pressed : null]}>
              <Image source={{ uri: mode.image }} style={styles.modeTabImage} />
              <Text style={[styles.modeTabText, active ? styles.modeTabTextActive : null]} numberOfLines={1}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        onVoicePress={() => showToast({ type: 'info', message: 'Keyboard opened. Tap the keyboard mic and speak to search.' })}
        placeholder={activeConfig.searchPlaceholder}
      />

      {activeOrder ? (
        <ActiveOrderCard
          status={currentStatus}
          shopName={shopName}
          orderNumber={orderNumber}
          itemCount={itemCount}
          totalAmount={totalAmount}
          eta={estimatedDeliveryTime}
          onPress={() => navigation.getParent()?.navigate('Orders', { screen: 'OrderDetails', params: { order: activeOrder } })}
        />
      ) : null}

      <View style={{ gap: 9 }}>
        <SectionHeader title={activeConfig.categoryTitle} action={selectedCategory ? 'Clear' : 'See all'} onAction={() => setSelectedCategory(null)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeCategoryList}>
          {activeConfig.categories.map((category) => {
            const active = selectedCategory?.label === category.label;
            return (
              <Pressable key={category.label} onPress={() => setSelectedCategory(active ? null : category)} style={({ pressed }) => [styles.modeCategoryCard, active ? styles.modeCategoryCardActive : null, pressed ? styles.pressed : null]}>
                <View style={[styles.modeCategoryIcon, active ? styles.modeCategoryIconActive : null]}>
                  <Image source={{ uri: category.image }} style={styles.modeCategoryImage} />
                </View>
                <Text style={styles.modeCategoryTitle} numberOfLines={2}>{category.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {noSearchResults ? (
        <EmptyState title={activeConfig.noShopTitle} message={activeConfig.noProductTitle} />
      ) : (
        <SectionHeader title={activeConfig.shopTitle} action="View all" onAction={() => setSelectedCategory(null)} />
      )}
    </View>
  ), [activeConfig, activeMode, activeOrder, captureLocation, currentStatus, estimatedDeliveryTime, filteredProducts.length, filteredShops.length, itemCount, location, locationError, locationLoading, navigation, noSearchResults, openProfile, orderNumber, search, selectMode, selectedCategory, shopName, showToast, totalAmount, unreadCount]);

  const footerComponent = useMemo(() => {
    if (noSearchResults) return null;
    const popularProducts = filteredProducts.slice(0, 12);
    const recommendedProducts = filteredProducts.length > 4 ? filteredProducts.slice(4, 10) : filteredProducts.slice(0, 4);
    const recommendedShops = filteredShops.slice(0, 3);

    return (
      <View style={styles.homeFooterSections}>
        {popularProducts.length > 0 ? (
          <View style={styles.homeSectionBlock}>
            <SectionHeader title={hasSearch ? activeConfig.matchingTitle : activeConfig.productTitle} action="See all" />
            <FlatList
              horizontal
              data={popularProducts}
              keyExtractor={(product) => product._id}
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.homeProductRail}
              renderItem={({ item: product }) => (
                <ProductCard
                  product={product}
                  onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                  onAdd={() => addToCart(product)}
                />
              )}
            />
          </View>
        ) : (
          <EmptyState title={activeConfig.noProductTitle} message="Try another category or search term." />
        )}

        {activeConfig.recommendedKind === 'shops' ? (
          recommendedShops.length > 0 ? (
            <View style={styles.homeSectionBlock}>
              <SectionHeader title={activeConfig.recommendedTitle} action="View all" />
              {recommendedShops.map((shop) => (
                <ShopCard key={`recommended-${shop._id}`} shop={shop} onPress={() => navigation.navigate('ShopDetails', { shopId: shop._id })} />
              ))}
            </View>
          ) : (
            <EmptyState title={activeConfig.recommendedEmptyTitle} message={activeConfig.recommendedEmptyMessage} />
          )
        ) : recommendedProducts.length > 0 ? (
          <View style={styles.homeSectionBlock}>
            <SectionHeader title={activeConfig.recommendedTitle} action="See all" />
            {recommendedProducts.map((product) => (
              <ProductListCard
                key={`recommended-${product._id}`}
                product={product}
                onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                onAdd={() => addToCart(product)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title={activeConfig.recommendedEmptyTitle} message={activeConfig.recommendedEmptyMessage} />
        )}
      </View>
    );
  }, [activeConfig, addToCart, filteredProducts, filteredShops, hasSearch, navigation, noSearchResults]);

  if (initialLoading) return <Loader />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 16) }]}
      data={noSearchResults ? [] : filteredShops}
      keyExtractor={(shop) => shop._id}
      keyboardShouldPersistTaps="always"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={!noSearchResults ? <EmptyState title={activeConfig.noShopTitle} message="Try another mode, category, or run the quick setup seed." /> : null}
      ListFooterComponent={footerComponent}
      renderItem={({ item: shop }) => <ShopCard shop={shop} onPress={() => navigation.navigate('ShopDetails', { shopId: shop._id })} />}
    />
  );
}

function ActiveOrderCard({ status, shopName, orderNumber, itemCount, totalAmount, eta, onPress }) {
  const meta = getOrderStatusMeta(status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [homeOrderStyles.card, { backgroundColor: meta.bg, borderColor: `${meta.color}30` }, pressed ? styles.pressed : null]}>
      <View style={[homeOrderStyles.iconBubble, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.icon} size={20} color="#fff" />
      </View>
      <View style={styles.flex}>
        <View style={styles.between}>
          <Text style={homeOrderStyles.statusText}>{meta.label}</Text>
          {eta ? <Text style={homeOrderStyles.etaText}>{eta}</Text> : null}
        </View>
        <Text style={homeOrderStyles.title} numberOfLines={1}>{shopName}</Text>
        <Text style={homeOrderStyles.message} numberOfLines={2}>{meta.progressText(shopName)}</Text>
        <Text style={homeOrderStyles.meta}>#{orderNumber} - {itemCount} {itemCount === 1 ? 'item' : 'items'} - Rs.{Number(totalAmount || 0)}</Text>
      </View>
      <View style={homeOrderStyles.viewPill}>
        <Text style={homeOrderStyles.viewText}>View</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const homeOrderStyles = StyleSheet.create({
  card: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#111827',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  iconBubble: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  etaText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 2 },
  message: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 5 },
  viewPill: { minHeight: 34, borderRadius: 999, backgroundColor: '#fff', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { color: colors.primary, fontSize: 12, fontWeight: '700' }
});
