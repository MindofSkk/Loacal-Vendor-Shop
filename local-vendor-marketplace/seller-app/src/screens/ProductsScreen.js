import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { Button, ConfirmDialog, EmptyState, Loader, ProductRow, SearchBar, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';
import { useToast } from '../context/ToastContext';

const tabs = ['All', 'Available', 'Out of Stock', 'Veg', 'Non Veg', 'Newest'];

export default function ProductsScreen({ navigation }) {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
      showToast({ type: 'error', message: getApiError(err) });
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
    let byTab = products;
    if (activeTab === 'Available') byTab = products.filter((product) => product.status !== 'inactive');
    if (activeTab === 'Out of Stock') byTab = products.filter((product) => product.status === 'inactive' || Number(product.stock || 0) === 0);
    if (activeTab === 'Veg') byTab = products.filter((product) => String(product.vegType || '').toLowerCase().includes('veg') && !String(product.vegType || '').toLowerCase().includes('non'));
    if (activeTab === 'Non Veg') byTab = products.filter((product) => String(product.vegType || '').toLowerCase().includes('non'));
    if (activeTab === 'Newest') byTab = [...products].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
    const query = search.trim().toLowerCase();
    if (!query) return byTab;
    return byTab.filter((product) => `${product.name || ''} ${product.brand || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''} ${product.dairyBakeryType || ''} ${product.price || ''}`.toLowerCase().includes(query));
  }, [activeTab, products, search]);

  const remove = async (product) => {
    setDeleteLoading(true);
    try {
      await productApi.remove(product._id);
      showToast({ type: 'success', message: 'Product deleted.' });
      setPendingDelete(null);
      load();
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loader />;

  const header = (
    <View style={{ gap: 14 }}>
      <SectionHeader title="Products" />
      <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="Search products..." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              minHeight: 38,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 13,
              backgroundColor: activeTab === tab ? colors.primary : '#fff',
              borderWidth: 1,
              borderColor: activeTab === tab ? colors.primary : colors.border
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : colors.ink, fontWeight: '600', fontSize: 12 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <Button title="+ Add Product" disabled={!shop} onPress={() => navigation.navigate('ProductForm', { shop })} />
      {!shop ? <EmptyState title="Shop required" message="Create your shop profile before adding products." /> : null}
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        data={shop ? filteredProducts : []}
        keyExtractor={(product) => product._id}
        ListHeaderComponent={header}
        ListEmptyComponent={shop ? <EmptyState title="No products" message="Products for this filter will appear here." /> : null}
        renderItem={({ item: product }) => (
          <ProductRow
            product={product}
            onEdit={() => navigation.navigate('ProductForm', { shop, product })}
            onDuplicate={() => showToast({ type: 'info', message: 'Duplicate product is coming soon.' })}
            onDelete={() => setPendingDelete(product)}
          />
        )}
      />
      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Delete product?"
        message={`${pendingDelete?.name || 'This product'} will be removed from your shop.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove(pendingDelete)}
      />
    </>
  );
}
