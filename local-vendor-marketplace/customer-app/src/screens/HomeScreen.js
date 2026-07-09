import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, Card, EmptyState, Loader, ProductCard, ShopCard, styles } from '../components/ui';
import { categories, colors } from '../constants';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }) {
  const { addItem } = useCart();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const locationParams = location ? { latitude: location.latitude, longitude: location.longitude } : {};
      const [shopRes, productRes] = await Promise.all([
        shopApi.list({ category: '', ...locationParams }),
        productApi.list({})
      ]);
      const nextShops = selectedCategory ? shopRes.data.filter((shop) => shop.businessType === selectedCategory) : shopRes.data;
      const nextProducts = selectedCategory ? productRes.data.filter((product) => product.businessType === selectedCategory) : productRes.data;
      setShops(nextShops);
      setProducts(nextProducts);
    } catch (err) {
      Alert.alert('Unable to load', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [location, selectedCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location denied', 'You can still browse shops manually.');
      return;
    }
    const current = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
  };

  const addToCart = (product) => {
    try {
      addItem(product);
      Alert.alert('Added', 'Product added to cart.');
    } catch (err) {
      Alert.alert('Cart', err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card style={{ backgroundColor: '#ede9fe', gap: 12 }}>
        <Text style={styles.heading}>Order from nearby local shops</Text>
        <Text style={styles.muted}>Restaurant, Grocery / Kirana, Dairy and Bakery products delivered by local sellers.</Text>
        <Button title={location ? 'Location added' : 'Use my location'} variant={location ? 'secondary' : 'primary'} onPress={captureLocation} />
      </Card>

      <View style={{ gap: 10 }}>
        <Text style={styles.subheading}>Shop by category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Pressable onPress={() => setSelectedCategory('')} style={[categoryStyle.chip, !selectedCategory ? categoryStyle.activeChip : null]}>
            <Text style={[categoryStyle.chipText, !selectedCategory ? categoryStyle.activeChipText : null]}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[categoryStyle.chip, selectedCategory === category ? categoryStyle.activeChip : null]}>
              <Text style={[categoryStyle.chipText, selectedCategory === category ? categoryStyle.activeChipText : null]}>{category.replace(' Store', '')}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.subheading}>{selectedCategory || 'Nearby Shops'}</Text>
      {shops.length === 0 ? (
        <EmptyState title="No shops found" message="Try another category or run the quick setup seed." />
      ) : (
        shops.map((shop) => <ShopCard key={shop._id} shop={shop} onPress={() => navigation.navigate('ShopDetails', { shopId: shop._id })} />)
      )}

      <Text style={styles.subheading}>Fresh products</Text>
      {products.slice(0, 12).map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
          onAdd={() => addToCart(product)}
        />
      ))}
    </ScrollView>
  );
}

const categoryStyle = {
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border
  },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '900', color: colors.ink },
  activeChipText: { color: '#fff' }
};
