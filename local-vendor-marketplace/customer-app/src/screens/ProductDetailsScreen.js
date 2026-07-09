import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { Button, Card, Loader, StatusBadge, styles } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const { addItem } = useCart();
  const { showToast } = useToast();
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

  const image = product?.images?.[0]?.url;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {image ? (
        <Image source={{ uri: image }} style={{ height: 240, borderRadius: 22 }} />
      ) : (
        <View style={{ height: 180, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.thumbText}>{product?.name?.slice(0, 1) || 'P'}</Text>
        </View>
      )}
      <Card style={{ gap: 10 }}>
        <View style={styles.between}>
          <Text style={styles.heading}>{product?.name}</Text>
          <StatusBadge status={product?.status === 'inactive' ? 'Out' : 'Available'} />
        </View>
        <Text style={styles.muted}>{product?.shop?.name}</Text>
        <Text style={styles.price}>Rs.{product?.price}</Text>
        <Text style={styles.muted}>{product?.description || 'Fresh from a nearby shop.'}</Text>
        <Button title="Add to cart" onPress={addToCart} disabled={product?.status === 'inactive'} />
      </Card>
    </ScrollView>
  );
}
