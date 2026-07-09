import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, Card, EmptyState, Loader, ProductCard, SectionHeader, StatusBadge, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { addItem, items, subtotal } = useCart();
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
      <Card style={[styles.hero, { gap: 12 }]}>
        <View style={styles.row}>
          <View style={styles.shopThumb}>
            {shop?.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Text style={styles.thumbText}>{shop?.name?.slice(0, 1) || 'S'}</Text>}
          </View>
          <View style={styles.flex}>
            <Text style={styles.heading}>{shop?.name}</Text>
            <Text style={styles.muted}>{shop?.businessType}</Text>
          </View>
        </View>
        <StatusBadge status={shop?.openStatus?.isOpenNow ? 'Open Now' : 'Closed'} />
        <Text style={styles.muted}>{shop?.description || 'Local shop'}</Text>
        <Text style={styles.small}>
          Min Rs.{shop?.deliverySettings?.minimumOrder || 0} | Delivery Rs.{shop?.deliverySettings?.deliveryCharge || 0} | ETA {shop?.deliverySettings?.estimatedDeliveryTime || '30 Minutes'}
        </Text>
        {shop?.temporaryClosure?.enabled ? <Text style={{ color: '#b45309', fontWeight: '900' }}>This shop is temporarily closed.</Text> : null}
      </Card>

      <SectionHeader title="Products" />
      {products.length === 0 ? <EmptyState title="No products" message="This shop has not added products yet." /> : null}
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
          onAdd={() => addToCart(product)}
        />
      ))}
      {items.length > 0 ? (
        <Button title={`${items.length} items | Rs.${subtotal} - View cart`} onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })} />
      ) : null}
    </ScrollView>
  );
}
