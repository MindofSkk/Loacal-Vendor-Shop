import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, InfoRow, OptionRow, StatusBadge, styles } from '../components/ui';
import { colors, orderStatuses } from '../constants';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [order, setOrder] = useState(route.params.order);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now';
  const customerPhone = order.deliveryAddress?.phone || order.customer?.phone || 'N/A';
  const deliveryAddress = order.deliveryAddress?.fullAddress || 'Address not available';
  const timeline = ['Pending', 'Accepted', 'Packed', 'Out for Delivery', 'Delivered'];
  const activeIndex = Math.max(0, timeline.indexOf(order.status));

  const updateStatus = async (status) => {
    if (statusLoading) return;
    if (status === order.status) return;
    setStatusLoading(true);
    try {
      await orderApi.updateSellerStatus(order._id, { status, note: `Seller marked ${status}` });
      setOrder({ ...order, status });
      showToast({ type: 'success', message: `Order marked ${status}.` });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setStatusLoading(false);
    }
  };

  const openMaps = () => {
    if (!order.deliveryAddress?.mapUrl) {
      showToast({ type: 'warning', message: 'Customer did not share map location.' });
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
      <Card style={detailStyles.hero}>
        <View style={detailStyles.heroTop}>
          <View style={detailStyles.shopThumb}>
            {order.shop?.logoUrl ? <Image source={{ uri: order.shop.logoUrl }} style={styles.image} /> : <Ionicons name="receipt-outline" size={34} color={colors.primary} />}
          </View>
          <View style={styles.flex}>
            <Text style={detailStyles.shopName} numberOfLines={2}>{order.shop?.name || 'Order Details'}</Text>
            <Text style={styles.muted}>Order #{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.small}>{createdAt}</Text>
            <View style={detailStyles.chipRow}>
              <Text style={detailStyles.chip}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
              <Text style={detailStyles.chip}>Rs.{order.subtotal}</Text>
            </View>
          </View>
          <StatusBadge status={order.status} />
        </View>
      </Card>
      <Card style={detailStyles.timelineCard}>
        {timeline.map((status, index) => {
          const completed = index < activeIndex;
          const current = index === activeIndex;
          const icon = status === 'Pending' ? 'checkmark' : status === 'Accepted' ? 'checkmark' : status === 'Packed' ? 'restaurant-outline' : status === 'Out for Delivery' ? 'bicycle-outline' : 'home-outline';
          return (
            <View key={status} style={detailStyles.timelineStep}>
              <View style={[detailStyles.timelineIcon, completed || current ? detailStyles.timelineIconActive : null]}>
                <Ionicons name={icon} size={16} color={completed || current ? '#fff' : colors.muted} />
              </View>
              <Text style={[detailStyles.timelineText, current ? { color: colors.primary } : null]} numberOfLines={1}>{status === 'Pending' ? 'Placed' : status}</Text>
            </View>
          );
        })}
      </Card>
      <Card style={detailStyles.card}>
        <Text style={styles.subheading}>Customer & Address</Text>
        <InfoRow label="Customer" value={order.customer?.name || 'Customer'} />
        <InfoRow label="Phone" value={customerPhone} />
        <Text style={styles.muted} numberOfLines={2}>{deliveryAddress}</Text>
        <Text style={styles.small}>Landmark: {order.deliveryAddress?.landmark || 'N/A'}</Text>
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
      <Card style={detailStyles.card}>
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
      <Card style={detailStyles.card}>
        <Text style={styles.subheading}>Ordered Items</Text>
        {order.items.map((item) => (
          <View key={`${item.product}-${item.name}`} style={detailStyles.itemRow}>
            <View style={detailStyles.itemImage}>
              {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : <Ionicons name="cube-outline" size={22} color={colors.primary} />}
            </View>
            <View style={styles.flex}>
              <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.muted}>Rs.{item.price} each</Text>
            </View>
            <Text style={detailStyles.qty}>Qty {item.quantity}</Text>
            <Text style={styles.title}>Rs.{item.price * item.quantity}</Text>
          </View>
        ))}
      </Card>
      <Card style={detailStyles.card}>
        <Text style={styles.subheading}>Update status</Text>
        <OptionRow options={orderStatuses} value={order.status} onChange={updateStatus} />
        {statusLoading ? <Text style={styles.muted}>Updating order status...</Text> : null}
      </Card>
      <Card style={detailStyles.card}>
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

const detailStyles = StyleSheet.create({
  hero: { gap: 10, backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  heroTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  shopThumb: { width: 74, height: 74, borderRadius: 18, overflow: 'hidden', backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  shopName: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { color: colors.primary, backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700' },
  timelineCard: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  timelineStep: { flex: 1, alignItems: 'center', gap: 6 },
  timelineIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  timelineIconActive: { backgroundColor: colors.primary },
  timelineText: { color: colors.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  card: { gap: 10 },
  itemRow: { minHeight: 66, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemImage: { width: 52, height: 52, borderRadius: 14, overflow: 'hidden', backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  qty: { color: colors.primary, backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 12, fontWeight: '700' }
});
