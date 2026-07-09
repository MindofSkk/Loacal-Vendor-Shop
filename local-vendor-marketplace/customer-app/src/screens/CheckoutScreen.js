import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, DeliveryAddressCard, Input, PaymentMethodCard, PriceRow, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const deliveryCharge = Number(shop?.deliverySettings?.deliveryCharge || 0);
  const toPay = subtotal + deliveryCharge;
  const belowMinimum = items.length > 0 && subtotal < minimumOrder;
  const [address, setAddress] = useState({
    fullAddress: [user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode].filter(Boolean).join(', '),
    landmark: user?.address?.landmark || '',
    phone: user?.phone || '',
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
        Alert.alert('Location denied', message);
        setShowAddressForm(true);
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setAddress({ ...address, latitude: current.coords.latitude, longitude: current.coords.longitude });
      Alert.alert('Location added', 'Location added');
    } catch (_err) {
      const message = 'Location permission denied. Enter address manually.';
      setLocationError(message);
      Alert.alert('Location error', message);
      setShowAddressForm(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const showUpiComingSoon = () => {
    Alert.alert('Coming soon', 'UPI payment is coming soon.');
  };

  const placeOrder = async () => {
    if (!address.fullAddress.trim()) {
      Alert.alert('Address required', 'Please enter full delivery address.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      Alert.alert('Valid phone required', 'Please enter a valid 10 digit Indian mobile number.');
      return;
    }

    if (belowMinimum) {
      Alert.alert('Minimum order', `Minimum order for this shop is Rs.${minimumOrder}.`);
      return;
    }

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
      Alert.alert('Order failed', getApiError(err));
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
          onEditAddress={() => setShowAddressForm((current) => !current)}
        />
        {showAddressForm ? (
          <Card style={{ gap: 12 }}>
            <Text style={styles.subheading}>Edit address</Text>
            <Input label="Full address" multiline value={address.fullAddress} onChangeText={(fullAddress) => setAddress({ ...address, fullAddress })} />
            <Input label="Landmark" value={address.landmark} onChangeText={(landmark) => setAddress({ ...address, landmark })} />
            <Input label="Phone number" keyboardType="phone-pad" value={address.phone} onChangeText={(phone) => setAddress({ ...address, phone })} />
            <Button title="Save address" onPress={() => setShowAddressForm(false)} />
          </Card>
        ) : null}
        <PaymentMethodCard onSelectUpi={showUpiComingSoon} />
        <Card style={{ gap: 12 }}>
          <Text style={styles.subheading}>Order summary</Text>
          <PriceRow label="Item total" value={subtotal} />
          <PriceRow label="Delivery charge" value={deliveryCharge} />
          <PriceRow label="To pay" value={toPay} strong />
          {minimumOrder > 0 ? <Text style={belowMinimum ? { color: '#b45309', fontWeight: '900' } : styles.muted}>Minimum order: Rs.{minimumOrder}</Text> : null}
        </Card>
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB'
        }}
      >
        <Button
          title={loading ? 'Placing...' : 'Place Order'}
          disabled={loading || !address.fullAddress || !address.phone || items.length === 0 || belowMinimum}
          onPress={placeOrder}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
