import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, Input, styles } from '../components/ui';
import { colors } from '../constants';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const currency = '₹';
const platformFee = 40;
const convenienceFee = 40;
const restaurantOffer = platformFee + convenienceFee;

function formatMoney(value) {
  return `Rs.${Number(value || 0)}`;
}

function formatAddressFromLocation(location) {
  if (!location) return '';

  return [
    location.name,
    location.street,
    location.district || location.subregion,
    location.city,
    location.region,
    location.postalCode
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(', ');
}

function getAddressLines(fullAddress) {
  const parts = String(fullAddress || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    lineOne: parts.slice(0, 2).join(', '),
    lineTwo: parts.slice(2).join(', ')
  };
}

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { setOrderAsActive } = useActiveOrder();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const offerOpacity = useRef(new Animated.Value(0)).current;
  const addressOpacity = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [addressTitle, setAddressTitle] = useState('Home');
  const [errors, setErrors] = useState({});
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const deliveryCharge = Number(shop?.deliverySettings?.deliveryCharge || 0);
  const grossTotal = subtotal + deliveryCharge + platformFee + convenienceFee;
  const toPay = Math.max(0, grossTotal - restaurantOffer);
  const belowMinimum = items.length > 0 && subtotal < minimumOrder;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const [address, setAddress] = useState({
    fullAddress: String([user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode].filter(Boolean).join(', ')),
    landmark: String(user?.address?.landmark || ''),
    phone: String(user?.phone || '').replace(/\D/g, '').slice(0, 10),
    latitude: '',
    longitude: ''
  });
  const addressLines = getAddressLines(address.fullAddress);
  const hasDeliveryAddress = Boolean(address.fullAddress.trim());
  const footerBottomPadding = Math.max(insets.bottom, 0) + 10;
  const footerReserve = Math.max(insets.bottom, 0) + 154;

  useEffect(() => {
    Animated.timing(offerOpacity, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true
    }).start();
  }, [offerOpacity]);

  const animateAddressUpdate = () => {
    addressOpacity.setValue(0.35);
    Animated.timing(addressOpacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true
    }).start();
  };

  const captureLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Location permission denied. Enter address manually.';
        setLocationError(message);
        showToast({ type: 'warning', message });
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const [resolvedAddress] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      });
      const formattedAddress = formatAddressFromLocation(resolvedAddress);

      if (!formattedAddress) {
        const message = 'Unable to fetch current location';
        setLocationError(message);
        showToast({ type: 'warning', message });
        return;
      }

      setAddress((currentAddress) => ({
        ...currentAddress,
        fullAddress: formattedAddress,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      }));
      setAddressTitle('Current Address');
      animateAddressUpdate();
      showToast({ type: 'success', message: 'Current address updated' });
    } catch (_err) {
      const message = 'Unable to fetch current location';
      setLocationError(message);
      showToast({ type: 'warning', message });
    } finally {
      setLocationLoading(false);
    }
  };

  const showUpiComingSoon = () => {
    showToast({ type: 'info', message: 'UPI payment is coming soon.' });
  };

  const placeOrder = async () => {
    const nextErrors = {};
    if (!address.fullAddress.trim()) {
      nextErrors.fullAddress = 'Full delivery address is required.';
      setErrors(nextErrors);
      showToast({ type: 'warning', message: 'Please enter full delivery address.' });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10 digit mobile number.';
      setErrors(nextErrors);
      showToast({ type: 'warning', message: 'Enter a valid 10 digit mobile number.' });
      return;
    }

    if (belowMinimum) {
      showToast({ type: 'warning', message: `Minimum order for this shop is Rs.${minimumOrder}.` });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { data } = await orderApi.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
        paymentMethod: 'COD',
        paymentStatus: 'NOT_REQUIRED',
        deliveryAddress: {
          fullAddress: address.fullAddress.trim(),
          landmark: address.landmark.trim(),
          phone: address.phone.trim(),
          latitude: address.latitude === '' ? undefined : Number(address.latitude),
          longitude: address.longitude === '' ? undefined : Number(address.longitude)
        }
      });
      setOrderAsActive(data, { notify: false });
      clearCart();
      navigation.replace('OrderSuccess', { order: data });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={checkoutStyles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={checkoutStyles.backButton}>
            <Ionicons name="arrow-back-outline" size={22} color={colors.ink} />
            <Text style={checkoutStyles.backText}>Cart</Text>
          </Pressable>
          <Text style={checkoutStyles.headerTitle}>Checkout</Text>
          <View style={checkoutStyles.secureBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={checkoutStyles.secureText}>Secure</Text>
          </View>
        </View>

        <ScrollView
          style={styles.screen}
          contentContainerStyle={[checkoutStyles.content, { paddingBottom: footerReserve }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: addressOpacity }}>
            <Card style={checkoutStyles.addressCard}>
              <View style={checkoutStyles.addressTopRow}>
                <View style={checkoutStyles.addressIcon}>
                  <Ionicons name={addressTitle === 'Current Address' ? 'checkmark-circle' : 'location'} size={22} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={checkoutStyles.eyebrow}>{hasDeliveryAddress ? 'Deliver to' : 'Delivery address'}</Text>
                  <Text style={checkoutStyles.addressTitle}>{hasDeliveryAddress ? addressTitle : 'No delivery address added'}</Text>
                  {hasDeliveryAddress ? (
                    <>
                      <Text style={checkoutStyles.addressName}>{user?.name || 'Customer'}</Text>
                      <Text style={checkoutStyles.addressText}>{addressLines.lineOne}</Text>
                      {addressLines.lineTwo ? <Text style={checkoutStyles.addressText}>{addressLines.lineTwo}</Text> : null}
                      {address.phone ? <Text style={checkoutStyles.phoneText}>Phone: {address.phone}</Text> : null}
                    </>
                  ) : (
                    <Text style={checkoutStyles.addressText}>Add a full address below or use current location.</Text>
                  )}
                  {locationError ? <Text style={checkoutStyles.inlineError}>{locationError}</Text> : null}
                </View>
                <Pressable onPress={() => showToast({ type: 'info', message: 'Edit the address fields below.' })} style={checkoutStyles.changePill}>
                  <Text style={checkoutStyles.changeText}>Change</Text>
                </Pressable>
              </View>
              <Pressable
                disabled={locationLoading}
                onPress={captureLocation}
                style={({ pressed }) => [checkoutStyles.locationButton, pressed ? styles.pressed : null, locationLoading ? styles.disabled : null]}
              >
                <MaterialIcons name="my-location" size={20} color={colors.primary} />
                <Text style={checkoutStyles.locationButtonText}>{locationLoading ? 'Getting current address...' : 'Use Current Location'}</Text>
              </Pressable>
            </Card>
          </Animated.View>

          <Card style={checkoutStyles.detailsCard}>
            <Text style={checkoutStyles.sectionTitle}>Delivery details</Text>
          <Input
            label="Full address"
            placeholder="House no, street, area, city, pincode"
            multiline
            value={address.fullAddress}
            error={errors.fullAddress}
            onChangeText={(fullAddress) => setAddress({ ...address, fullAddress })}
          />
          <Input
            label="Landmark"
            placeholder="Near school, temple, main road..."
            value={address.landmark}
            onChangeText={(landmark) => setAddress({ ...address, landmark })}
          />
          <Input
            label="Phone number"
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            inputMode="numeric"
            value={address.phone}
            error={errors.phone}
            maxLength={10}
            onChangeText={(phone) => setAddress((current) => ({ ...current, phone: String(phone).replace(/\D/g, '').slice(0, 10) }))}
          />
          </Card>

          <Card style={checkoutStyles.card}>
            <Text style={checkoutStyles.sectionTitle}>Payment method</Text>
            <View style={[checkoutStyles.paymentOption, checkoutStyles.paymentSelected]}>
              <View style={checkoutStyles.paymentIcon}>
                <Ionicons name="cash-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={checkoutStyles.paymentTitle}>Cash on Delivery</Text>
                <Text style={checkoutStyles.paymentSubtitle}>Pay directly to delivery partner</Text>
              </View>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            </View>
            <Pressable onPress={showUpiComingSoon} style={({ pressed }) => [checkoutStyles.paymentOption, checkoutStyles.paymentDisabled, pressed ? styles.pressed : null]}>
              <View style={[checkoutStyles.paymentIcon, checkoutStyles.paymentIconMuted]}>
                <MaterialIcons name="payment" size={23} color={colors.muted} />
              </View>
              <View style={styles.flex}>
                <Text style={[checkoutStyles.paymentTitle, { color: colors.muted }]}>Pay via UPI</Text>
                <Text style={checkoutStyles.paymentSubtitle}>Coming soon</Text>
              </View>
              <View style={checkoutStyles.comingSoonBadge}>
                <Text style={checkoutStyles.comingSoonText}>Coming Soon</Text>
              </View>
            </Pressable>
          </Card>

          <Animated.View style={{ opacity: offerOpacity }}>
            <Card style={checkoutStyles.offerCard}>
              <View style={checkoutStyles.offerRow}>
                <View style={checkoutStyles.offerIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                </View>
                <View style={styles.flex}>
                  <Text style={checkoutStyles.offerEyebrow}>Restaurant Offer Applied</Text>
                  <Text style={checkoutStyles.offerTitle}>{formatMoney(restaurantOffer)} OFF for you</Text>
                  <Text style={checkoutStyles.offerText}>Yay! You saved {formatMoney(restaurantOffer)} on this order</Text>
                  <Text style={checkoutStyles.offerHelper}>Automatically applied on platform & convenience fee</Text>
                </View>
                <Text style={checkoutStyles.offerAmount}>- {formatMoney(restaurantOffer)}</Text>
              </View>
            </Card>
          </Animated.View>

          <Card style={checkoutStyles.card}>
            <Text style={checkoutStyles.sectionTitle}>Bill details</Text>
            <BillRow label="Item total" value={subtotal} />
            <BillRow label="Delivery charge" value={deliveryCharge} />
            <BillRow label="Platform fee" value={platformFee} />
            <BillRow label="Convenience fee" value={convenienceFee} />
            <View style={checkoutStyles.divider} />
            <BillRow label="Restaurant offer" value={restaurantOffer} discount />
            <View style={checkoutStyles.totalBox}>
              <View>
                <Text style={checkoutStyles.totalLabel}>To pay</Text>
                <Text style={checkoutStyles.taxText}>(incl. all taxes)</Text>
              </View>
              <Text style={checkoutStyles.totalValue}>{formatMoney(toPay)}</Text>
            </View>
            {minimumOrder > 0 ? (
              <Text style={belowMinimum ? checkoutStyles.minimumWarning : checkoutStyles.minimumText}>Minimum order: {formatMoney(minimumOrder)}</Text>
            ) : null}
          </Card>
        </ScrollView>

        <View style={[checkoutStyles.stickyFooter, { paddingBottom: footerBottomPadding }]}>
          <View style={checkoutStyles.footerSummary}>
            <View>
              <Text style={checkoutStyles.footerLabel}>To pay on delivery</Text>
              <Text style={checkoutStyles.footerAmount}>{formatMoney(toPay)}</Text>
              <Text style={checkoutStyles.footerItem}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
            </View>
            <Button
              title="Place Order"
              loading={loading}
              disabled={loading || items.length === 0 || belowMinimum}
              onPress={placeOrder}
              style={checkoutStyles.placeOrderButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BillRow({ label, value, discount }) {
  return (
    <View style={checkoutStyles.billRow}>
      <Text style={[checkoutStyles.billLabel, discount ? checkoutStyles.discountText : null]}>{label}</Text>
      <Text style={[checkoutStyles.billValue, discount ? checkoutStyles.discountText : null]}>
        {discount ? '- ' : ''}{formatMoney(value)}
      </Text>
    </View>
  );
}

const checkoutStyles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg
  },
  backButton: { minWidth: 82, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.ink, fontSize: 14, fontWeight: '500' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '600' },
  secureBadge: { minWidth: 82, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5 },
  secureText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  content: { padding: 16, paddingTop: 4, gap: 12 },
  card: { gap: 11, borderRadius: 18, padding: 14 },
  detailsCard: { gap: 9, borderRadius: 18, padding: 13 },
  addressCard: { gap: 10, borderRadius: 20, padding: 14 },
  addressTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  addressTitle: { color: colors.ink, fontSize: 17, fontWeight: '600', marginTop: 2 },
  addressName: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 5 },
  addressText: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  phoneText: { color: colors.ink, fontSize: 12, fontWeight: '600', marginTop: 5 },
  inlineError: { color: colors.error, fontSize: 12, fontWeight: '600', marginTop: 6 },
  changePill: { minHeight: 30, borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  changeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  locationButton: { minHeight: 34, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 6, alignSelf: 'flex-start' },
  locationButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  paymentOption: {
    minHeight: 70,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  paymentSelected: { borderColor: colors.primary, backgroundColor: '#FBFAFF' },
  paymentDisabled: { backgroundColor: '#FAFAFB', opacity: 0.78 },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentIconMuted: { backgroundColor: '#F3F4F6' },
  paymentTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  paymentSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 2 },
  comingSoonBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F1F5F9' },
  comingSoonText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  offerCard: { borderRadius: 18, padding: 14, borderColor: '#BBF7D0', backgroundColor: '#FCFFFD' },
  offerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  offerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  offerEyebrow: { color: colors.success, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  offerTitle: { color: colors.ink, fontSize: 17, fontWeight: '600', marginTop: 5 },
  offerText: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 4 },
  offerHelper: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 8 },
  offerAmount: { color: colors.success, fontSize: 17, fontWeight: '700', marginTop: 36 },
  billRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  billLabel: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  billValue: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  discountText: { color: colors.success },
  totalBox: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: '#F8F5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalLabel: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  taxText: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 6 },
  totalValue: { color: colors.ink, fontSize: 21, fontWeight: '600' },
  minimumText: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  minimumWarning: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12
  },
  footerSummary: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  footerLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  footerAmount: { color: colors.ink, fontSize: 20, fontWeight: '600', marginTop: 2 },
  footerItem: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 1 },
  placeOrderButton: { flex: 1, maxWidth: 184, minHeight: 50, borderRadius: 16, alignSelf: 'center' }
});
