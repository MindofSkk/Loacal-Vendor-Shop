import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { categoryApi, shopApi } from '../api/services';
import { Button, Card, Input, Loader, OptionRow, styles } from '../components/ui';
import { businessTypes } from '../constants';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyShop);
  const [currentShop, setCurrentShop] = useState(route.params?.shop || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const shop = route.params?.shop;

  const hydrateShop = (nextShop) => {
    if (!nextShop) return;
    setCurrentShop(nextShop);
    setForm({
      ...emptyShop,
      ...nextShop,
      deliveryRadiusKm: String(nextShop.deliveryRadiusKm || 5),
      location: {
        area: nextShop.location?.area || '',
        city: nextShop.location?.city || '',
        pincode: nextShop.location?.pincode || '',
        landmark: nextShop.location?.landmark || '',
        latitude: nextShop.location?.latitude == null ? '' : String(nextShop.location.latitude),
        longitude: nextShop.location?.longitude == null ? '' : String(nextShop.location.longitude)
      },
      deliveryBoys: nextShop.deliveryBoys || []
    });
  };

  useEffect(() => {
    categoryApi
      .list()
      .then(({ data }) => setCategories(data.filter((category) => category.isActive)))
      .catch((err) => showToast({ type: 'error', message: getApiError(err) }));

    if (shop) {
      hydrateShop(shop);
      return;
    }

    setLoading(true);
    shopApi
      .myShop()
      .then(({ data }) => hydrateShop(data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          showToast({ type: 'error', message: getApiError(err) });
        }
      })
      .finally(() => setLoading(false));
  }, [shop, showToast]);

  const updateLocation = (key, value) => setForm({ ...form, location: { ...form.location, [key]: value } });

  const uploadLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        showToast({ type: 'warning', message: 'Photo permission is required to upload a logo.' });
        return;
      }

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

      setUploading(true);
      const { data } = await shopApi.uploadLogo(formData);
      setForm({ ...form, logoUrl: data.logoUrl });
      showToast({ type: 'success', message: 'Shop logo uploaded.' });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Shop name is required.';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) nextErrors.phone = 'Enter a valid 10 digit phone number.';
    if (!form.location.area.trim()) nextErrors.area = 'Area is required.';
    if (!form.location.city.trim()) nextErrors.city = 'City is required.';
    if (!form.location.pincode.trim()) nextErrors.pincode = 'Pincode is required.';
    if (Number(form.deliveryRadiusKm) <= 0) nextErrors.deliveryRadiusKm = 'Delivery radius must be greater than 0.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const category = categories.find((item) => item.name === form.businessType)?._id || form.category?._id || form.category;
      const location = { ...form.location };
      if (location.latitude === '') delete location.latitude;
      if (location.longitude === '') delete location.longitude;
      await shopApi.saveMyShop({ ...form, category, location });
      showToast({ type: 'success', message: 'Shop profile saved.' });
      navigation.goBack();
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader message="Loading shop profile..." />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={[styles.hero, { gap: 12 }]}>
        <Text style={styles.heading}>{currentShop ? 'Edit shop profile' : 'Create shop profile'}</Text>
        <Text style={styles.muted}>Keep shop details simple and clear for customers.</Text>
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Basic info</Text>
        <Input label="Shop name" error={errors.name} helper="Example: Spice Junction Restaurant" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Shop phone" error={errors.phone} helper="Customers and delivery staff can call this number." keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} />
        <Input label="Description" multiline helper="Short description visible on shop profile." value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Business type</Text>
        <Text style={styles.muted}>Choose the type that matches your inventory and product form.</Text>
        <OptionRow options={businessTypes} value={form.businessType} onChange={(businessType) => setForm({ ...form, businessType })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Logo</Text>
        <View style={{ height: 150, borderRadius: 18, backgroundColor: '#ecfdf5', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="storefront-outline" size={42} color="#049B4F" />
              <Text style={styles.muted}>Shop logo preview</Text>
            </View>
          )}
        </View>
        <Button title="Upload shop logo" variant="secondary" loading={uploading} onPress={uploadLogo} />
        <Input label="Logo URL" helper="Optional. Uploading from gallery fills this automatically." value={form.logoUrl} onChangeText={(logoUrl) => setForm({ ...form, logoUrl })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Address</Text>
        <Input label="Area" error={errors.area} value={form.location.area} onChangeText={(value) => updateLocation('area', value)} />
        <Input label="City" error={errors.city} value={form.location.city} onChangeText={(value) => updateLocation('city', value)} />
        <Input label="Pincode" error={errors.pincode} keyboardType="number-pad" value={form.location.pincode} onChangeText={(value) => updateLocation('pincode', value)} />
        <Input label="Landmark" helper="Optional nearby landmark for customers." value={form.location.landmark} onChangeText={(value) => updateLocation('landmark', value)} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Delivery area</Text>
        <Input label="Delivery radius KM" error={errors.deliveryRadiusKm} helper="Example: 3" keyboardType="numeric" value={String(form.deliveryRadiusKm)} onChangeText={(deliveryRadiusKm) => setForm({ ...form, deliveryRadiusKm })} />
      </Card>
      <Button title="Save shop profile" loading={saving} onPress={save} />
    </ScrollView>
  );
}
