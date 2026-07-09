import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { Button, Card, Input, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const belowMinimum = items.length > 0 && subtotal < minimumOrder;
  const [address, setAddress] = useState({
    fullAddress: [user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode].filter(Boolean).join(', '),
    landmark: user?.address?.landmark || '',
    phone: user?.phone || '',
    latitude: '',
    longitude: ''
  });

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location denied', 'Manual address will be used.');
      return;
    }
    const current = await Location.getCurrentPositionAsync({});
    setAddress({ ...address, latitude: current.coords.latitude, longitude: current.coords.longitude });
    Alert.alert('Location captured', 'Location helps the seller deliver faster.');
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
      Alert.alert('Minimum order', `Minimum order for this shop is ₹${minimumOrder}.`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await orderApi.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Delivery address</Text>
        <Text style={styles.muted}>Location helps the seller deliver faster.</Text>
        <Button title={address.latitude ? 'GPS location captured' : 'Capture GPS location'} variant={address.latitude ? 'secondary' : 'primary'} onPress={captureLocation} />
        <Input label="Full address" multiline value={address.fullAddress} onChangeText={(fullAddress) => setAddress({ ...address, fullAddress })} />
        <Input label="Landmark" value={address.landmark} onChangeText={(landmark) => setAddress({ ...address, landmark })} />
        <Input label="Phone number" keyboardType="phone-pad" value={address.phone} onChangeText={(phone) => setAddress({ ...address, phone })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <View style={styles.between}>
          <Text style={styles.title}>Total</Text>
          <Text style={styles.price}>₹{subtotal}</Text>
        </View>
        {minimumOrder > 0 ? <Text style={belowMinimum ? { color: '#b45309', fontWeight: '900' } : styles.muted}>Minimum order: ₹{minimumOrder}</Text> : null}
        <Button
          title={loading ? 'Placing...' : 'Place order'}
          disabled={loading || !address.fullAddress || !address.phone || items.length === 0 || belowMinimum}
          onPress={placeOrder}
        />
      </Card>
    </ScrollView>
  );
}
