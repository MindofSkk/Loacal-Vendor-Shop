import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text } from 'react-native';
import { getApiError } from '../api/client';
import { categoryApi, shopApi } from '../api/services';
import { Button, Card, Input, OptionRow, styles } from '../components/ui';
import { businessTypes } from '../constants';

const emptyShop = {
  name: '',
  description: '',
  logoUrl: '',
  businessType: 'Restaurant',
  phone: '',
  deliveryRadiusKm: '5',
  location: { area: '', city: '', pincode: '', landmark: '', latitude: '', longitude: '' },
  deliveryBoys: []
};

export default function ShopProfileScreen({ route, navigation }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyShop);
  const shop = route.params?.shop;

  useEffect(() => {
    categoryApi.list().then(({ data }) => setCategories(data.filter((category) => category.isActive)));
    if (shop) {
      setForm({
        ...emptyShop,
        ...shop,
        deliveryRadiusKm: String(shop.deliveryRadiusKm || 5),
        location: {
          area: shop.location?.area || '',
          city: shop.location?.city || '',
          pincode: shop.location?.pincode || '',
          landmark: shop.location?.landmark || '',
          latitude: shop.location?.latitude == null ? '' : String(shop.location.latitude),
          longitude: shop.location?.longitude == null ? '' : String(shop.location.longitude)
        },
        deliveryBoys: shop.deliveryBoys || []
      });
    }
  }, [shop]);

  const updateLocation = (key, value) => setForm({ ...form, location: { ...form.location, [key]: value } });

  const uploadLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const extension = asset.uri.split('.').pop() || 'jpg';
      const formData = new FormData();
      formData.append('logo', {
        uri: asset.uri,
        name: `shop-logo.${extension}`,
        type: asset.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`
      });

      const { data } = await shopApi.uploadLogo(formData);
      setForm({ ...form, logoUrl: data.logoUrl });
      Alert.alert('Logo uploaded', 'Shop logo is ready to save.');
    } catch (err) {
      Alert.alert('Logo upload failed', getApiError(err));
    }
  };

  const save = async () => {
    try {
      const category = categories.find((item) => item.name === form.businessType)?._id || form.category?._id || form.category;
      const location = { ...form.location };
      if (location.latitude === '') delete location.latitude;
      if (location.longitude === '') delete location.longitude;
      await shopApi.saveMyShop({ ...form, category, location });
      Alert.alert('Saved', 'Shop profile saved.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', getApiError(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Business type</Text>
        <OptionRow options={businessTypes} value={form.businessType} onChange={(businessType) => setForm({ ...form, businessType })} />
        <Input label="Shop name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Shop phone" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} />
        <Input label="Description" value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
        {form.logoUrl ? <Image source={{ uri: form.logoUrl }} style={{ height: 140, borderRadius: 16 }} /> : null}
        <Button title="Upload shop logo" variant="secondary" onPress={uploadLogo} />
        <Input label="Logo URL" value={form.logoUrl} onChangeText={(logoUrl) => setForm({ ...form, logoUrl })} />
        <Input label="Delivery radius KM" keyboardType="numeric" value={String(form.deliveryRadiusKm)} onChangeText={(deliveryRadiusKm) => setForm({ ...form, deliveryRadiusKm })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Location</Text>
        <Input label="Area" value={form.location.area} onChangeText={(value) => updateLocation('area', value)} />
        <Input label="City" value={form.location.city} onChangeText={(value) => updateLocation('city', value)} />
        <Input label="Pincode" keyboardType="number-pad" value={form.location.pincode} onChangeText={(value) => updateLocation('pincode', value)} />
        <Input label="Landmark" value={form.location.landmark} onChangeText={(value) => updateLocation('landmark', value)} />
        <Input label="Latitude" keyboardType="numeric" value={form.location.latitude} onChangeText={(value) => updateLocation('latitude', value)} />
        <Input label="Longitude" keyboardType="numeric" value={form.location.longitude} onChangeText={(value) => updateLocation('longitude', value)} />
      </Card>
      <Button title="Save shop profile" onPress={save} />
    </ScrollView>
  );
}
