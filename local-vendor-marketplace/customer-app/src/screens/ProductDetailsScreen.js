import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { AvailabilityIcon, Button, Card, FixedFooter, Loader, ProductTraitBadge, styles } from '../components/ui';
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
      .catch((err) => showToast({ type: 'error', message: getApiError(err) }))
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
  const unavailable = product?.status === 'inactive';

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        {image ? (
          <Image source={{ uri: image }} style={{ height: 260, borderRadius: 22, backgroundColor: '#ede9fe' }} />
        ) : (
          <View style={{ height: 220, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cube-outline" size={58} color="#5B2EEB" />
          </View>
        )}
        <Card style={{ gap: 12 }}>
          <View style={styles.between}>
            <Text style={[styles.heading, { flex: 1 }]}>{product?.name}</Text>
            <AvailabilityIcon unavailable={unavailable} />
          </View>
          <Text style={styles.muted}>{product?.shop?.name || 'Local shop'}</Text>
          <Text style={[styles.price, { fontSize: 28 }]}>Rs.{product?.price}</Text>
          <Text style={styles.muted}>{product?.description || 'Fresh from a nearby shop.'}</Text>
          <View style={styles.metaPills}>
            <ProductTraitBadge product={product} />
            {product?.brand ? <Text style={styles.pill}>{product.brand}</Text> : null}
            {product?.foodCategory ? <Text style={styles.pill}>{product.foodCategory}</Text> : null}
            {product?.groceryCategory ? <Text style={styles.pill}>{product.groceryCategory}</Text> : null}
            {product?.packSize ? <Text style={styles.pill}>{product.packSize}</Text> : null}
          </View>
        </Card>
      </ScrollView>
      <FixedFooter>
        <Button title={unavailable ? 'Unavailable' : 'Add to cart'} onPress={addToCart} disabled={unavailable} />
      </FixedFooter>
    </View>
  );
}
