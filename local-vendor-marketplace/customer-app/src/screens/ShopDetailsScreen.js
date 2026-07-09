import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, Card, Loader, ProductCard, StatusBadge, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { addItem } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, productRes] = await Promise.all([shopApi.get(shopId), productApi.list({ shop: shopId })]);
        setShop(shopRes.data);
        setProducts(productRes.data);
      } catch (err) {
        Alert.alert('Unable to load shop', getApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 8 }}>
        <Text style={styles.heading}>{shop?.name}</Text>
        <Text style={styles.muted}>{shop?.businessType}</Text>
        <StatusBadge status={shop?.openStatus?.isOpenNow ? 'Open Now' : 'Closed'} />
        <Text style={styles.muted}>{shop?.description || 'Local shop'}</Text>
        <Text style={styles.small}>
          Min ₹{shop?.deliverySettings?.minimumOrder || 0} | Delivery ₹{shop?.deliverySettings?.deliveryCharge || 0} | ETA {shop?.deliverySettings?.estimatedDeliveryTime || '30 Minutes'}
        </Text>
        {shop?.temporaryClosure?.enabled ? <Text style={{ color: '#b45309', fontWeight: '900' }}>This shop is temporarily closed.</Text> : null}
      </Card>

      <Text style={styles.subheading}>Products</Text>
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
          onAdd={() => addToCart(product)}
        />
      ))}
      <Button title="Go to cart" onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })} />
    </ScrollView>
  );
}
