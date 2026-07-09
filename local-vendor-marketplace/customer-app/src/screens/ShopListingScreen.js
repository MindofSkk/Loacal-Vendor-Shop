import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { shopApi } from '../api/services';
import { EmptyState, Loader, SearchBar, ShopCard, StatusBadge, styles } from '../components/ui';
import { categories, colors } from '../constants';
import { useToast } from '../context/ToastContext';

const filters = ['Sort', 'Open Now', 'Rating 4+', 'Filter'];

export default function ShopListingScreen({ navigation }) {
  const { showToast } = useToast();
  const [shops, setShops] = useState([]);
  const [category, setCategory] = useState('Grocery / Kirana Store');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await shopApi.list({});
      setShops(data);
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleShops = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shops
      .filter((shop) => (category ? shop.businessType === category : true))
      .filter((shop) => {
        if (!query) return true;
        return `${shop.name || ''} ${shop.businessType || ''} ${shop.location?.area || ''} ${shop.location?.city || ''}`.toLowerCase().includes(query);
      });
  }, [category, search, shops]);

  if (loading) return <Loader />;

  const header = (
    <View style={{ gap: 14 }}>
      <View style={styles.between}>
        <View style={[styles.row, { flex: 1 }]}>
          <Pressable onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.subheading}>{category.replace(' Store', '')}</Text>
            <Text style={styles.muted} numberOfLines={1}>nagri, Ranchi, 835303</Text>
          </View>
        </View>
        <Ionicons name="share-social-outline" size={21} color={colors.ink} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder={`Search in ${category.replace(' Store', '')}...`} />
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setCategory(item)}
            style={{
              minHeight: 38,
              maxWidth: 165,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: category === item ? colors.primary : colors.border,
              backgroundColor: category === item ? colors.primary : '#fff',
              justifyContent: 'center'
            }}
          >
            <Text numberOfLines={1} style={{ color: category === item ? '#fff' : colors.ink, fontWeight: '900', fontSize: 12 }}>{item.replace(' Store', '')}</Text>
          </Pressable>
        )}
      />
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        renderItem={({ item: filter }) => (
          <Pressable style={{ minHeight: 36, borderRadius: 999, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', justifyContent: 'center' }}>
            <Text numberOfLines={1} style={{ color: colors.ink, fontWeight: '800', fontSize: 11 }}>{filter}</Text>
          </Pressable>
        )}
      />
      <View style={styles.between}>
        <Text style={styles.subheading}>Nearby shops</Text>
        <StatusBadge status={`${visibleShops.length} found`} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          style={styles.screen}
          contentContainerStyle={[styles.content, { paddingBottom: 116 }]}
          data={visibleShops}
          keyExtractor={(shop) => shop._id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No shops found" message="Try another category or search term." />}
          renderItem={({ item }) => <ShopCard shop={item} onPress={() => navigation.navigate('Home', { screen: 'ShopDetails', params: { shopId: item._id } })} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
