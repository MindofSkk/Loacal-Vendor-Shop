import { Alert, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, StatusBadge, styles } from '../components/ui';

export default function OrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;

  const cancelOrder = async () => {
    try {
      await orderApi.cancel(order._id, { reason: 'Customer cancelled before acceptance' });
      Alert.alert('Cancelled', 'Order cancelled.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Cancel failed', getApiError(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 10 }}>
        <View style={styles.between}>
          <Text style={styles.heading}>#{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.muted}>{order.shop?.name}</Text>
        <Text style={styles.price}>₹{order.subtotal}</Text>
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={styles.subheading}>Delivery</Text>
        <Text style={styles.muted}>{order.deliveryAddress?.fullAddress}</Text>
        <Text style={styles.muted}>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</Text>
        <Text style={styles.muted}>Phone: {order.deliveryAddress?.phone}</Text>
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={styles.subheading}>Items</Text>
        {order.items.map((item) => (
          <View key={`${item.product}-${item.name}`} style={styles.between}>
            <Text style={styles.muted}>{item.quantity} x {item.name}</Text>
            <Text style={styles.title}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
      </Card>
      {order.status === 'Pending' ? <Button title="Cancel order" variant="danger" onPress={cancelOrder} /> : null}
    </ScrollView>
  );
}
