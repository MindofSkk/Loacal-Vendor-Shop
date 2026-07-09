import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderRow, styles } from '../components/ui';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.sellerOrders();
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

  const sorted = [...orders].sort((first, second) => {
    if (first.status === 'Pending' && second.status !== 'Pending') return -1;
    if (first.status !== 'Pending' && second.status === 'Pending') return 1;
    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.heading}>Orders</Text>
      {sorted.length === 0 ? <EmptyState title="No orders yet" message="New customer orders will appear here." /> : null}
      {sorted.map((order) => (
        <OrderRow key={order._id} order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />
      ))}
    </ScrollView>
  );
}
