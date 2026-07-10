import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { AvailabilityIcon, Button, Card, Loader, ProductTraitBadge, styles } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProductImages, getProductThumbnail } from '../utils/productImages';

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const imageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    productApi
      .get(productId)
      .then(({ data }) => {
        setProduct(data);
        setSelectedImageIndex(Math.min(Number(data.thumbnailIndex || 0), 2));
      })
      .catch((err) => showToast({ type: 'error', message: getApiError(err) }))
      .finally(() => setLoading(false));
  }, [productId]);

  const selectImage = (index) => {
    if (index === selectedImageIndex) return;

    Animated.timing(imageOpacity, {
      toValue: 0.35,
      duration: 110,
      useNativeDriver: true
    }).start(() => {
      setSelectedImageIndex(index);
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true
      }).start();
    });
  };

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

  const galleryImages = getProductImages(product);
  const image = galleryImages[selectedImageIndex] || getProductThumbnail(product);
  const unavailable = product?.status === 'inactive';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 28 }]}>
        {image ? (
          <Animated.Image source={{ uri: image }} style={{ height: 260, borderRadius: 22, backgroundColor: '#ede9fe', opacity: imageOpacity }} />
        ) : (
          <View style={{ height: 220, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cube-outline" size={58} color="#5B2EEB" />
          </View>
        )}
        {galleryImages.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {galleryImages.slice(0, 3).map((url, index) => (
              <Pressable
                key={url}
                onPress={() => selectImage(index)}
                style={{
                  borderWidth: 2,
                  borderColor: selectedImageIndex === index ? '#5B2EEB' : '#E5E7EB',
                  borderRadius: 18,
                  padding: 2
                }}
              >
                <Image source={{ uri: url }} style={{ width: 68, height: 68, borderRadius: 14, backgroundColor: '#ede9fe' }} />
              </Pressable>
            ))}
          </View>
        ) : null}
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
        <Card>
          <Button title={unavailable ? 'Unavailable' : 'Add to cart'} onPress={addToCart} disabled={unavailable} />
        </Card>
    </ScrollView>
  );
}
