import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, Loader, PriceRow, StatusBadge, styles } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function OrderDetailsScreen({ route, navigation }) {
  const { showToast } = useToast();
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refreshOrder = async () => {
      try {
        const { data } = await orderApi.myOrders();
        const freshOrder = data.find((item) => item._id === route.params.order._id);
        if (freshOrder) setOrder(freshOrder);
      } catch {
        // Keep route data if refresh fails.
      }
    };
    refreshOrder();
  }, [route.params.order._id]);

  const cancelOrder = async () => {
    Alert.alert('Cancel order?', 'This order will be cancelled before seller acceptance.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await orderApi.cancel(order._id, { reason: 'Customer cancelled before acceptance' });
            showToast({ type: 'success', message: 'Order cancelled.' });
            navigation.goBack();
          } catch (err) {
            showToast({ type: 'error', message: getApiError(err) });
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  if (!order) return <Loader />;
  const total = order.totalAmount ?? order.subtotal ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={[styles.hero, { gap: 10 }]}>
        <View style={styles.between}>
          <Text style={styles.heading}>#{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.muted}>{order.shop?.name}</Text>
        <Text style={styles.price}>Rs.{total}</Text>
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Delivery Address</Text>
        <Text style={styles.muted}>{order.deliveryAddress?.fullAddress}</Text>
        <Text style={styles.muted}>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</Text>
        <Text style={styles.muted}>Phone: {order.deliveryAddress?.phone}</Text>
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Payment</Text>
        <View style={styles.between}>
          <Text style={styles.muted}>Payment Method</Text>
          <Text style={styles.title}>{order.paymentMethod === 'UPI' ? 'UPI' : 'Cash on Delivery'}</Text>
        </View>
        <View style={styles.between}>
          <Text style={styles.muted}>Payment Status</Text>
          <Text style={styles.title}>{order.paymentStatus === 'NOT_REQUIRED' || !order.paymentStatus ? 'Not Required' : order.paymentStatus}</Text>
        </View>
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Order Summary</Text>
        {order.items.map((item) => (
          <View key={`${item.product}-${item.name}`} style={styles.between}>
            <Text style={styles.muted}>{item.quantity} x {item.name}</Text>
            <Text style={styles.title}>Rs.{item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
        <PriceRow label="Total" value={total} strong />
      </Card>
      {order.status === 'Pending' ? <Button title="Cancel order" variant="outlineDanger" loading={loading} onPress={cancelOrder} /> : null}
    </ScrollView>
  );
}
