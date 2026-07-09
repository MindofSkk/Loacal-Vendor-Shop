import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderRow, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';

const tabs = ['New', 'Accepted', 'Preparing', 'Completed'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
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

  const sorted = useMemo(
    () =>
      [...orders].sort((first, second) => {
        if (first.status === 'Pending' && second.status !== 'Pending') return -1;
        if (first.status !== 'Pending' && second.status === 'Pending') return 1;
        return new Date(second.createdAt) - new Date(first.createdAt);
      }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === 'New') return sorted.filter((order) => order.status === 'Pending');
    if (activeTab === 'Accepted') return sorted.filter((order) => order.status === 'Accepted');
    if (activeTab === 'Preparing') return sorted.filter((order) => ['Packed', 'Out for Delivery'].includes(order.status));
    return sorted.filter((order) => order.status === 'Delivered');
  }, [activeTab, sorted]);

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <SectionHeader title="Orders" />
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
            <Text style={{ color: activeTab === tab ? '#fff' : colors.ink, fontWeight: '900', fontSize: 11 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      {filteredOrders.length === 0 ? <EmptyState title="No orders" message="Orders for this status will appear here." /> : null}
      {filteredOrders.map((order) => (
        <OrderRow key={order._id} order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />
      ))}
    </ScrollView>
  );
}
