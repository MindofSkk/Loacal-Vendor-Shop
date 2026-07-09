import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi, productApi, shopApi } from '../api/services';
import { Button, Card, EmptyState, MetricCard, OrderRow, SectionHeader, SkeletonCard, StatusBadge, styles } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function DashboardScreen({ navigation }) {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const completed = orders.filter((order) => order.status === 'Delivered').length;
  const revenue = orders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const recentOrders = [...orders].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)).slice(0, 4);

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
      <Card style={[styles.hero, { gap: 12 }]}>
        <View style={styles.between}>
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="storefront" size={30} color="#049B4F" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.small}>Dashboard</Text>
            <Text style={styles.heading}>{shop?.name || 'Create your shop'}</Text>
            <Text style={styles.muted}>{shop?.businessType || 'Add shop details to start selling.'}</Text>
          </View>
          {shop ? <StatusBadge status={shop.status} /> : null}
        </View>
        <Button title={shop ? 'View Shop / Edit Profile' : 'Create Shop Profile'} onPress={() => navigation.navigate('ShopProfile', { shop })} />
      </Card>

      <View style={styles.row}>
        <MetricCard label="Today orders" value={todayOrders} icon="bag-check-outline" />
        <MetricCard label="Pending" value={pending} tone="orange" icon="time-outline" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Completed" value={completed} tone="blue" icon="checkmark-done-outline" />
        <MetricCard label="Revenue" value={`Rs.${revenue}`} tone="purple" icon="cash-outline" />
      </View>

      <Card style={{ gap: 12 }}>
        <SectionHeader title="Quick actions" />
        <View style={styles.row}>
          <Button title="Add Product" disabled={!shop} onPress={() => navigation.getParent()?.navigate('Products', { screen: 'ProductForm', params: { shop } })} style={styles.flex} />
          <Button title="Orders" variant="secondary" onPress={() => navigation.getParent()?.navigate('Orders', { screen: 'OrdersMain' })} style={styles.flex} />
        </View>
        <Button title="Business Settings" variant="secondary" onPress={() => navigation.getParent()?.navigate('Settings', { screen: 'SettingsMain' })} />
      </Card>

      <Card>
        <Text style={styles.label}>Products listed</Text>
        <Text style={styles.heading}>{products.length}</Text>
      </Card>

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
