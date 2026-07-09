import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderCard, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';

const tabs = ['All', 'Ongoing', 'Delivered', 'Cancelled'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
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

  const filteredOrders = useMemo(() => {
    if (activeTab === 'All') return orders;
    if (activeTab === 'Ongoing') return orders.filter((order) => !['Delivered', 'Cancelled', 'Rejected'].includes(order.status));
    if (activeTab === 'Delivered') return orders.filter((order) => order.status === 'Delivered');
    return orders.filter((order) => ['Cancelled', 'Rejected'].includes(order.status));
  }, [activeTab, orders]);

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
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
            <Text style={{ color: activeTab === tab ? '#fff' : colors.ink, fontWeight: '900', fontSize: 12 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      {filteredOrders.length === 0 ? <EmptyState title="No orders" message="Orders for this status will show here." /> : null}
      {filteredOrders.map((order) => (
        <OrderCard key={order._id} order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />
      ))}
    </ScrollView>
  );
}
