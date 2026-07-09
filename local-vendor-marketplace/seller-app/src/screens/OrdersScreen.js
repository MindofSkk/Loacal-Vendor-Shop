import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { EmptyState, Loader, OrderRow, SearchBar, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';
import { useToast } from '../context/ToastContext';

const tabs = ['New', 'Accepted', 'Packed', 'Delivered', 'Cancelled', 'Rejected'];

export default function OrdersScreen({ navigation }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.sellerOrders();
      setOrders(data);
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
    const byTab = sorted.filter((order) => {
      if (activeTab === 'New') return order.status === 'Pending';
      if (activeTab === 'Packed') return ['Packed', 'Out for Delivery'].includes(order.status);
      return order.status === activeTab;
    });
    const query = search.trim().toLowerCase();
    if (!query) return byTab;
    return byTab.filter((order) => `${order._id || ''} ${order.customer?.name || ''} ${order.deliveryAddress?.phone || ''}`.toLowerCase().includes(query));
  }, [activeTab, search, sorted]);

  if (loading) return <Loader />;

  const header = (
    <View style={{ gap: 14 }}>
      <SectionHeader title="Orders" />
      <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="Search order/customer..." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              minWidth: 92,
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
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      data={filteredOrders}
      keyExtractor={(order) => order._id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState title="No orders" message="Orders for this status will appear here." />}
      renderItem={({ item: order }) => <OrderRow order={order} onPress={() => navigation.navigate('OrderDetails', { order })} />}
    />
  );
}
