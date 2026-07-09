import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, EmptyState, Loader, ProductRow, styles } from '../components/ui';

export default function ProductsScreen({ navigation }) {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopRes, productRes] = await Promise.all([
        shopApi.myShop().catch((err) => (err.response?.status === 404 ? { data: null } : Promise.reject(err))),
        productApi.sellerList()
      ]);
      setShop(shopRes.data);
      setProducts(productRes.data);
    } catch (err) {
      Alert.alert('Unable to load products', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const remove = async (product) => {
    try {
      await productApi.remove(product._id);
      load();
    } catch (err) {
      Alert.alert('Delete failed', getApiError(err));
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.heading}>Products</Text>
      <Button title="Add product" disabled={!shop} onPress={() => navigation.navigate('ProductForm', { shop })} />
      {!shop ? <EmptyState title="Shop required" message="Create your shop profile before adding products." /> : null}
      {products.length === 0 ? <EmptyState title="No products yet" message="Your listed products will appear here." /> : null}
      {products.map((product) => (
        <ProductRow
          key={product._id}
          product={product}
          onEdit={() => navigation.navigate('ProductForm', { shop, product })}
          onDelete={() => remove(product)}
        />
      ))}
    </ScrollView>
  );
}
