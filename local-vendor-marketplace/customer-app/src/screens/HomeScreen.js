import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { CategoryCard, CompactLocationHeader, EmptyState, Loader, ProductCard, SearchBar, SectionHeader, ShopCard, styles } from '../components/ui';
import { categories } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function HomeScreen({ navigation }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [allShops, setAllShops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredShops = useMemo(() => {
    return allShops
      .filter((shop) => (selectedCategory ? shop.businessType === selectedCategory : true))
      .filter((shop) => {
        if (!debouncedSearch) return true;
        return `${shop.name || ''} ${shop.businessType || ''} ${shop.location?.area || ''} ${shop.location?.city || ''}`.toLowerCase().includes(debouncedSearch);
      });
  }, [allShops, debouncedSearch, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => (selectedCategory ? product.businessType === selectedCategory : true))
      .filter((product) => {
        if (!debouncedSearch) return true;
        return `${product.name || ''} ${product.businessType || ''} ${product.brand || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''} ${product.dairyBakeryType || ''}`
          .toLowerCase()
          .includes(debouncedSearch);
      });
  }, [allProducts, debouncedSearch, selectedCategory]);

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

  const hasSearch = Boolean(debouncedSearch);
  const noSearchResults = hasSearch && filteredShops.length === 0 && filteredProducts.length === 0;

  const headerComponent = useMemo(() => (
    <View style={{ gap: 14 }}>
      <CompactLocationHeader
        greeting="Hello, SkK!"
        addressText={location ? 'Current location selected' : 'nagri, Ranchi, 835303'}
        loading={locationLoading}
        onPressLocation={captureLocation}
      />
      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        onVoicePress={() => showToast({ type: 'info', message: 'Keyboard opened. Tap the keyboard mic and speak to search.' })}
      />

      <View style={{ gap: 10 }}>
        <SectionHeader title="Categories" action="See all" onAction={() => setSelectedCategory('')} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          {categories.map((category) => (
            <CategoryCard
              key={category}
              title={category}
              subtitle={category === 'Restaurant' ? 'Food' : category.includes('Grocery') ? 'Kirana' : 'Fresh'}
              active={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </View>

      {noSearchResults ? (
        <EmptyState title="No shops or products found" message="Try another shop, product, or category name." />
      ) : (
        <SectionHeader title="Nearby Shops" action="View all" onAction={() => setSelectedCategory('')} />
      )}
    </View>
  ), [captureLocation, debouncedSearch, filteredProducts.length, filteredShops.length, location, locationError, locationLoading, noSearchResults, search, selectedCategory, showToast]);

  const footerComponent = useMemo(() => {
    if (noSearchResults) return null;

    return (
      <View style={{ gap: 14 }}>
        <SectionHeader title={hasSearch ? 'Matching Products' : 'Bestsellers'} action="See all" />
        {filteredProducts.length === 0 ? (
          <EmptyState title="No products found" message="Try another category or search term." />
        ) : (
          <FlatList
            horizontal
            data={filteredProducts.slice(0, 12)}
            keyExtractor={(product) => product._id}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            renderItem={({ item: product }) => (
              <ProductCard
                product={product}
                onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                onAdd={() => addToCart(product)}
              />
            )}
          />
        )}
      </View>
    );
  }, [addToCart, filteredProducts, hasSearch, navigation, noSearchResults]);

  if (initialLoading) return <Loader />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={noSearchResults ? [] : filteredShops}
      keyExtractor={(shop) => shop._id}
      keyboardShouldPersistTaps="always"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={!noSearchResults ? <EmptyState title="No shops found" message="Try another category or run the quick setup seed." /> : null}
      ListFooterComponent={footerComponent}
      renderItem={({ item: shop }) => <ShopCard shop={shop} onPress={() => navigation.navigate('ShopDetails', { shopId: shop._id })} />}
    />
  );
}
