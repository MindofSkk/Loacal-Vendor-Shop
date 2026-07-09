import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { productApi } from '../api/services';
import { Button, Card, Input, OptionRow, styles } from '../components/ui';
import { foodCategories, groceryCategories } from '../constants';

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
  const { shop, product } = route.params || {};
  const businessType = shop?.businessType || product?.businessType || 'Restaurant';
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    ...emptyForm,
    ...product,
    price: product?.price == null ? '' : String(product.price),
    stock: product?.stock == null ? '' : String(product.stock),
    freshStockToday: product?.freshStockToday == null ? true : Boolean(product.freshStockToday)
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const appendImage = (formData) => {
    if (!image) return;
    const uriParts = image.uri.split('.');
    const extension = uriParts[uriParts.length - 1] || 'jpg';
    formData.append('images', {
      uri: image.uri,
      name: `product.${extension}`,
      type: image.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`
    });
  };

  const save = async () => {
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'stock' && businessType !== 'Grocery / Kirana Store') {
          return;
        }
        if (value !== '' && value != null && key !== '_id' && key !== 'images' && key !== 'shop') {
          formData.append(key, String(value));
        }
      });
      appendImage(formData);

      if (product?._id) {
        await productApi.update(product._id, formData);
      } else {
        await productApi.create(formData);
      }
      Alert.alert('Saved', product?._id ? 'Product updated.' : 'Product added.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', getApiError(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>{product?._id ? 'Edit product' : 'Add product'}</Text>
        <Text style={styles.muted}>{businessType}</Text>
        <Input label={businessType === 'Restaurant' ? 'Item name' : 'Product name'} value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Description" multiline value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
        <Input label="Price" keyboardType="numeric" value={form.price} onChangeText={(price) => setForm({ ...form, price })} />

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
            <Input label="Stock quantity" keyboardType="number-pad" value={form.stock} onChangeText={(stock) => setForm({ ...form, stock })} />
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
        {image ? <Image source={{ uri: image.uri }} style={{ height: 180, borderRadius: 16 }} /> : null}
        <View style={styles.row}>
          <Button title="Pick image" variant="secondary" onPress={pickImage} style={styles.flex} />
          <Button title="Save" onPress={save} style={styles.flex} />
        </View>
      </Card>
    </ScrollView>
  );
}
