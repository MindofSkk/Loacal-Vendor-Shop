import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, Loader, styles } from '../components/ui';
import { colors } from '../constants';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProductThumbnail } from '../utils/productImages';
import { getOrderStatusMeta, normalizeOrderStatus } from '../utils/orderStatus';

const platformFee = 20;
const convenienceFee = 20;
const statusSteps = [
  { key: 'Pending', label: 'Placed', icon: 'checkmark' },
  { key: 'Accepted', label: 'Accepted', icon: 'checkmark' },
  { key: 'Packed', label: 'Preparing', icon: 'pot-steam-outline' },
  { key: 'Out for Delivery', label: 'On way', icon: 'moped-outline' },
  { key: 'Delivered', label: 'Delivered', icon: 'home' }
];

function formatMoney(value) {
  return `Rs.${Number(value || 0)}`;
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const day = sameDay ? 'Today' : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${day}, ${formatTime(value)}`;
}

function normalizeStatus(status) {
  return normalizeOrderStatus(status);
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'Pending') return 'Placed';
  if (normalized === 'Packed') return 'Preparing';
  return normalized;
}

function getStepIndex(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'Cancelled' || normalized === 'Rejected') return 0;
  return Math.max(0, statusSteps.findIndex((step) => step.key === normalized));
}

function getLineParts(address) {
  return String(address || '')
    .replace(/[\u0000-\u001F\u007F\uFFFD]/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,+/g, ',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function sanitizeAddress(address) {
  return getLineParts(address).join(', ');
}

function getOrderItem(item) {
  const product = item.product && typeof item.product === 'object' ? item.product : {};
  return {
    ...product,
    ...item,
    name: item.name || product.name || 'Product',
    category: item.foodCategory || item.groceryCategory || item.dairyBakeryType || product.foodCategory || product.groceryCategory || product.dairyBakeryType || product.brand || '',
    image: getProductThumbnail(product) || getProductThumbnail(item),
    isNonVeg: String(item.vegType || product.vegType || '').toLowerCase().includes('non')
  };
}

function OrderImage({ uri, icon = 'storefront-outline', style }) {
  const [failed, setFailed] = useState(false);

  if (uri && !failed) {
    return <Image source={{ uri }} style={style || orderStyles.imageFill} resizeMode="cover" onError={() => setFailed(true)} />;
  }

  return (
    <View style={[orderStyles.imageFallback, style]}>
      <Ionicons name={icon} size={26} color={colors.primary} />
    </View>
  );
}

export default function OrderDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { activeOrder, latestOrder, refreshActiveOrder, setOrderAsActive } = useActiveOrder();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const isTablet = width >= 700;
  const orderId = route.params.order._id;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true
    }).start();
  }, [fade]);

  const refreshOrder = useCallback(async ({ notify = true } = {}) => {
    try {
      const { data } = await orderApi.get(orderId);
      setOrder(data);
      setOrderAsActive(data, { notify });
      return data;
    } catch {
      return null;
    }
  }, [orderId, setOrderAsActive]);

  useFocusEffect(
    useCallback(() => {
      refreshOrder({ notify: true });
      refreshActiveOrder({ silent: true, notify: true });
    }, [refreshActiveOrder, refreshOrder])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshOrder({ notify: true });
      }
    });

    return () => subscription.remove();
  }, [refreshOrder]);

  useEffect(() => {
    const liveOrder = [activeOrder, latestOrder].find((item) => item?._id === orderId);
    if (liveOrder) setOrder((current) => ({ ...current, ...liveOrder }));
  }, [activeOrder, latestOrder, orderId]);

  const cancelOrder = async () => {
    setLoading(true);
    try {
      const { data: cancelledOrder } = await orderApi.cancel(order._id, { reason: cancelReason.trim() || 'Customer cancelled before acceptance' });
      setOrder(cancelledOrder);
      setOrderAsActive(cancelledOrder, { notify: false });
      setCancelSheetVisible(false);
      showToast({ type: 'success', message: 'Order cancelled.' });
      navigation.goBack();
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    const items = (order?.items || []).map(getOrderItem);
    const itemTotal = Number(order?.subtotal ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
    const deliveryFee = Number(order?.deliveryCharge ?? order?.deliveryFee ?? order?.shop?.deliverySettings?.deliveryCharge ?? Math.max(0, Number(order?.totalAmount || 0) - itemTotal));
    const displayedTotal = Number(order?.totalAmount ?? itemTotal + deliveryFee);
    const gross = itemTotal + deliveryFee + platformFee + convenienceFee;
    const restaurantOffer = Math.max(0, gross - displayedTotal);
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const status = normalizeStatus(order?.status);
    const statusIndex = getStepIndex(status);
    const canCancel = ['Pending', 'Accepted', 'Packed'].includes(status);
    const shopImage = order?.shop?.logoUrl || order?.shop?.imageUrl || items[0]?.image || '';

    return {
      items,
      visibleItems: showAllItems ? items : items.slice(0, 3),
      itemTotal,
      deliveryFee,
      displayedTotal,
      restaurantOffer,
      itemCount,
      status,
      statusIndex,
      canCancel,
      shopImage
    };
  }, [order, showAllItems]);

  if (!order) return <Loader />;

  const addressText = sanitizeAddress(order.deliveryAddress?.fullAddress);
  const addressLong = addressText.length > 72;
  const customerName = order.customer?.name || user?.name || 'Customer';
  const orderNumber = order._id?.slice(-6)?.toUpperCase();

  return (
    <SafeAreaView style={orderStyles.screen} edges={['top', 'left', 'right']}>
      <View style={orderStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={({ pressed }) => [orderStyles.headerButton, pressed ? styles.pressed : null]}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.ink} />
        </Pressable>
        <Text style={orderStyles.headerTitle}>Order Details</Text>
        <Pressable onPress={() => showToast({ type: 'info', message: 'Help support is coming soon.' })} hitSlop={10} style={({ pressed }) => [orderStyles.helpButton, pressed ? styles.pressed : null]}>
          <Ionicons name="headset-outline" size={19} color={colors.primary} />
          <Text style={orderStyles.helpText}>Help</Text>
        </Pressable>
      </View>

      <Animated.View style={[orderStyles.flex, { opacity: fade }]}>
        <ScrollView
          style={orderStyles.flex}
          contentContainerStyle={[orderStyles.content, { paddingBottom: Math.max(insets.bottom, 0) + 26 }]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={orderStyles.heroCard}>
            <View style={orderStyles.heroTop}>
              <View style={orderStyles.shopImage}>
                <OrderImage uri={data.shopImage} />
              </View>
              <View style={orderStyles.heroInfo}>
                <Text style={orderStyles.shopName} numberOfLines={2}>{order.shop?.name || 'Local shop'}</Text>
                <View style={orderStyles.orderNumberRow}>
                  <Text style={orderStyles.orderNumber}>Order #{orderNumber}</Text>
                  <Ionicons name="copy-outline" size={16} color={colors.muted} />
                </View>
                <Text style={orderStyles.orderTime}>{formatDateTime(order.createdAt)}</Text>
                <View style={orderStyles.heroPills}>
                  <View style={orderStyles.heroPill}>
                    <Ionicons name="bag-handle-outline" size={15} color={colors.primary} />
                    <Text style={orderStyles.heroPillText}>{data.itemCount} {data.itemCount === 1 ? 'Item' : 'Items'}</Text>
                  </View>
                  <View style={orderStyles.heroPill}>
                    <Ionicons name="wallet-outline" size={15} color={colors.primary} />
                    <Text style={orderStyles.heroPillText}>{formatMoney(data.displayedTotal)}</Text>
                  </View>
                </View>
              </View>
              <View style={orderStyles.heroRight}>
                <View style={[orderStyles.statusBadge, data.status === 'Cancelled' || data.status === 'Rejected' ? orderStyles.statusDanger : null]}>
                  <Text style={[orderStyles.statusBadgeText, { color: getOrderStatusMeta(data.status).color }, data.status === 'Cancelled' || data.status === 'Rejected' ? orderStyles.statusDangerText : null]}>
                    {getStatusLabel(data.status)}
                  </Text>
                </View>
                <View style={orderStyles.heroIllustration}>
                  <MaterialCommunityIcons name={data.status === 'Delivered' ? 'home-check-outline' : 'pot-steam-outline'} size={29} color={colors.primary} />
                </View>
              </View>
            </View>
          </Card>

          <Card style={orderStyles.trackerCard}>
            <View style={orderStyles.timeline}>
              {statusSteps.map((step, index) => {
                const completed = data.statusIndex > index || data.status === 'Delivered';
                const active = data.statusIndex === index && !['Cancelled', 'Rejected'].includes(data.status);
                const upcoming = data.statusIndex < index;
                const time = index === 0 ? formatTime(order.createdAt) : active || completed ? formatTime(order.updatedAt) : '';

                return (
                  <View key={step.key} style={orderStyles.stepWrap}>
                    {index > 0 ? <View style={[orderStyles.stepLine, completed || active ? orderStyles.stepLineActive : null]} /> : null}
                    <View style={[orderStyles.stepIcon, completed ? orderStyles.stepDone : null, active ? orderStyles.stepActive : null]}>
                      {completed ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : step.icon.includes('outline') ? (
                        <MaterialCommunityIcons name={step.icon} size={16} color={upcoming ? '#9CA3AF' : '#fff'} />
                      ) : (
                        <Ionicons name={step.icon} size={16} color={upcoming ? '#9CA3AF' : '#fff'} />
                      )}
                    </View>
                    <Text style={[orderStyles.stepLabel, active ? orderStyles.stepLabelActive : null]} numberOfLines={1}>{step.label}</Text>
                    {time ? <Text style={orderStyles.stepTime}>{time}</Text> : null}
                  </View>
                );
              })}
            </View>
          </Card>

          <Card style={orderStyles.addressCard}>
            <View style={orderStyles.addressIcon}>
              <Ionicons name="location" size={22} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={orderStyles.cardTitle}>Delivery Address</Text>
              <Text style={orderStyles.customerName}>{customerName}</Text>
              {addressText ? (
                <>
                  <Text style={orderStyles.addressText} numberOfLines={showFullAddress ? undefined : 2}>{addressText}</Text>
                  {addressLong ? (
                    <Pressable onPress={() => setShowFullAddress((value) => !value)} hitSlop={8} style={orderStyles.readMoreButton}>
                      <Text style={orderStyles.readMoreText}>{showFullAddress ? 'Read Less' : 'Read More'}</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <Text style={orderStyles.addressText}>No delivery address added</Text>
              )}
              {order.deliveryAddress?.landmark ? <Text style={orderStyles.addressText}>Landmark: {order.deliveryAddress.landmark}</Text> : null}
              <Text style={orderStyles.phoneText}>Phone: {order.deliveryAddress?.phone || 'N/A'}</Text>
            </View>
            <Pressable onPress={() => showToast({ type: 'info', message: 'Address cannot be changed after order placement.' })} style={orderStyles.changePill}>
              <Text style={orderStyles.changeText}>Change</Text>
            </Pressable>
          </Card>

          <Card style={orderStyles.itemsCard}>
            <Text style={orderStyles.cardTitle}>Ordered Items</Text>
            {data.visibleItems.map((item, index) => (
              <View key={`${item._id || item.product || item.name}-${index}`} style={[orderStyles.itemRow, index > 0 ? orderStyles.itemDivider : null]}>
                <View style={orderStyles.itemImageWrap}>
                  <OrderImage uri={item.image} icon="cube-outline" />
                  <View style={[orderStyles.vegBadge, item.isNonVeg ? orderStyles.nonVegBadge : null]}>
                    <View style={[orderStyles.vegDot, item.isNonVeg ? orderStyles.nonVegDot : null]} />
                  </View>
                </View>
                <View style={styles.flex}>
                  <Text style={orderStyles.itemName} numberOfLines={1}>{item.name}</Text>
                  {item.category ? <Text style={orderStyles.itemCategory} numberOfLines={1}>{item.category}</Text> : null}
                  <Text style={orderStyles.itemUnit}>{formatMoney(item.price)}</Text>
                </View>
                <View style={orderStyles.qtyPill}>
                  <Text style={orderStyles.qtyText}>Qty {item.quantity}</Text>
                </View>
                <Text style={orderStyles.itemPrice}>{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</Text>
              </View>
            ))}
            {data.items.length > 3 ? (
              <Pressable onPress={() => setShowAllItems((value) => !value)} style={orderStyles.viewAllButton}>
                <Text style={orderStyles.viewAllText}>{showAllItems ? 'Show less' : `View all items (${data.items.length})`}</Text>
                <Ionicons name={showAllItems ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.primary} />
              </Pressable>
            ) : null}
          </Card>

          <View style={[orderStyles.twoColumn, !isTablet ? orderStyles.oneColumn : null]}>
            <Card style={[orderStyles.halfCard, !isTablet ? orderStyles.fullCard : null, orderStyles.paymentCard]}>
              <View style={orderStyles.cardTitleRow}>
                <View style={orderStyles.smallIconBubble}>
                  <Ionicons name="wallet-outline" size={19} color={colors.primary} />
                </View>
                <Text style={orderStyles.cardTitle}>Payment</Text>
              </View>
              <Text style={orderStyles.paymentMethod}>{order.paymentMethod === 'UPI' ? 'UPI' : 'Cash on Delivery'}</Text>
              <View style={orderStyles.paymentBadge}>
                <Text style={orderStyles.paymentBadgeText}>{order.paymentStatus === 'PAID' ? 'Paid' : 'Payment Pending'}</Text>
              </View>
            </Card>

            <Card style={[orderStyles.halfCard, !isTablet ? orderStyles.fullCard : null]}>
              <View style={orderStyles.cardTitleRow}>
                <View style={orderStyles.smallIconBubble}>
                  <Ionicons name="receipt-outline" size={19} color={colors.primary} />
                </View>
                <Text style={orderStyles.cardTitle}>Bill Details</Text>
              </View>
              <BillRow label="Item Total" value={data.itemTotal} />
              <BillRow label="Delivery Fee" value={data.deliveryFee} />
              <BillRow label="Platform Fee" value={platformFee} />
              <BillRow label="Convenience Fee" value={convenienceFee} />
              {data.restaurantOffer > 0 ? <BillRow label="Restaurant Offer" value={data.restaurantOffer} discount /> : null}
              <View style={orderStyles.dashedDivider} />
              <View style={orderStyles.totalRow}>
                <Text style={orderStyles.totalText}>To Pay</Text>
                <Text style={orderStyles.totalAmount}>{formatMoney(data.displayedTotal)}</Text>
              </View>
            </Card>
          </View>

          <Card style={orderStyles.actionsCard}>
            <View style={orderStyles.cardTitleRow}>
              <View style={orderStyles.smallIconBubble}>
                <Ionicons name="storefront-outline" size={19} color={colors.primary} />
              </View>
              <Text style={orderStyles.cardTitle}>Store Actions</Text>
            </View>
            <ActionRow icon="call-outline" label="Call Store" onPress={() => showToast({ type: 'info', message: 'Store calling is coming soon.' })} />
            <ActionRow icon="navigate-outline" label="Directions" onPress={() => showToast({ type: 'info', message: 'Directions are coming soon.' })} />
            <ActionRow icon="chatbubble-ellipses-outline" label="Chat" badge="Coming Soon" onPress={() => showToast({ type: 'info', message: 'Chat is coming soon.' })} />
          </Card>

          {data.canCancel ? (
            <Card style={orderStyles.cancelCard}>
              <Button
                title="Cancel Order"
                variant="outlineDanger"
                loading={loading}
                disabled={loading}
                onPress={() => setCancelSheetVisible(true)}
                style={orderStyles.cancelButton}
              />
              <Text style={orderStyles.cancelHelper}>You can cancel this order until the shop starts delivery.</Text>
            </Card>
          ) : null}
        </ScrollView>
      </Animated.View>

      <CancelSheet
        visible={cancelSheetVisible}
        loading={loading}
        reason={cancelReason}
        onChangeReason={setCancelReason}
        onClose={() => setCancelSheetVisible(false)}
        onConfirm={cancelOrder}
        bottomInset={insets.bottom}
      />
    </SafeAreaView>
  );
}

function BillRow({ label, value, discount }) {
  return (
    <View style={orderStyles.billRow}>
      <Text style={[orderStyles.billLabel, discount ? orderStyles.discountText : null]}>{label}</Text>
      <Text style={[orderStyles.billValue, discount ? orderStyles.discountText : null]}>
        {discount ? '-' : ''}{formatMoney(value)}
      </Text>
    </View>
  );
}

function ActionRow({ icon, label, badge, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [orderStyles.actionRow, pressed ? styles.pressed : null]}>
      <Ionicons name={icon} size={22} color={colors.muted} />
      <Text style={orderStyles.actionText}>{label}</Text>
      {badge ? <Text style={orderStyles.actionBadge}>{badge}</Text> : <Ionicons name="chevron-forward-outline" size={20} color={colors.muted} />}
    </Pressable>
  );
}

function CancelSheet({ visible, loading, reason, onChangeReason, onClose, onConfirm, bottomInset }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={orderStyles.sheetBackdrop}>
        <Pressable style={orderStyles.sheetBackdropPress} onPress={onClose} />
        <View style={[orderStyles.sheet, { paddingBottom: Math.max(bottomInset, 0) + 16 }]}>
          <View style={orderStyles.sheetHandle} />
          <Text style={orderStyles.sheetTitle}>Cancel Order?</Text>
          <Text style={orderStyles.sheetText}>Tell us why you want to cancel. This is optional.</Text>
          <TextInput
            value={reason}
            onChangeText={onChangeReason}
            placeholder="Reason optional"
            placeholderTextColor="#9CA3AF"
            multiline
            style={orderStyles.reasonInput}
          />
          <View style={orderStyles.sheetActions}>
            <Button title="Keep Order" variant="secondary" onPress={onClose} style={orderStyles.sheetButton} />
            <Button title="Cancel Order" variant="danger" loading={loading} disabled={loading} onPress={onConfirm} style={orderStyles.sheetButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const orderStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8FC' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F8FC'
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '600' },
  helpButton: { minHeight: 44, minWidth: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  helpText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  heroCard: {
    borderRadius: 18,
    padding: 12,
    borderColor: '#DDD6FE',
    backgroundColor: '#F7F2FF',
    overflow: 'hidden'
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  shopImage: { width: 80, height: 80, borderRadius: 15, overflow: 'hidden', backgroundColor: '#EDE9FE' },
  heroInfo: { flex: 1, minWidth: 0, gap: 3 },
  shopName: { color: colors.ink, fontSize: 21, lineHeight: 25, fontWeight: '600' },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderNumber: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  orderTime: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
  heroPill: { minHeight: 28, borderRadius: 999, backgroundColor: '#fff', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroPillText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  heroRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { minHeight: 30, borderRadius: 999, backgroundColor: '#FEF3C7', paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  statusBadgeText: { color: '#92400E', fontSize: 12, fontWeight: '600' },
  statusDanger: { backgroundColor: '#FEE2E2' },
  statusDangerText: { color: colors.error },
  heroIllustration: { width: 44, height: 44, borderRadius: 17, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  trackerCard: { paddingVertical: 14, paddingHorizontal: 10, borderRadius: 18 },
  timeline: { flexDirection: 'row', alignItems: 'flex-start' },
  stepWrap: { flex: 1, alignItems: 'center', minHeight: 76, minWidth: 0 },
  stepLine: { position: 'absolute', top: 15, left: '-50%', right: '50%', height: 2, backgroundColor: '#E5E7EB' },
  stepLineActive: { backgroundColor: colors.primary },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLabel: { color: colors.muted, fontSize: 11, lineHeight: 14, fontWeight: '600', textAlign: 'center', marginTop: 7 },
  stepLabelActive: { color: colors.primary },
  stepTime: { color: colors.muted, fontSize: 11, fontWeight: '500', marginTop: 3 },
  addressCard: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  customerName: { color: colors.ink, fontSize: 14, fontWeight: '600', marginTop: 6 },
  addressText: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500', marginTop: 2 },
  phoneText: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 6 },
  readMoreButton: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  readMoreText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  changePill: { minHeight: 34, borderRadius: 999, paddingHorizontal: 13, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  changeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  itemsCard: { borderRadius: 18, padding: 14, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  itemImageWrap: { width: 70, height: 70, borderRadius: 15, overflow: 'hidden', backgroundColor: '#F5F3FF' },
  itemName: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  itemCategory: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 2 },
  itemUnit: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 3 },
  qtyPill: { minHeight: 30, borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  itemPrice: { minWidth: 58, textAlign: 'right', color: colors.ink, fontSize: 14, fontWeight: '600' },
  vegBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.success, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nonVegBadge: { borderColor: '#DC2626' },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  nonVegDot: { backgroundColor: '#DC2626' },
  viewAllButton: { minHeight: 42, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewAllText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  twoColumn: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  oneColumn: { flexDirection: 'column' },
  halfCard: { flex: 1, borderRadius: 18, padding: 14, gap: 11 },
  fullCard: { flex: 0, width: '100%' },
  paymentCard: { minHeight: 122 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallIconBubble: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  paymentMethod: { color: colors.ink, fontSize: 15, fontWeight: '600', marginTop: 2 },
  paymentBadge: { alignSelf: 'flex-start', minHeight: 28, borderRadius: 999, paddingHorizontal: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  paymentBadgeText: { color: '#92400E', fontSize: 12, fontWeight: '600' },
  billRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  billLabel: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: '500' },
  billValue: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  discountText: { color: colors.success },
  dashedDivider: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', marginVertical: 5 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  totalAmount: { color: colors.ink, fontSize: 20, fontWeight: '600' },
  actionsCard: { borderRadius: 18, padding: 14, gap: 4 },
  actionRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '600' },
  actionBadge: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  cancelCard: { borderRadius: 20, padding: 14, gap: 10 },
  cancelButton: { minHeight: 50, borderRadius: 999, backgroundColor: '#fff' },
  cancelHelper: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '500', textAlign: 'center' },
  imageFill: { width: '100%', height: '100%' },
  imageFallback: { width: '100%', height: '100%', backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.38)', justifyContent: 'flex-end' },
  sheetBackdropPress: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#fff', padding: 16, gap: 12 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: '600' },
  sheetText: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  reasonInput: { minHeight: 86, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.ink, textAlignVertical: 'top', fontSize: 14 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetButton: { flex: 1, minHeight: 48 }
});
