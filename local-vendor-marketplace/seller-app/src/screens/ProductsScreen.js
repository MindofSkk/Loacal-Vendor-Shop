import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, EmptyState, Loader, ProductRow, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';

const tabs = ['All', 'Active', 'Inactive'];

export default function ProductsScreen({ navigation }) {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
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

  const filteredProducts = useMemo(() => {
    if (activeTab === 'All') return products;
    if (activeTab === 'Active') return products.filter((product) => product.status !== 'inactive');
    return products.filter((product) => product.status === 'inactive');
  }, [activeTab, products]);

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
      <SectionHeader title="Products" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeTab === tab ? colors.primary : '#fff',
              borderWidth: 1,
              borderColor: activeTab === tab ? colors.primary : colors.border
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : colors.ink, fontWeight: '900', fontSize: 12 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <Button title="+ Add Product" disabled={!shop} onPress={() => navigation.navigate('ProductForm', { shop })} />
      {!shop ? <EmptyState title="Shop required" message="Create your shop profile before adding products." /> : null}
      {shop && filteredProducts.length === 0 ? <EmptyState title="No products" message="Products for this filter will appear here." /> : null}
      {filteredProducts.map((product) => (
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
