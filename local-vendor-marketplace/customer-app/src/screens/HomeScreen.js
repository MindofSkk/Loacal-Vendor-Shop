import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { CategoryCard, CompactLocationHeader, EmptyState, Loader, ProductCard, SearchBar, SectionHeader, ShopCard, styles } from '../components/ui';
import { categories } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function HomeScreen({ navigation }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const locationParams = location ? { latitude: location.latitude, longitude: location.longitude } : {};
      const [shopRes, productRes] = await Promise.all([
        shopApi.list({ category: '', ...locationParams }),
        productApi.list({})
      ]);
      const query = search.trim().toLowerCase();
      const nextShops = shopRes.data
        .filter((shop) => (selectedCategory ? shop.businessType === selectedCategory : true))
        .filter((shop) => (query ? `${shop.name} ${shop.businessType} ${shop.location?.area || ''}`.toLowerCase().includes(query) : true));
      const nextProducts = productRes.data
        .filter((product) => (selectedCategory ? product.businessType === selectedCategory : true))
        .filter((product) => (query ? `${product.name} ${product.brand || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''}`.toLowerCase().includes(query) : true));
      setShops(nextShops);
      setProducts(nextProducts);
    } catch (err) {
      Alert.alert('Unable to load', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [location, selectedCategory, search]);

  useEffect(() => {
    load();
  }, [load]);

  const captureLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Unable to fetch location. Please enter manually.';
        setLocationError(message);
        Alert.alert('Location denied', message);
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      Alert.alert('Location added', 'Location added');
    } catch (_err) {
      const message = 'Unable to fetch location. Please enter manually.';
      setLocationError(message);
      Alert.alert('Location error', message);
    } finally {
      setLocationLoading(false);
    }
  };

  const addToCart = (product) => {
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
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <CompactLocationHeader
        greeting="Hello, SkK!"
        addressText={location ? 'Current location selected' : 'nagri, Ranchi, 835303'}
        loading={locationLoading}
        onPressLocation={captureLocation}
      />
      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

      <SearchBar value={search} onChangeText={setSearch} />

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

      <SectionHeader title="Nearby Shops" action="View all" onAction={() => setSelectedCategory('')} />
      {shops.length === 0 ? (
        <EmptyState title="No shops found" message="Try another category or run the quick setup seed." />
      ) : (
        shops.map((shop) => <ShopCard key={shop._id} shop={shop} onPress={() => navigation.navigate('ShopDetails', { shopId: shop._id })} />)
      )}

      <SectionHeader title="Bestsellers" action="See all" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
        {products.slice(0, 12).map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
            onAdd={() => addToCart(product)}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
