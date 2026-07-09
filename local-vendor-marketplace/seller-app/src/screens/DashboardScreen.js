import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi, productApi, shopApi } from '../api/services';
import { Button, Card, Loader, StatusBadge, styles } from '../components/ui';

export default function DashboardScreen({ navigation }) {
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
      Alert.alert('Unable to load dashboard', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loader />;

  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today).length;
  const pending = orders.filter((order) => order.status === 'Pending').length;
  const completed = orders.filter((order) => order.status === 'Delivered').length;
  const revenue = orders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card style={{ gap: 10, backgroundColor: '#dcfce7' }}>
        <Text style={styles.heading}>{shop?.name || 'Create your shop'}</Text>
        <Text style={styles.muted}>{shop?.businessType || 'Add shop details to start selling.'}</Text>
        {shop ? <StatusBadge status={shop.status} /> : null}
        <Button title={shop ? 'Edit shop profile' : 'Create shop profile'} onPress={() => navigation.navigate('ShopProfile', { shop })} />
      </Card>
      <View style={styles.row}>
        <Card style={styles.flex}>
          <Text style={styles.label}>Today Orders</Text>
          <Text style={styles.heading}>{todayOrders}</Text>
        </Card>
        <Card style={styles.flex}>
          <Text style={styles.label}>Pending</Text>
          <Text style={styles.heading}>{pending}</Text>
        </Card>
      </View>
      <View style={styles.row}>
        <Card style={styles.flex}>
          <Text style={styles.label}>Completed</Text>
          <Text style={styles.heading}>{completed}</Text>
        </Card>
        <Card style={styles.flex}>
          <Text style={styles.label}>Revenue</Text>
          <Text style={styles.heading}>₹{revenue}</Text>
        </Card>
      </View>
      <Card>
        <Text style={styles.label}>Products</Text>
        <Text style={styles.heading}>{products.length}</Text>
      </Card>
      <Button title="Manage delivery boys" variant="secondary" onPress={() => navigation.navigate('DeliveryBoys', { shop })} />
      <Button title="View orders" variant="secondary" onPress={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} />
    </ScrollView>
  );
}
