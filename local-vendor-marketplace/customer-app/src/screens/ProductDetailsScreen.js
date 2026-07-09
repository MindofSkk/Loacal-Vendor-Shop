import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { Button, Card, Loader, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function ProductDetailsScreen({ route }) {
  const { productId } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .get(productId)
      .then(({ data }) => setProduct(data))
      .catch((err) => Alert.alert('Unable to load product', getApiError(err)))
      .finally(() => setLoading(false));
  }, [productId]);

  const addToCart = () => {
    try {
      addItem(product);
      Alert.alert('Added', 'Product added to cart.');
    } catch (err) {
      Alert.alert('Cart', err.message);
    }
  };

  if (loading) return <Loader />;

  const image = product?.images?.[0]?.url;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {image ? <Image source={{ uri: image }} style={{ height: 240, borderRadius: 18 }} /> : <View style={{ height: 180 }} />}
      <Card style={{ gap: 8 }}>
        <Text style={styles.heading}>{product?.name}</Text>
        <Text style={styles.muted}>{product?.shop?.name}</Text>
        <Text style={styles.price}>₹{product?.price}</Text>
        <Text style={styles.muted}>{product?.description || 'Fresh from a nearby shop.'}</Text>
        <Button title="Add to cart" onPress={addToCart} />
      </Card>
    </ScrollView>
  );
}
