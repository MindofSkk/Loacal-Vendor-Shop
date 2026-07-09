import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

Total: Rs.${order.subtotal}

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
      Alert.alert('No map location', 'Customer did not share current location.');
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
      <Card style={[styles.hero, { gap: 10 }]}>
        <View style={styles.between}>
          <Text style={styles.heading}>#{order._id.slice(-6)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.title}>{order.customer?.name}</Text>
        <Text style={styles.muted}>Phone: {order.deliveryAddress?.phone || order.customer?.phone}</Text>
        <Text style={styles.price}>Rs.{order.subtotal}</Text>
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Delivery address</Text>
        <Text style={styles.muted}>{order.deliveryAddress?.fullAddress}</Text>
        <Text style={styles.muted}>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</Text>
        <View style={styles.row}>
          <Pressable onPress={openMaps} style={[styles.button, styles.secondaryButton, styles.flex, { flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Open Maps</Text>
          </Pressable>
          <Pressable onPress={shareWhatsApp} style={[styles.button, styles.flex, { flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.buttonText}>Share</Text>
          </Pressable>
        </View>
      </Card>
      <Card style={{ gap: 8 }}>
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
      <Card style={{ gap: 8 }}>
        <Text style={styles.subheading}>Items</Text>
        {order.items.map((item) => (
          <View key={`${item.product}-${item.name}`} style={styles.between}>
            <Text style={styles.muted}>{item.quantity} x {item.name}</Text>
            <Text style={styles.title}>Rs.{item.price * item.quantity}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Update status</Text>
        <OptionRow options={orderStatuses} value={order.status} onChange={updateStatus} />
      </Card>
      <Card style={{ gap: 10 }}>
        <Text style={styles.subheading}>Delivery boy</Text>
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
                  borderRadius: 16,
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
        <Pressable onPress={shareWhatsApp} style={[styles.button, { flexDirection: 'row', gap: 8 }]}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.buttonText}>{selectedPhone ? 'Share to selected delivery boy' : 'Share with Delivery Boy'}</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}
