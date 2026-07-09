import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, OptionRow, StatusBadge, styles } from '../components/ui';
import { colors, orderStatuses } from '../constants';

const buildWhatsAppMessage = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items.map((item) => `${item.quantity} x ${item.name}`).join('\n');

  return `New Delivery Order

Order ID: #${order._id.slice(-6)}

Customer: ${order.customer?.name || 'Customer'}
Phone: ${address.phone || order.customer?.phone || ''}

Address:
${address.fullAddress || ''}
Landmark: ${address.landmark || 'N/A'}

Google Maps:
${address.mapUrl || 'Not shared'}

Items:
${items}

Total: ₹${order.subtotal}

Please deliver as soon as possible.`;
};

export default function OrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;
  const [selectedPhone, setSelectedPhone] = useState('');

  const updateStatus = async (status) => {
    try {
      await orderApi.updateSellerStatus(order._id, { status, note: `Seller marked ${status}` });
      Alert.alert('Updated', `Order marked ${status}.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Update failed', getApiError(err));
    }
  };

  const openMaps = () => {
    if (!order.deliveryAddress?.mapUrl) {
      Alert.alert('No map location', 'Customer did not share GPS location.');
      return;
    }
    Linking.openURL(order.deliveryAddress.mapUrl);
  };

  const shareWhatsApp = () => {
    const cleanPhone = selectedPhone.replace(/\D/g, '');
    const target = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}` : 'https://wa.me/';
    Linking.openURL(`${target}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 10 }}>
        <View style={styles.between}>
          <Text style={styles.heading}>#{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.title}>{order.customer?.name}</Text>
        <Text style={styles.muted}>Phone: {order.deliveryAddress?.phone || order.customer?.phone}</Text>
        <Text style={styles.price}>₹{order.subtotal}</Text>
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={styles.subheading}>Delivery address</Text>
        <Text style={styles.muted}>{order.deliveryAddress?.fullAddress}</Text>
        <Text style={styles.muted}>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</Text>
        <Button title="Open in Google Maps" variant="secondary" onPress={openMaps} />
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
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Update status</Text>
        <OptionRow options={orderStatuses} value={order.status} onChange={updateStatus} />
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Share delivery</Text>
        {order.shop?.deliveryBoys?.length ? (
          <View style={{ gap: 8 }}>
            {order.shop.deliveryBoys.map((contact) => (
              <Pressable
                key={`${contact.name}-${contact.phone}`}
                onPress={() => setSelectedPhone(contact.phone)}
                style={{
                  borderWidth: 1,
                  borderColor: selectedPhone === contact.phone ? colors.primary : colors.border,
                  backgroundColor: selectedPhone === contact.phone ? '#dcfce7' : '#fff',
                  borderRadius: 14,
                  padding: 12
                }}
              >
                <Text style={styles.title}>{contact.name}</Text>
                <Text style={styles.muted}>{contact.phone}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No delivery boy selected. Generic WhatsApp share will open.</Text>
        )}
        <Button title={selectedPhone ? 'Share to selected delivery boy' : 'Share with Delivery Boy'} onPress={shareWhatsApp} />
      </Card>
    </ScrollView>
  );
}
