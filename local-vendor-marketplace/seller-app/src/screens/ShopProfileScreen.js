import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { categoryApi, shopApi } from '../api/services';
import { Button, Card, Input, Loader, OptionRow, StatusBadge, styles } from '../components/ui';
import { businessTypes, colors } from '../constants';
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
  const approvalStatus = currentShop?.status || 'pending';
  const addressLine = [form.location.area, form.location.city, form.location.pincode].filter(Boolean).join(', ');
  const hasCoordinates = form.location.latitude !== '' && form.location.longitude !== '';

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
      <Card style={profileStyles.headerCard}>
        <View style={profileStyles.logoLarge}>
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={styles.image} />
          ) : (
            <Ionicons name="storefront-outline" size={42} color={colors.primary} />
          )}
        </View>
        <View style={styles.flex}>
          <View style={styles.between}>
            <Text style={profileStyles.shopName} numberOfLines={2}>{form.name || 'Your Shop'}</Text>
            <StatusBadge status={approvalStatus} />
          </View>
          <Text style={styles.muted}>{form.businessType}</Text>
          <View style={profileStyles.metaRow}>
            <Text style={profileStyles.metaPill}>4.5 rating</Text>
            <Text style={profileStyles.metaPill}>{approvalStatus === 'approved' ? 'Verified' : 'Under review'}</Text>
            <Text style={profileStyles.metaPill}>{currentShop?.isOpen === false ? 'Closed' : 'Open now'}</Text>
          </View>
          {addressLine ? <Text style={styles.small} numberOfLines={1}>{addressLine}</Text> : null}
        </View>
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Shop Information</Text>
        <Text style={styles.muted}>Customer-facing name, contact number and description.</Text>
        <Input label="Shop name" error={errors.name} helper="Example: Spice Junction Restaurant" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Shop phone" error={errors.phone} helper="Customers and delivery staff can call this number." keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} />
        <Input label="Description" multiline helper="Short description visible on shop profile." value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Business Details</Text>
        <Text style={styles.muted}>Choose the type that matches your inventory and product form.</Text>
        <OptionRow options={businessTypes} value={form.businessType} onChange={(businessType) => setForm({ ...form, businessType })} />
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Images</Text>
        <Text style={styles.muted}>Logo appears on customer shop cards. Banner and gallery can be managed when media APIs are added.</Text>
        <View style={profileStyles.logoPreview}>
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="storefront-outline" size={42} color="#049B4F" />
              <Text style={styles.muted}>Shop logo preview</Text>
            </View>
          )}
        </View>
        <View style={styles.row}>
          <Button title="Upload Logo" variant="secondary" loading={uploading} onPress={uploadLogo} style={styles.flex} />
          <Button title="Replace" variant="secondary" loading={uploading} onPress={uploadLogo} style={styles.flex} />
        </View>
        <Input label="Logo URL" helper="Optional. Uploading from gallery fills this automatically." value={form.logoUrl} onChangeText={(logoUrl) => setForm({ ...form, logoUrl })} />
        <View style={profileStyles.galleryRow}>
          {['Banner', 'Gallery 1', 'Gallery 2'].map((item) => (
            <View key={item} style={profileStyles.galleryTile}>
              <Ionicons name="image-outline" size={22} color={colors.primary} />
              <Text style={styles.small}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Address</Text>
        <Input label="Area" error={errors.area} value={form.location.area} onChangeText={(value) => updateLocation('area', value)} />
        <Input label="City" error={errors.city} value={form.location.city} onChangeText={(value) => updateLocation('city', value)} />
        <Input label="Pincode" error={errors.pincode} keyboardType="number-pad" value={form.location.pincode} onChangeText={(value) => updateLocation('pincode', value)} />
        <Input label="Landmark" helper="Optional nearby landmark for customers." value={form.location.landmark} onChangeText={(value) => updateLocation('landmark', value)} />
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Live Location</Text>
        <View style={profileStyles.mapPreview}>
          <Ionicons name={hasCoordinates ? 'location' : 'location-outline'} size={26} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.title}>{hasCoordinates ? 'Location attached' : 'Map location not added'}</Text>
            <Text style={styles.muted}>{hasCoordinates ? 'Customers can calculate distance more accurately.' : 'Use the web panel or API location fields to add precise coordinates.'}</Text>
          </View>
        </View>
        <Button title="Change Location" variant="secondary" onPress={() => showToast({ type: 'info', message: 'Precise location picker is coming soon.' })} />
      </Card>
      <Card style={profileStyles.section}>
        <Text style={styles.subheading}>Delivery</Text>
        <Input label="Delivery radius KM" error={errors.deliveryRadiusKm} helper="Example: 3" keyboardType="numeric" value={String(form.deliveryRadiusKm)} onChangeText={(deliveryRadiusKm) => setForm({ ...form, deliveryRadiusKm })} />
      </Card>
      <Button title="Save shop profile" loading={saving} onPress={save} />
    </ScrollView>
  );
}

const profileStyles = StyleSheet.create({
  headerCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  logoLarge: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#DCFCE7', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  shopName: { flex: 1, color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaPill: { color: colors.primary, backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: '600' },
  section: { gap: 12 },
  logoPreview: { height: 132, borderRadius: 18, backgroundColor: '#ecfdf5', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  galleryRow: { flexDirection: 'row', gap: 10 },
  galleryTile: { flex: 1, minHeight: 76, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#BBF7D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4' },
  mapPreview: { minHeight: 78, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }
});
