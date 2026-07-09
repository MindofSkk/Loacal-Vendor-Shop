import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Card, CartPreviewBar, EmptyState, Loader, ProductListCard, SectionHeader, StatusBadge, styles } from '../components/ui';
import { colors } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { addItem, items, subtotal, updateQuantity } = useCart();
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const canOrder = Boolean(shop?.openStatus?.isOpenNow && !shop?.temporaryClosure?.enabled);
  const productCategories = useMemo(() => {
    const values = products
      .map((product) => product.foodCategory || product.groceryCategory || product.dairyBakeryType || product.businessType)
      .filter(Boolean);
    return ['All', ...Array.from(new Set(values))];
  }, [products]);
  const visibleProducts = activeCategory === 'All'
    ? products
    : products.filter((product) => [product.foodCategory, product.groceryCategory, product.dairyBakeryType, product.businessType].includes(activeCategory));
  const cartQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, productRes] = await Promise.all([shopApi.get(shopId), productApi.list({ shop: shopId })]);
        setShop(shopRes.data);
        setProducts(productRes.data);
      } catch (err) {
        showToast({ type: 'error', message: getApiError(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const addToCart = (product) => {
    if (!canOrder) {
      showToast({ type: 'warning', message: 'This shop is closed for orders.' });
      return;
    }
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

  const renderHeader = () => (
    <View style={{ gap: 14 }}>
        <Card style={[styles.hero, { gap: 12 }]}>
          <View style={{ height: 150, borderRadius: 16, backgroundColor: '#ede9fe', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {shop?.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Ionicons name="storefront-outline" size={42} color={colors.primary} />}
          </View>
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text style={styles.heading}>{shop?.name}</Text>
              <Text style={styles.muted}>{shop?.businessType}</Text>
            </View>
            <StatusBadge status={canOrder ? 'Open Now' : 'Closed'} />
          </View>
          <Text style={styles.muted}>{shop?.description || 'Local shop'}</Text>
          <View style={styles.metaPills}>
            <Text style={styles.pill}>ETA {shop?.deliverySettings?.estimatedDeliveryTime || '30 Minutes'}</Text>
            <Text style={styles.pill}>Delivery Rs.{shop?.deliverySettings?.deliveryCharge || 0}</Text>
            <Text style={styles.pill}>Min Rs.{shop?.deliverySettings?.minimumOrder || 0}</Text>
          </View>
          {!canOrder ? (
            <Text style={{ color: colors.warning, fontWeight: '900' }}>
              {shop?.temporaryClosure?.enabled ? 'This shop is temporarily closed.' : 'This shop is closed right now.'}
            </Text>
          ) : null}
        </Card>

        <SectionHeader title="Products" />
        {productCategories.length > 1 ? (
          <FlatList
            horizontal
            data={productCategories}
            keyExtractor={(category) => category}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            renderItem={({ item: category }) => (
              <Pressable
                onPress={() => setActiveCategory(category)}
                style={{
                  minHeight: 38,
                  maxWidth: 170,
                  paddingHorizontal: 13,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeCategory === category ? colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: activeCategory === category ? colors.primary : colors.border
                }}
              >
                <Text numberOfLines={1} style={{ color: activeCategory === category ? '#fff' : colors.ink, fontWeight: '900', fontSize: 12 }}>{category}</Text>
              </Pressable>
            )}
          />
        ) : null}
      </View>
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.screenHeader}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Shop Details</Text>
      </View>

      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: items.length > 0 ? 190 : 116 }]}
        data={visibleProducts}
        keyExtractor={(product) => product._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title="No products" message="This shop has not added products for this category yet." />}
        renderItem={({ item: product }) => {
          const cartItem = items.find((item) => item._id === product._id);
          return (
            <ProductListCard
              product={product}
              disabled={!canOrder}
              quantity={cartItem?.quantity || 0}
              onMinus={() => updateQuantity(product._id, (cartItem?.quantity || 0) - 1)}
              onPlus={() => updateQuantity(product._id, (cartItem?.quantity || 0) + 1)}
              onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
              onAdd={() => addToCart(product)}
            />
          );
        }}
      />
      {items.length > 0 ? (
        <CartPreviewBar
          items={items}
          quantity={cartQuantity}
          subtotal={subtotal}
          onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })}
        />
      ) : null}
    </SafeAreaView>
  );
}
