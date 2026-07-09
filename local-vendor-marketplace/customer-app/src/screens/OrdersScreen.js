import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderCard, styles } from '../components/ui';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.myOrders();
      setOrders(data);
    } catch (err) {
      Alert.alert('Unable to load orders', getApiError(err));
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.heading}>My Orders</Text>
      {orders.length === 0 ? <EmptyState title="No orders yet" message="Your placed orders will show here." /> : null}
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />
      ))}
    </ScrollView>
  );
}
