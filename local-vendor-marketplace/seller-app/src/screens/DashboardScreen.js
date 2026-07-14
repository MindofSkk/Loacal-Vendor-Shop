import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi, productApi, shopApi } from '../api/services';
import { Button, Card, EmptyState, MetricCard, OrderRow, SearchBar, SectionHeader, SkeletonCard, StatusBadge, styles } from '../components/ui';
import { colors } from '../constants';
import { useToast } from '../context/ToastContext';

export default function DashboardScreen({ navigation }) {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopRes, productRes, orderRes] = await Promise.all([
        shopApi.myShop().catch((err) => (err.response?.status === 404 ? { data: null } : Promise.reject(err))),
        productApi.sellerList(),
        orderApi.sellerOrders()
      ]);
      setShop(shopRes.data);
      setProducts(productRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today).length;
  const pending = orders.filter((order) => order.status === 'Pending').length;
  const preparing = orders.filter((order) => ['Accepted', 'Packed', 'Out for Delivery'].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === 'Delivered').length;
  const revenueToday = orders
    .filter((order) => order.status === 'Delivered' && new Date(order.createdAt).toDateString() === today)
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const revenue = orders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const query = search.trim().toLowerCase();
  const recentOrders = [...orders]
    .filter((order) => !query || `${order._id || ''} ${order.customer?.name || ''} ${order.status || ''}`.toLowerCase().includes(query))
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 4);
  const matchingProducts = products
    .filter((product) => !query || `${product.name || ''} ${product.brand || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''}`.toLowerCase().includes(query))
    .slice(0, 3);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {loading ? (
        <>
          <SkeletonCard />
          <View style={styles.row}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <SkeletonCard />
        </>
      ) : null}
      {!loading ? (
        <>
      <Card style={dashboardStyles.shopHeader}>
        <View style={styles.between}>
          <View style={dashboardStyles.logoWrap}>
            <Ionicons name="storefront" size={28} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.small}>Dashboard</Text>
            <Text style={dashboardStyles.shopName} numberOfLines={1}>{shop?.name || 'Create your shop'}</Text>
            <Text style={styles.muted}>{shop?.businessType || 'Add shop details to start selling.'}</Text>
          </View>
          {shop ? <StatusBadge status={shop.status} /> : null}
        </View>
        {!shop ? <Button title="Create Shop Profile" onPress={() => navigation.navigate('ShopProfile', { shop })} /> : null}
      </Card>

      <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="Search orders, products..." />

      <View style={styles.row}>
        <MetricCard label="Today orders" value={todayOrders} icon="bag-check-outline" trend="+12%" />
        <MetricCard label="Pending" value={pending} tone="orange" icon="time-outline" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Preparing" value={preparing} tone="orange" icon="restaurant-outline" />
        <MetricCard label="Completed" value={completed} tone="blue" icon="checkmark-done-outline" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Revenue today" value={`Rs.${revenueToday}`} tone="purple" icon="cash-outline" />
        <MetricCard label="This month" value={`Rs.${revenue}`} tone="purple" icon="trending-up-outline" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Avg rating" value="4.5" tone="blue" icon="star-outline" />
        <MetricCard label="Products" value={products.length} icon="cube-outline" />
      </View>

      <Card style={{ gap: 12 }}>
        <SectionHeader title="Quick actions" />
        <View style={styles.row}>
          <Button title="Add Product" disabled={!shop} onPress={() => navigation.getParent()?.navigate('Products', { screen: 'ProductForm', params: { shop } })} style={styles.flex} />
          <Button title="Orders" variant="secondary" onPress={() => navigation.getParent()?.navigate('Orders', { screen: 'OrdersMain' })} style={styles.flex} />
        </View>
        <Button title="Business Settings" variant="secondary" onPress={() => navigation.getParent()?.navigate('Settings', { screen: 'SettingsMain' })} />
      </Card>

      {query ? (
        <Card style={{ gap: 10 }}>
          <SectionHeader title="Matching products" />
          {matchingProducts.length ? matchingProducts.map((product) => (
            <View key={product._id} style={dashboardStyles.productMiniRow}>
              <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.price}>Rs.{product.price}</Text>
            </View>
          )) : <Text style={styles.muted}>No matching products.</Text>}
        </Card>
      ) : null}

      <SectionHeader title="Recent orders" action="View all" onAction={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} />
      {recentOrders.length === 0 ? <EmptyState title="No orders yet" message="New customer orders will appear here." /> : null}
      {recentOrders.map((order) => (
        <OrderRow key={order._id} order={order} onPress={() => navigation.getParent()?.navigate('Orders', { screen: 'OrderDetails', params: { order } })} />
      ))}

      <Button title="Manage delivery boys" variant="secondary" onPress={() => navigation.navigate('DeliveryBoys', { shop })} />
        </>
      ) : null}
    </ScrollView>
  );
}

const dashboardStyles = StyleSheet.create({
  shopHeader: { gap: 12, backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  logoWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shopName: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '600' },
  productMiniRow: { minHeight: 38, borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
});
