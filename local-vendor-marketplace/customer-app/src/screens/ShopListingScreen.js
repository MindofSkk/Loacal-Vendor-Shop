import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import { EmptyState, Loader, ProductListCard, SearchBar, ShopCard, styles } from '../components/ui';
import { colors } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const twemoji = (code) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`;

const searchModes = [
  {
    key: 'food',
    label: 'Restaurant',
    image: twemoji('1f354'),
    businessType: 'Restaurant',
    placeholder: 'Search for biryani, pizza, burger...',
    title: 'Nearby Restaurants',
    emptyTitle: 'No restaurants found',
    shopTabLabel: 'Restaurants',
    itemTabLabel: 'Dishes',
    itemEmptyTitle: 'No matching dishes found'
  },
  {
    key: 'grocery',
    label: 'Grocery',
    image: twemoji('1f9fa'),
    businessType: 'Grocery / Kirana Store',
    placeholder: 'Search for atta, haldi, oil, rice...',
    title: 'Nearby Grocery Shops',
    emptyTitle: 'No grocery shops found',
    shopTabLabel: 'Shops',
    itemTabLabel: 'Items',
    itemEmptyTitle: 'No matching grocery items found'
  },
  {
    key: 'dairy',
    label: 'Dairy',
    image: twemoji('1f95b'),
    businessType: 'Dairy and Bakery',
    placeholder: 'Search for milk, curd, bread, cake...',
    title: 'Nearby Dairy & Bakery Shops',
    emptyTitle: 'No dairy or bakery shops found',
    shopTabLabel: 'Stores',
    itemTabLabel: 'Items',
    itemEmptyTitle: 'No matching dairy or bakery items found'
  }
];

const filters = [
  { key: 'open', label: 'Open Now' },
  { key: 'rating', label: 'Rating 4+' },
  { key: 'delivery', label: 'Fast Delivery' },
  { key: 'sort', label: 'Sort' }
];

const getProductShopId = (product) => (typeof product?.shop === 'string' ? product.shop : product?.shop?._id);

const isRestaurantProduct = (product) => {
  const businessType = String(product?.businessType || product?.shop?.businessType || '').toLowerCase();
  return businessType.includes('restaurant') || businessType.includes('food');
};

export default function ShopListingScreen({ navigation }) {
  const { showToast } = useToast();
  const { addItem } = useCart();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeMode, setActiveMode] = useState('grocery');
  const [resultTab, setResultTab] = useState('shops');
  const [activeFilters, setActiveFilters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeConfig = useMemo(() => searchModes.find((mode) => mode.key === activeMode) || searchModes[0], [activeMode]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [shopRes, productRes] = await Promise.all([shopApi.list({}), productApi.list({})]);
      setShops(shopRes.data);
      setProducts(productRes.data);
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

  const selectMode = (modeKey) => {
    setActiveMode(modeKey);
    setResultTab('shops');
    setSearch('');
    setActiveFilters([]);
  };

  const toggleFilter = (filterKey) => {
    setActiveFilters((current) =>
      current.includes(filterKey) ? current.filter((item) => item !== filterKey) : [...current, filterKey]
    );
  };

  const addToCart = (product) => {
    try {
      addItem(product);
      showToast({
        type: 'success',
        message: 'Added to cart',
        actionLabel: 'View Cart',
        onAction: () => navigation.navigate('Cart', { screen: 'CartMain' })
      });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const openProduct = (product) => {
    if (isRestaurantProduct(product)) {
      const productShopId = getProductShopId(product);

      if (!productShopId) {
        showToast({ type: 'warning', message: 'Open the restaurant first to view this dish.' });
        return;
      }

      navigation.navigate('Home', {
        screen: 'ShopDetails',
        params: {
          shopId: productShopId,
          quickProductId: product._id
        }
      });
      return;
    }

    navigation.navigate('Home', { screen: 'ProductDetails', params: { productId: product._id } });
  };

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => product.businessType === activeConfig.businessType)
      .filter((product) => {
        if (!activeFilters.includes('open')) return true;
        return product.shop?.openStatus?.isOpenNow && !product.shop?.temporaryClosure?.enabled;
      })
      .filter((product) => {
        if (!query) return true;
        return `${product.name || ''} ${product.brand || ''} ${product.description || ''} ${product.foodCategory || ''} ${product.groceryCategory || ''} ${product.dairyBakeryType || ''} ${product.shop?.name || ''}`
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => {
        if (!activeFilters.includes('sort')) return 0;
        return String(first.name || '').localeCompare(String(second.name || ''));
      });
  }, [activeConfig.businessType, activeFilters, products, search]);

  const visibleShops = useMemo(() => {
    const query = search.trim().toLowerCase();
    const productShopIds = new Set(
      visibleProducts
        .map((product) => (typeof product.shop === 'string' ? product.shop : product.shop?._id))
        .filter(Boolean)
    );

    return shops
      .filter((shop) => shop.businessType === activeConfig.businessType)
      .filter((shop) => {
        if (!activeFilters.includes('open')) return true;
        return shop.openStatus?.isOpenNow && !shop.temporaryClosure?.enabled;
      })
      .filter((shop) => {
        if (!query) return true;
        const shopTextMatches = `${shop.name || ''} ${shop.businessType || ''} ${shop.location?.area || ''} ${shop.location?.city || ''}`.toLowerCase().includes(query);
        return shopTextMatches || productShopIds.has(shop._id);
      })
      .sort((first, second) => {
        if (!activeFilters.includes('sort')) return 0;
        return String(first.name || '').localeCompare(String(second.name || ''));
      });
  }, [activeConfig.businessType, activeFilters, search, shops, visibleProducts]);

  if (loading) return <Loader />;

  const header = (
    <View style={styles.searchHeader}>
      <View style={styles.between}>
        <View style={[styles.row, { flex: 1 }]}>
          <Pressable onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })} hitSlop={10} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.searchTitle}>Search</Text>
            <Text style={styles.muted} numberOfLines={1}>nagri, Ranchi, 835303</Text>
          </View>
        </View>
      </View>

      <View style={styles.modeTabs}>
        {searchModes.map((mode) => {
          const active = activeMode === mode.key;
          return (
            <Pressable key={mode.key} onPress={() => selectMode(mode.key)} style={({ pressed }) => [styles.modeTab, active ? styles.modeTabActive : null, pressed ? styles.pressed : null]}>
              <Image source={{ uri: mode.image }} style={styles.modeTabImage} />
              <Text style={[styles.modeTabText, active ? styles.modeTabTextActive : null]} numberOfLines={1}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        onVoicePress={() => showToast({ type: 'info', message: 'Keyboard opened. Tap the keyboard mic and speak to search.' })}
        placeholder={activeConfig.placeholder}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
        {filters.map((filter) => {
          const active = activeFilters.includes(filter.key);
          return (
            <Pressable key={filter.key} onPress={() => toggleFilter(filter.key)} style={({ pressed }) => [styles.filterChip, active ? styles.filterChipActive : null, pressed ? styles.pressed : null]}>
              <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultTabs}>
        {[
          { key: 'shops', label: activeConfig.shopTabLabel, count: visibleShops.length },
          { key: 'items', label: activeConfig.itemTabLabel, count: visibleProducts.length }
        ].map((tab) => {
          const active = resultTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setResultTab(tab.key)} style={({ pressed }) => [styles.resultTab, active ? styles.resultTabActive : null, pressed ? styles.pressed : null]}>
              <Text style={[styles.resultTabText, active ? styles.resultTabTextActive : null]}>{tab.label}</Text>
              <Text style={[styles.resultTabCount, active ? styles.resultTabCountActive : null]}>{tab.count}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.between}>
        <Text style={styles.subheading}>{resultTab === 'shops' ? activeConfig.title : activeConfig.itemTabLabel}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{resultTab === 'shops' ? visibleShops.length : visibleProducts.length} found</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          style={styles.screen}
          contentContainerStyle={[styles.content, { paddingBottom: 96 }]}
          data={resultTab === 'shops' ? visibleShops : visibleProducts}
          keyExtractor={(item) => `${resultTab}-${item._id}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title={resultTab === 'shops' ? activeConfig.emptyTitle : activeConfig.itemEmptyTitle} message="Try another keyword or change filters." />}
          renderItem={({ item }) =>
            resultTab === 'shops' ? (
              <ShopCard shop={item} onPress={() => navigation.navigate('Home', { screen: 'ShopDetails', params: { shopId: item._id } })} />
            ) : (
              <ProductListCard
                product={item}
                onPress={() => openProduct(item)}
                onAdd={() => addToCart(item)}
              />
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
