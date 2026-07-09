import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, Card, EmptyState, FixedFooter, Loader, ProductListCard, SectionHeader, StatusBadge, styles } from '../components/ui';
import { colors } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { addItem, items, subtotal } = useCart();
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

  if (loading) return <Loader />;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: items.length > 0 ? 112 : 96 }]}>
        <Card style={[styles.hero, { gap: 12 }]}>
          <View style={{ height: 150, borderRadius: 16, backgroundColor: '#ede9fe', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {shop?.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Text style={styles.thumbText}>{shop?.name?.slice(0, 1) || 'S'}</Text>}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {productCategories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={{
                  minHeight: 38,
                  paddingHorizontal: 13,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeCategory === category ? colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: activeCategory === category ? colors.primary : colors.border
                }}
              >
                <Text style={{ color: activeCategory === category ? '#fff' : colors.ink, fontWeight: '900', fontSize: 12 }}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {visibleProducts.length === 0 ? <EmptyState title="No products" message="This shop has not added products for this category yet." /> : null}
        {visibleProducts.map((product) => (
          <ProductListCard
            key={product._id}
            product={product}
            disabled={!canOrder}
            onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
            onAdd={() => addToCart(product)}
          />
        ))}
      </ScrollView>
      {items.length > 0 ? (
        <FixedFooter>
          <Button title={`${cartQuantity} items | Rs.${subtotal} - View cart`} onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })} />
        </FixedFooter>
      ) : null}
    </View>
  );
}
