import * as Location from 'expo-location';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, DeliveryAddressCard, FixedFooter, Input, PaymentMethodCard, PriceRow, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState({});
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const deliveryCharge = Number(shop?.deliverySettings?.deliveryCharge || 0);
  const toPay = subtotal + deliveryCharge;
  const belowMinimum = items.length > 0 && subtotal < minimumOrder;
  const [address, setAddress] = useState({
    fullAddress: String([user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode].filter(Boolean).join(', ')),
    landmark: String(user?.address?.landmark || ''),
    phone: String(user?.phone || '').replace(/\D/g, '').slice(0, 10),
    latitude: '',
    longitude: ''
  });

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
      setAddress((currentAddress) => ({ ...currentAddress, latitude: current.coords.latitude, longitude: current.coords.longitude }));
      showToast({ type: 'success', message: 'Location added' });
    } catch (_err) {
      const message = 'Location permission denied. Enter address manually.';
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
      clearCart();
      navigation.replace('OrderSuccess', { order: data });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
        <DeliveryAddressCard
          addressText={address.fullAddress}
          latitude={address.latitude}
          longitude={address.longitude}
          loading={locationLoading}
          error={locationError}
          onUseCurrentLocation={captureLocation}
        />
        <Card style={{ gap: 12 }}>
          <Text style={styles.subheading}>Delivery details</Text>
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
        <PaymentMethodCard onSelectUpi={showUpiComingSoon} />
        <Card style={{ gap: 12 }}>
          <Text style={styles.subheading}>Order summary</Text>
          <PriceRow label="Item total" value={subtotal} />
          <PriceRow label="Delivery charge" value={deliveryCharge} />
          <PriceRow label="To pay" value={toPay} strong />
          {minimumOrder > 0 ? <Text style={belowMinimum ? { color: '#b45309', fontWeight: '900' } : styles.muted}>Minimum order: Rs.{minimumOrder}</Text> : null}
        </Card>
      </ScrollView>
      <FixedFooter>
        <Button
          title="Place Order"
          loading={loading}
          disabled={loading || !address.fullAddress || !address.phone || items.length === 0 || belowMinimum}
          onPress={placeOrder}
        />
      </FixedFooter>
    </KeyboardAvoidingView>
  );
}
