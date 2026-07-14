import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderCard, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useToast } from '../context/ToastContext';

const tabs = ['All', 'Ongoing', 'Delivered', 'Cancelled'];

export default function OrdersScreen({ navigation }) {
  const { showToast } = useToast();
  const { latestOrder, refreshActiveOrder } = useActiveOrder();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await orderApi.myOrders();
      setOrders(data);
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshActiveOrder({ silent: true, notify: true });
    }, [load, refreshActiveOrder])
  );

  useEffect(() => {
    if (!latestOrder?._id) return;
    setOrders((current) => {
      const exists = current.some((order) => order._id === latestOrder._id);
      if (exists) {
        return current.map((order) => (order._id === latestOrder._id ? { ...order, ...latestOrder } : order));
      }
      return [latestOrder, ...current];
    });
  }, [latestOrder]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'All') return orders;
    if (activeTab === 'Ongoing') return orders.filter((order) => !['Delivered', 'Cancelled', 'Rejected'].includes(order.status));
    if (activeTab === 'Delivered') return orders.filter((order) => order.status === 'Delivered');
    return orders.filter((order) => ['Cancelled', 'Rejected'].includes(order.status));
  }, [activeTab, orders]);

  if (loading) return <Loader />;

  const header = (
    <View style={{ gap: 14 }}>
      <SectionHeader title="My Orders" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeTab === tab ? colors.primary : '#fff',
              borderWidth: 1,
              borderColor: activeTab === tab ? colors.primary : colors.border
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : colors.ink, fontWeight: '600', fontSize: 12 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={filteredOrders}
      keyExtractor={(order) => order._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState title="No orders" message="Orders for this status will show here." />}
      renderItem={({ item: order }) => <OrderCard order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />}
    />
  );
}
