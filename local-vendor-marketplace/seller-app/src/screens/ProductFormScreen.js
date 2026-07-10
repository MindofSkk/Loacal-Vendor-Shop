import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { Button, Card, Input, OptionRow, styles } from '../components/ui';
import { foodCategories, groceryCategories } from '../constants';
import { useToast } from '../context/ToastContext';
import { getProductImages } from '../utils/productImages';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  status: 'active',
  brand: '',
  packSize: '',
  vegType: 'Veg',
  foodCategory: 'Snacks',
  groceryCategory: 'Other',
  dairyBakeryType: 'Dairy',
  freshStockToday: true
};

export default function ProductFormScreen({ route, navigation }) {
  const { showToast } = useToast();
  const { shop, product } = route.params || {};
  const businessType = shop?.businessType || product?.businessType || 'Restaurant';
  const [images, setImages] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(String(Math.min(Number(product?.thumbnailIndex || 0), 2)));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const existingImages = getProductImages(product);
  const thumbnailOptions = images.length
    ? images.map((asset, index) => ({ index, uri: asset.uri, label: `New image ${index + 1}` }))
    : existingImages.map((uri, index) => ({ index, uri, label: `Image ${index + 1}` }));
  const [form, setForm] = useState({
    ...emptyForm,
    ...product,
    price: product?.price == null ? '' : String(product.price),
    stock: product?.stock == null ? '' : String(product.stock),
    freshStockToday: product?.freshStockToday == null ? true : Boolean(product.freshStockToday)
  });

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      showToast({ type: 'warning', message: 'Photo permission is required to upload product images.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.8
    });
    if (!result.canceled) {
      const nextImages = result.assets.slice(0, 3);
      setImages(nextImages);
      setThumbnailIndex('0');
      if (result.assets.length > 3) {
        showToast({ type: 'warning', message: 'Only first 3 images will be used.' });
      }
    }
  };

  const appendImages = (formData) => {
    images.forEach((image, index) => {
      const uriParts = image.uri.split('.');
      const extension = uriParts[uriParts.length - 1] || 'jpg';
      formData.append('images', {
        uri: image.uri,
        name: `product-${index + 1}.${extension}`,
        type: image.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`
      });
    });
  };

  const save = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Product name is required.';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Enter a valid price.';
    if (businessType === 'Grocery / Kirana Store' && (!form.stock || Number(form.stock) < 0)) nextErrors.stock = 'Enter valid stock quantity.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const formData = new FormData();
      const excludedFields = new Set(['_id', 'id', '__v', 'images', 'thumbnailImage', 'shop', 'seller', 'category', 'businessType', 'createdAt', 'updatedAt', 'isAvailable']);
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'stock' && businessType !== 'Grocery / Kirana Store') {
          return;
        }
        if (value !== '' && value != null && !excludedFields.has(key)) {
          formData.append(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value));
        }
      });
      formData.append('thumbnailIndex', thumbnailIndex);
      appendImages(formData);

      if (product?._id) {
        await productApi.update(product._id, formData);
      } else {
        await productApi.create(formData);
      }
      showToast({ type: 'success', message: product?._id ? 'Product updated.' : 'Product added.' });
      navigation.goBack();
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={[styles.hero, { gap: 8 }]}>
        <Text style={styles.subheading}>{product?._id ? 'Edit product' : 'Add product'}</Text>
        <Text style={styles.muted}>{businessType}</Text>
      </Card>
      <Card style={{ gap: 12 }}>
        <Input label={businessType === 'Restaurant' ? 'Item name' : 'Product name'} value={form.name} error={errors.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Description" multiline value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
        <Input label="Price" keyboardType="numeric" value={form.price} error={errors.price} onChangeText={(price) => setForm({ ...form, price })} />

        {businessType === 'Restaurant' ? (
          <>
            <Text style={styles.label}>Veg / Non-Veg</Text>
            <OptionRow options={['Veg', 'Non-Veg']} value={form.vegType} onChange={(vegType) => setForm({ ...form, vegType })} />
            <Text style={styles.label}>Food category</Text>
            <OptionRow options={foodCategories} value={form.foodCategory} onChange={(foodCategory) => setForm({ ...form, foodCategory })} />
          </>
        ) : null}

        {businessType === 'Grocery / Kirana Store' ? (
          <>
            <Input label="Brand" value={form.brand} onChangeText={(brand) => setForm({ ...form, brand })} />
            <Input label="Quantity / Pack size" value={form.packSize} onChangeText={(packSize) => setForm({ ...form, packSize })} />
            <Input label="Stock quantity" keyboardType="number-pad" value={form.stock} error={errors.stock} onChangeText={(stock) => setForm({ ...form, stock })} />
            <Text style={styles.label}>Category</Text>
            <OptionRow options={groceryCategories} value={form.groceryCategory} onChange={(groceryCategory) => setForm({ ...form, groceryCategory })} />
          </>
        ) : null}

        {businessType === 'Dairy and Bakery' ? (
          <>
            <Text style={styles.label}>Type</Text>
            <OptionRow options={['Dairy', 'Bakery']} value={form.dairyBakeryType} onChange={(dairyBakeryType) => setForm({ ...form, dairyBakeryType })} />
            <Input label="Quantity / Pack size" value={form.packSize} onChangeText={(packSize) => setForm({ ...form, packSize })} />
            <Text style={styles.label}>Fresh stock today</Text>
            <OptionRow
              options={[true, false]}
              value={form.freshStockToday}
              getLabel={(value) => (value ? 'Yes' : 'No')}
              onChange={(freshStockToday) => setForm({ ...form, freshStockToday })}
            />
          </>
        ) : null}

        <Text style={styles.label}>Availability</Text>
        <OptionRow options={['active', 'inactive']} value={form.status} onChange={(status) => setForm({ ...form, status })} />
        {thumbnailOptions.length ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.label}>Thumbnail image</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {thumbnailOptions.slice(0, 3).map((option) => (
                <Pressable
                  key={`${option.label}-${option.index}`}
                  onPress={() => setThumbnailIndex(String(option.index))}
                  style={{
                    width: 82,
                    gap: 6,
                    borderWidth: 2,
                    borderColor: String(thumbnailIndex) === String(option.index) ? '#049B4F' : '#E5E7EB',
                    borderRadius: 16,
                    padding: 6
                  }}
                >
                  <Image source={{ uri: option.uri }} style={{ height: 64, borderRadius: 12 }} />
                  <Text style={styles.small} numberOfLines={1}>{String(thumbnailIndex) === String(option.index) ? 'Thumbnail' : option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.row}>
          <Button title="Pick images" variant="secondary" onPress={pickImages} style={styles.flex} />
          <Button title="Save" loading={saving} onPress={save} style={styles.flex} />
        </View>
      </Card>
    </ScrollView>
  );
}
