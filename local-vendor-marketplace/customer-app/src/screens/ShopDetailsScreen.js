import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { productApi, shopApi } from '../api/services';
import {
  Card,
  CartPreviewBar,
  EmptyState,
  Loader,
  ProductListCard,
  ProductTraitBadge,
  QuantityStepper,
  SearchBar,
  SectionHeader,
  StatusBadge,
  styles
} from '../components/ui';
import { colors } from '../constants';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProductThumbnail } from '../utils/productImages';

const restaurantCategoryOrder = ['Starter', 'Main Course', 'Snacks', 'Drinks', 'Dessert'];
const groceryCategoryOrder = ['Rice', 'Oil', 'Snacks', 'Cold Drinks', 'Household', 'Personal Care', 'Other'];
const dishFilters = [
  { key: 'veg', label: 'Veg', icon: 'leaf-outline' },
  { key: 'nonVeg', label: 'Non-Veg', icon: 'restaurant-outline' },
  { key: 'rating', label: 'Rating 4.0+', icon: 'star' },
  { key: 'bestseller', label: 'Bestseller', icon: 'flame-outline' },
  { key: 'available', label: 'Available only', icon: 'checkmark-circle-outline' }
];

const getCategoryValue = (product) => product.foodCategory || product.groceryCategory || product.dairyBakeryType || product.businessType;

const getCategoryLabel = (category) => {
  if (category === 'Drinks') return 'Beverages';
  if (category === 'Dessert') return 'Desserts';
  if (category === 'Cold Drinks') return 'Beverages';
  if (category === 'Rice') return 'Staples';
  if (category === 'Oil') return 'Oils & Ghee';
  if (category === 'Household') return 'Cleaning';
  return category;
};

const getGroceryCategoryIcon = (category) => {
  const normalized = String(category || '').toLowerCase();
  if (normalized.includes('rice')) return 'nutrition-outline';
  if (normalized.includes('oil')) return 'water-outline';
  if (normalized.includes('snack')) return 'fast-food-outline';
  if (normalized.includes('drink')) return 'cafe-outline';
  if (normalized.includes('house') || normalized.includes('clean')) return 'sparkles-outline';
  if (normalized.includes('personal')) return 'body-outline';
  return 'basket-outline';
};

const getPackSize = (product) => product.quantity || product.packSize || product.unit || product.weight || product.size || '';

const isVegProduct = (product) => {
  const type = String(product?.vegType || '').toLowerCase();
  return type.includes('veg') && !type.includes('non');
};

const isNonVegProduct = (product) => String(product?.vegType || '').toLowerCase().includes('non');

const getRating = (product) => Number(product?.rating || product?.averageRating || product?.ratingsAverage || 0);

const isBestseller = (product) => Boolean(product?.isBestseller || product?.isFeatured || product?.featured);

const isAvailable = (product) => product?.status !== 'inactive' && product?.available !== false;

function ProductImage({ uri, icon = 'restaurant-outline', iconSize = 28 }) {
  const [failed, setFailed] = useState(false);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onError={() => {
          if (__DEV__) console.warn('Product image failed to load', uri);
          setFailed(true);
        }}
      />
    );
  }

  return <Ionicons name={icon} size={iconSize} color={colors.primary} />;
}

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const { addItem, items, subtotal, updateQuantity } = useCart();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [dishSearch, setDishSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const canOrder = Boolean(shop?.openStatus?.isOpenNow && !shop?.temporaryClosure?.enabled);
  const businessType = String(shop?.businessType || '').toLowerCase();
  const isRestaurant = businessType.includes('restaurant') || businessType.includes('food');
  const isGrocery = businessType.includes('grocery') || businessType.includes('kirana');
  const productCategories = useMemo(() => {
    const values = products
      .map(getCategoryValue)
      .filter(Boolean);
    const uniqueValues = Array.from(new Set(values));

    if (isRestaurant) {
      const orderedValues = restaurantCategoryOrder.filter((category) => uniqueValues.includes(category));
      const remainingValues = uniqueValues.filter((category) => !orderedValues.includes(category));
      return ['All', ...orderedValues, ...remainingValues];
    }

    if (isGrocery) {
      const orderedValues = groceryCategoryOrder.filter((category) => uniqueValues.includes(category));
      const remainingValues = uniqueValues.filter((category) => !orderedValues.includes(category));
      return ['All', ...orderedValues, ...remainingValues];
    }

    return ['All', ...uniqueValues];
  }, [isGrocery, isRestaurant, products]);
  const visibleProducts = useMemo(() => {
    const query = dishSearch.trim().toLowerCase();
    const filteredByCategory = activeCategory === 'All'
      ? products
      : products.filter((product) => [product.foodCategory, product.groceryCategory, product.dairyBakeryType, product.businessType].includes(activeCategory));

    return filteredByCategory.filter((product) => {
      const searchable = [
        product.name,
        product.brand,
        product.description,
        product.foodCategory,
        product.groceryCategory,
        product.dairyBakeryType,
        product.businessType
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesFilters = activeFilters.every((filter) => {
        if (filter === 'veg') return isVegProduct(product);
        if (filter === 'nonVeg') return isNonVegProduct(product);
        if (filter === 'rating') return getRating(product) >= 4 || getRating(product) === 0;
        if (filter === 'bestseller') return isBestseller(product);
        if (filter === 'available') return isAvailable(product);
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [activeCategory, activeFilters, dishSearch, products]);
  const recommendedProducts = useMemo(() => {
    const eligible = products.filter(isAvailable);
    const highlighted = eligible.filter((product) => isBestseller(product) || getRating(product) >= 4);
    return (highlighted.length > 0 ? highlighted : eligible).slice(0, 4);
  }, [products]);
  const groceryCategories = useMemo(() => productCategories.filter((category) => category !== 'All'), [productCategories]);
  const groceryListItems = useMemo(() => {
    if (!isGrocery || activeCategory !== 'All') return visibleProducts.map((product) => ({ type: 'product', product }));

    return groceryCategories.flatMap((category) => {
      const categoryProducts = visibleProducts.filter((product) => getCategoryValue(product) === category);
      if (categoryProducts.length === 0) return [];
      return [
        { type: 'header', id: `header-${category}`, title: getCategoryLabel(category) },
        ...categoryProducts.map((product) => ({ type: 'product', product }))
      ];
    });
  }, [activeCategory, groceryCategories, isGrocery, visibleProducts]);
  const cartQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const eta = shop?.deliverySettings?.estimatedDeliveryTime || '30-35 mins';
  const deliveryCharge = shop?.deliverySettings?.deliveryCharge ?? 0;
  const minimumOrder = shop?.deliverySettings?.minimumOrder ?? 0;
  const distance = shop?.distanceKm == null ? '0.8 km' : `${shop.distanceKm} km`;
  const closesAt = shop?.openStatus?.today?.closeTime || shop?.todayHours?.closeTime;
  const description = shop?.description || 'Fresh local products delivered to your doorstep.';
  const offer = shop?.offer || shop?.activeOffer || shop?.discountOffer;
  const offerTitle = typeof offer === 'string' ? offer : offer?.title || offer?.name || 'Shop offer available';
  const offerDescription = typeof offer === 'string' ? '' : offer?.description || offer?.condition || 'Check offer details before ordering.';
  const detailsBottomPadding = items.length > 0 ? Math.max(insets.bottom, 0) + 112 : 28;

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, productRes] = await Promise.all([shopApi.get(shopId), productApi.list({ shop: shopId })]);
        setShop(shopRes.data);
        setProducts(productRes.data);
      } catch (err) {
        showToast({ type: 'error', message: getApiError(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  useEffect(() => {
    if (!productCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, productCategories]);

  const addToCart = (product) => {
    if (!canOrder) {
      showToast({ type: 'warning', message: 'This shop is closed for orders.' });
      return false;
    }
    try {
      addItem(product);
      showToast({
        type: 'success',
        message: 'Added to cart',
        actionLabel: 'View Cart',
        onAction: () => navigation.navigate('Cart', { screen: 'CartMain' })
      });
      return true;
    } catch (err) {
      showToast({ type: 'error', message: err.message });
      return false;
    }
  };

  const toggleFilter = (filter) => {
    setActiveFilters((current) => (
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    ));
  };

  const openProduct = (product) => {
    if (isRestaurant) {
      setSelectedProduct(product);
      return;
    }

    navigation.navigate('ProductDetails', { productId: product._id });
  };

  const renderRestaurantProduct = ({ item: product }) => {
    const cartItem = items.find((item) => item._id === product._id);
    return (
      <ProductListCard
        product={product}
        disabled={!canOrder}
        quantity={cartItem?.quantity || 0}
        onMinus={() => updateQuantity(product._id, (cartItem?.quantity || 0) - 1)}
        onPlus={() => updateQuantity(product._id, (cartItem?.quantity || 0) + 1)}
        onPress={() => openProduct(product)}
        onAdd={() => addToCart(product)}
      />
    );
  };

  const renderRecommendedCard = ({ item: product }) => {
    const image = getProductThumbnail(product);
    const cartItem = items.find((item) => item._id === product._id);
    const unavailable = !canOrder || !isAvailable(product);

    return (
      <Pressable
        onPress={() => openProduct(product)}
        style={({ pressed }) => [styles.recommendedDishCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.recommendedImageWrap}>
          <ProductImage uri={image} />
          <View style={styles.vegMarker}>
            <View style={[styles.vegMarkerDot, isNonVegProduct(product) ? styles.nonVegMarkerDot : null]} />
          </View>
          {isBestseller(product) ? (
            <View style={styles.bestsellerBadge}>
              <Ionicons name="star" size={11} color={colors.primary} />
              <Text style={styles.bestsellerText}>Bestseller</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.recommendedBody}>
          <Text style={styles.recommendedTitle} numberOfLines={2}>{product.name}</Text>
          <View style={styles.productMetaRow}>
            <Text style={styles.muted} numberOfLines={1}>{getCategoryLabel(product.foodCategory || product.businessType || 'Menu')}</Text>
            <ProductTraitBadge product={product} />
          </View>
          <View style={styles.between}>
            <Text style={styles.price}>Rs.{product.price}</Text>
            {cartItem?.quantity > 0 ? (
              <QuantityStepper
                value={cartItem.quantity}
                onMinus={() => updateQuantity(product._id, cartItem.quantity - 1)}
                onPlus={() => updateQuantity(product._id, cartItem.quantity + 1)}
              />
            ) : (
              <Pressable onPress={() => addToCart(product)} disabled={unavailable} style={[styles.outlineAddButton, unavailable ? styles.disabled : null]}>
                <Text style={styles.outlineAddText}>ADD</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderQuickView = () => {
    if (!selectedProduct) return null;

    const image = getProductThumbnail(selectedProduct);
    const cartItem = items.find((item) => item._id === selectedProduct._id);
    const rating = getRating(selectedProduct);
    const unavailable = !canOrder || !isAvailable(selectedProduct);

    return (
      <Modal
        transparent
        visible
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.quickViewBackdrop}>
          <Pressable style={styles.quickViewBackdropPress} onPress={() => setSelectedProduct(null)} />
          <View style={[styles.quickViewSheet, { paddingBottom: Math.max(insets.bottom, 0) + 14 }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.quickViewContent}>
              <View style={image ? styles.quickViewImageWrap : styles.quickViewImageFallbackWrap}>
                <ProductImage uri={image} iconSize={42} />
                <Pressable onPress={() => setSelectedProduct(null)} hitSlop={10} style={styles.quickViewClose}>
                  <Ionicons name="close" size={20} color={colors.ink} />
                </Pressable>
                <View style={styles.vegMarker}>
                  <View style={[styles.vegMarkerDot, isNonVegProduct(selectedProduct) ? styles.nonVegMarkerDot : null]} />
                </View>
                {isBestseller(selectedProduct) ? (
                  <View style={styles.bestsellerBadge}>
                    <Ionicons name="star" size={11} color={colors.primary} />
                    <Text style={styles.bestsellerText}>Bestseller</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.quickViewBody}>
                <View style={styles.productMetaRow}>
                  <ProductTraitBadge product={selectedProduct} />
                  {rating > 0 ? (
                    <View style={styles.quickRatingBadge}>
                      <Ionicons name="star" size={12} color={colors.success} />
                      <Text style={styles.quickRatingText}>{rating.toFixed(1)}</Text>
                      {selectedProduct.ratingCount || selectedProduct.reviewsCount ? (
                        <Text style={styles.muted}>({selectedProduct.ratingCount || selectedProduct.reviewsCount})</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <Text style={styles.quickViewTitle} numberOfLines={2}>{selectedProduct.name}</Text>
                <Text style={styles.price}>Rs.{selectedProduct.price}</Text>
                {selectedProduct.description ? (
                  <Text style={styles.muted}>{selectedProduct.description}</Text>
                ) : (
                  <Text style={styles.muted}>{getCategoryLabel(selectedProduct.foodCategory || 'Restaurant item')}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.quickViewFooter}>
              {cartItem?.quantity > 0 ? (
                <View style={styles.quickInCartRow}>
                  <View>
                    <Text style={styles.title}>In cart</Text>
                    <Text style={styles.muted}>{cartItem.quantity} {cartItem.quantity === 1 ? 'item' : 'items'} added</Text>
                  </View>
                  <QuantityStepper
                    value={cartItem.quantity}
                    onMinus={() => updateQuantity(selectedProduct._id, cartItem.quantity - 1)}
                    onPlus={() => updateQuantity(selectedProduct._id, cartItem.quantity + 1)}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    if (addToCart(selectedProduct)) {
                      setSelectedProduct(null);
                    }
                  }}
                  disabled={unavailable}
                  style={[styles.quickAddButton, unavailable ? styles.disabled : null]}
                >
                  <Text style={styles.quickAddText}>Add to Cart</Text>
                  <Text style={styles.quickAddText}>Rs.{selectedProduct.price}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderGroceryTopPick = ({ item: product }) => {
    const image = getProductThumbnail(product);
    const cartItem = items.find((item) => item._id === product._id);
    const unavailable = !canOrder || !isAvailable(product);
    const packSize = getPackSize(product);

    return (
      <Pressable
        onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
        style={({ pressed }) => [styles.groceryTopCard, pressed ? styles.pressed : null]}
      >
        <View style={styles.groceryTopImage}>
          <ProductImage uri={image} icon="basket-outline" />
          {isBestseller(product) ? (
            <View style={styles.groceryOfferBadge}>
              <Text style={styles.groceryOfferText}>Top pick</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.groceryTopBody}>
          <Text style={styles.groceryBrand} numberOfLines={1}>{product.brand || getCategoryLabel(product.groceryCategory || 'Grocery')}</Text>
          <Text style={styles.groceryProductTitle} numberOfLines={2}>{product.name}</Text>
          {packSize ? <Text style={styles.productMeta} numberOfLines={1}>{packSize}</Text> : null}
          <View style={styles.between}>
            <Text style={styles.price}>Rs.{product.price}</Text>
            {cartItem?.quantity > 0 ? (
              <QuantityStepper
                value={cartItem.quantity}
                onMinus={() => updateQuantity(product._id, cartItem.quantity - 1)}
                onPlus={() => updateQuantity(product._id, cartItem.quantity + 1)}
              />
            ) : (
              <Pressable onPress={() => addToCart(product)} disabled={unavailable} style={[styles.outlineAddButton, unavailable ? styles.disabled : null]}>
                <Text style={styles.outlineAddText}>ADD</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderGroceryProduct = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.groceryGroupTitle}>{item.title}</Text>;
    }

    const product = item.product;
    const image = getProductThumbnail(product);
    const cartItem = items.find((cartProduct) => cartProduct._id === product._id);
    const unavailable = !canOrder || !isAvailable(product);
    const packSize = getPackSize(product);

    return (
      <Card style={styles.groceryListCard}>
        <Pressable onPress={() => navigation.navigate('ProductDetails', { productId: product._id })} style={styles.groceryListRow}>
          <View style={styles.groceryListImage}>
            <ProductImage uri={image} icon="basket-outline" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.groceryProductTitle} numberOfLines={2}>{product.name}</Text>
            {product.brand ? <Text style={styles.groceryBrand} numberOfLines={1}>{product.brand}</Text> : null}
            <Text style={styles.productMeta} numberOfLines={1}>{packSize || getCategoryLabel(product.groceryCategory || 'Grocery')}</Text>
            <View style={styles.productMetaRow}>
              <Text style={styles.price}>Rs.{product.price}</Text>
              <StatusBadge status={isAvailable(product) ? 'In stock' : 'Out of stock'} />
            </View>
          </View>
          <View style={styles.productListActions}>
            {cartItem?.quantity > 0 ? (
              <QuantityStepper
                value={cartItem.quantity}
                onMinus={() => updateQuantity(product._id, cartItem.quantity - 1)}
                onPlus={() => updateQuantity(product._id, cartItem.quantity + 1)}
              />
            ) : (
              <Pressable onPress={() => addToCart(product)} disabled={unavailable} style={[styles.addSmallButton, unavailable ? styles.disabled : null]}>
                <Text style={styles.addSmallText}>Add</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Card>
    );
  };

  const renderRestaurantHeader = () => (
    <View style={styles.shopDetailsHeaderBlock}>
      <View style={styles.shopDetailsTopBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.shopDetailsTitle} numberOfLines={1}>{shop?.name}</Text>
          <View style={styles.shopDetailsMeta}>
            <Ionicons name="time-outline" size={15} color={colors.muted} />
            <Text style={styles.shopDetailsMetaText}>{eta}</Text>
            <Text style={styles.shopMetaDot}>•</Text>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.shopDetailsMetaText}>{distance}</Text>
            <Text style={[styles.shopDetailsMetaText, { color: canOrder ? colors.success : colors.error }]}>
              {canOrder ? 'Open now' : 'Closed'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => showToast({ type: 'info', message: 'Use search below to find dishes.' })} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="search-outline" size={22} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => showToast({ type: 'info', message: 'More shop actions coming soon.' })} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <Card style={styles.restaurantInfoCard}>
        <View style={styles.restaurantInfoTop}>
          <View style={styles.restaurantLogo}>
            <ProductImage uri={shop?.logoUrl} icon="storefront-outline" iconSize={34} />
          </View>
          <View style={styles.flex}>
            <View style={styles.productMetaRow}>
              <View style={styles.restaurantRatingBadge}>
                <Text style={styles.restaurantRatingText}>4.5</Text>
                <Ionicons name="star" size={12} color="#fff" />
              </View>
              <Text style={styles.muted}>(125 ratings)</Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>{shop?.businessType || 'Restaurant'} • Indian, Chinese, Continental</Text>
            <Text style={styles.muted} numberOfLines={descriptionExpanded ? undefined : 2}>
              {description}
            </Text>
            {description.length > 82 ? (
              <Pressable onPress={() => setDescriptionExpanded((value) => !value)} hitSlop={8} style={styles.readMoreRow}>
                <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
                <Ionicons name={descriptionExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.restaurantMetrics}>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="bicycle-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={styles.restaurantMetricValue}>Rs.{deliveryCharge}</Text>
              <Text style={styles.restaurantMetricLabel}>Delivery fee</Text>
            </View>
          </View>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="bag-handle-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={styles.restaurantMetricValue}>Rs.{minimumOrder}</Text>
              <Text style={styles.restaurantMetricLabel}>Min. order</Text>
            </View>
          </View>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="storefront-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={[styles.restaurantMetricValue, { color: canOrder ? colors.success : colors.error }]}>{canOrder ? 'Open now' : 'Closed'}</Text>
              <Text style={styles.restaurantMetricLabel}>{closesAt ? `Closes ${closesAt}` : eta}</Text>
            </View>
          </View>
        </View>
        {!canOrder ? (
          <Text style={styles.closedNotice}>
            {shop?.temporaryClosure?.enabled ? 'This shop is temporarily closed.' : 'This shop is closed right now.'}
          </Text>
        ) : null}
      </Card>

      {offer ? (
        <Card style={styles.offerBanner}>
          <View style={styles.offerIcon}>
            <Ionicons name="pricetag" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.offerTitle}>{offerTitle}</Text>
            {offerDescription ? <Text style={styles.offerText}>{offerDescription}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Card>
      ) : null}

      <SearchBar
        value={dishSearch}
        onChangeText={setDishSearch}
        onClear={() => setDishSearch('')}
        onVoicePress={() => showToast({ type: 'info', message: 'Voice search is not available on this screen yet.' })}
        placeholder="Search for dishes"
      />

      <FlatList
        horizontal
        data={dishFilters}
        keyExtractor={(filter) => filter.key}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.dishFilterRow}
        renderItem={({ item: filter }) => {
          const active = activeFilters.includes(filter.key);
          return (
            <Pressable
              onPress={() => toggleFilter(filter.key)}
              style={[styles.dishFilterChip, active ? styles.dishFilterChipActive : null]}
            >
              <Ionicons name={filter.icon} size={16} color={active ? colors.primary : colors.muted} />
              <Text style={[styles.dishFilterText, active ? styles.dishFilterTextActive : null]}>{filter.label}</Text>
            </Pressable>
          );
        }}
      />

      {recommendedProducts.length > 0 ? (
        <View style={styles.shopDetailsSection}>
          <SectionHeader
            title={`Recommended (${recommendedProducts.length})`}
            action="View all"
            onAction={() => {
              setDishSearch('');
              setActiveFilters([]);
              setActiveCategory('All');
            }}
          />
          <View style={styles.recommendedGrid}>
            {recommendedProducts.map((product) => (
              <View key={`recommended-${product._id}`} style={styles.recommendedGridItem}>
                {renderRecommendedCard({ item: product })}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.shopDetailsSection}>
        <SectionHeader title="Menu" />
        {productCategories.length > 1 ? (
          <FlatList
            horizontal
            data={productCategories}
            keyExtractor={(category) => category}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.menuChipRow}
            renderItem={({ item: category }) => {
              const active = activeCategory === category;
              return (
                <Pressable onPress={() => setActiveCategory(category)} style={[styles.menuChip, active ? styles.menuChipActive : null]}>
                  <Text numberOfLines={1} style={[styles.menuChipText, active ? styles.menuChipTextActive : null]}>
                    {getCategoryLabel(category)}
                  </Text>
                </Pressable>
              );
            }}
          />
        ) : null}
      </View>
    </View>
  );

  const renderGroceryHeader = () => (
    <View style={styles.shopDetailsHeaderBlock}>
      <View style={styles.shopDetailsTopBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.shopDetailsTitle} numberOfLines={1}>{shop?.name}</Text>
          <View style={styles.shopDetailsMeta}>
            <Ionicons name="time-outline" size={15} color={colors.muted} />
            <Text style={styles.shopDetailsMetaText}>{eta}</Text>
            <Text style={styles.shopMetaDot}>|</Text>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.shopDetailsMetaText}>{distance}</Text>
            <Text style={[styles.shopDetailsMetaText, { color: canOrder ? colors.success : colors.error }]}>
              {canOrder ? 'Open now' : 'Closed'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => showToast({ type: 'info', message: 'Use search below to find products.' })} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="search-outline" size={22} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => showToast({ type: 'info', message: 'More shop actions coming soon.' })} hitSlop={10} style={styles.roundIconButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <Card style={styles.restaurantInfoCard}>
        <View style={styles.restaurantInfoTop}>
          <View style={styles.restaurantLogo}>
            <ProductImage uri={shop?.logoUrl} icon="storefront-outline" iconSize={34} />
          </View>
          <View style={styles.flex}>
            <View style={styles.productMetaRow}>
              <View style={styles.restaurantRatingBadge}>
                <Text style={styles.restaurantRatingText}>4.5</Text>
                <Ionicons name="star" size={12} color="#fff" />
              </View>
              <Text style={styles.muted}>(125 ratings)</Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>Grocery | Dairy | Household | Beverages</Text>
            <Text style={styles.muted} numberOfLines={descriptionExpanded ? undefined : 2}>
              {description}
            </Text>
            {description.length > 82 ? (
              <Pressable onPress={() => setDescriptionExpanded((value) => !value)} hitSlop={8} style={styles.readMoreRow}>
                <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
                <Ionicons name={descriptionExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.restaurantMetrics}>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="bicycle-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={styles.restaurantMetricValue}>Rs.{deliveryCharge}</Text>
              <Text style={styles.restaurantMetricLabel}>Delivery</Text>
            </View>
          </View>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="bag-handle-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={styles.restaurantMetricValue}>Rs.{minimumOrder}</Text>
              <Text style={styles.restaurantMetricLabel}>Min. order</Text>
            </View>
          </View>
          <View style={styles.restaurantMetric}>
            <View style={styles.metricIconBubble}><Ionicons name="timer-outline" size={19} color={colors.ink} /></View>
            <View>
              <Text style={styles.restaurantMetricValue}>{eta}</Text>
              <Text style={styles.restaurantMetricLabel}>{canOrder ? 'Open now' : 'Closed'}</Text>
            </View>
          </View>
        </View>
      </Card>

      {offer ? (
        <Card style={styles.offerBanner}>
          <View style={styles.offerIcon}>
            <Ionicons name="pricetag" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.offerTitle}>{offerTitle}</Text>
            {offerDescription ? <Text style={styles.offerText}>{offerDescription}</Text> : null}
          </View>
          <Text style={styles.link}>View offers</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Card>
      ) : null}

      <SearchBar
        value={dishSearch}
        onChangeText={setDishSearch}
        onClear={() => setDishSearch('')}
        onVoicePress={() => showToast({ type: 'info', message: 'Voice search is not available on this screen yet.' })}
        placeholder="Search for products"
      />

      {productCategories.length > 1 ? (
        <FlatList
          horizontal
          data={productCategories}
          keyExtractor={(category) => category}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.menuChipRow}
          renderItem={({ item: category }) => {
            const active = activeCategory === category;
            return (
              <Pressable onPress={() => setActiveCategory(category)} style={[styles.menuChip, active ? styles.menuChipActive : null]}>
                <Text numberOfLines={1} style={[styles.menuChipText, active ? styles.menuChipTextActive : null]}>
                  {getCategoryLabel(category)}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}

      {recommendedProducts.length > 0 ? (
        <View style={styles.shopDetailsSection}>
          <SectionHeader
            title="Top Picks for You"
            action="View all"
            onAction={() => {
              setDishSearch('');
              setActiveCategory('All');
            }}
          />
          <FlatList
            horizontal
            data={recommendedProducts}
            keyExtractor={(product) => `grocery-top-${product._id}`}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.groceryTopRail}
            renderItem={renderGroceryTopPick}
          />
        </View>
      ) : null}

      {groceryCategories.length > 0 ? (
        <View style={styles.shopDetailsSection}>
          <SectionHeader title="Shop by Category" />
          <View style={styles.groceryCategoryGrid}>
            {groceryCategories.slice(0, 8).map((category) => (
              <Pressable key={category} onPress={() => setActiveCategory(category)} style={styles.groceryCategoryTile}>
                <View style={styles.groceryCategoryIcon}>
                  <Ionicons name={getGroceryCategoryIcon(category)} size={24} color={colors.primary} />
                </View>
                <Text style={styles.groceryCategoryText} numberOfLines={2}>{getCategoryLabel(category)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title={activeCategory === 'All' ? 'All Products' : getCategoryLabel(activeCategory)} />
    </View>
  );

  const renderHeader = () => (
    <View style={{ gap: 14 }}>
        <Card style={[styles.hero, { gap: 12 }]}>
          <View style={{ height: 150, borderRadius: 16, backgroundColor: '#ede9fe', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {shop?.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Ionicons name="storefront-outline" size={42} color={colors.primary} />}
          </View>
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text style={styles.heading}>{shop?.name}</Text>
              <Text style={styles.muted}>{shop?.businessType}</Text>
            </View>
            <StatusBadge status={canOrder ? 'Open Now' : 'Closed'} />
          </View>
          <Text style={styles.muted}>{shop?.description || 'Local shop'}</Text>
          <View style={styles.metaPills}>
            <Text style={styles.pill}>ETA {shop?.deliverySettings?.estimatedDeliveryTime || '30 Minutes'}</Text>
            <Text style={styles.pill}>Delivery Rs.{shop?.deliverySettings?.deliveryCharge || 0}</Text>
            <Text style={styles.pill}>Min Rs.{shop?.deliverySettings?.minimumOrder || 0}</Text>
          </View>
          {!canOrder ? (
            <Text style={{ color: colors.warning, fontWeight: '600' }}>
              {shop?.temporaryClosure?.enabled ? 'This shop is temporarily closed.' : 'This shop is closed right now.'}
            </Text>
          ) : null}
        </Card>

        <SectionHeader title="Products" />
        {productCategories.length > 1 ? (
          <FlatList
            horizontal
            data={productCategories}
            keyExtractor={(category) => category}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            renderItem={({ item: category }) => (
              <Pressable
                onPress={() => setActiveCategory(category)}
                style={{
                  minHeight: 38,
                  maxWidth: 170,
                  paddingHorizontal: 13,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeCategory === category ? colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: activeCategory === category ? colors.primary : colors.border
                }}
              >
                <Text numberOfLines={1} style={{ color: activeCategory === category ? '#fff' : colors.ink, fontWeight: '600', fontSize: 12 }}>{category}</Text>
              </Pressable>
            )}
          />
        ) : null}
      </View>
  );

  if (loading) return <Loader />;

  if (isRestaurant) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <FlatList
          style={styles.screen}
          contentContainerStyle={[styles.content, styles.restaurantContent, { paddingBottom: detailsBottomPadding }]}
          data={visibleProducts}
          keyExtractor={(product) => product._id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderRestaurantHeader}
          ListEmptyComponent={<EmptyState title="No dishes found" message="Try another dish name, category or filter." />}
          renderItem={renderRestaurantProduct}
        />
        {items.length > 0 ? (
          <CartPreviewBar
            items={items}
            quantity={cartQuantity}
            subtotal={subtotal}
            onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })}
          />
        ) : null}
        {renderQuickView()}
      </SafeAreaView>
    );
  }

  if (isGrocery) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <FlatList
          style={styles.screen}
          contentContainerStyle={[styles.content, styles.restaurantContent, { paddingBottom: detailsBottomPadding }]}
          data={groceryListItems}
          keyExtractor={(item) => item.type === 'header' ? item.id : item.product._id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderGroceryHeader}
          ListEmptyComponent={<EmptyState title="No products found" message="Try another product name, brand, or category." />}
          renderItem={renderGroceryProduct}
        />
        {items.length > 0 ? (
          <CartPreviewBar
            items={items}
            quantity={cartQuantity}
            subtotal={subtotal}
            onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })}
          />
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.screenHeader}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Shop Details</Text>
      </View>

      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: detailsBottomPadding }]}
        data={visibleProducts}
        keyExtractor={(product) => product._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState title="No products" message="This shop has not added products for this category yet." />}
        renderItem={({ item: product }) => {
          const cartItem = items.find((item) => item._id === product._id);
          return (
            <ProductListCard
              product={product}
              disabled={!canOrder}
              quantity={cartItem?.quantity || 0}
              onMinus={() => updateQuantity(product._id, (cartItem?.quantity || 0) - 1)}
              onPlus={() => updateQuantity(product._id, (cartItem?.quantity || 0) + 1)}
              onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
              onAdd={() => addToCart(product)}
            />
          );
        }}
      />
      {items.length > 0 ? (
        <CartPreviewBar
          items={items}
          quantity={cartQuantity}
          subtotal={subtotal}
          onPress={() => navigation.navigate('Cart', { screen: 'CartMain' })}
        />
      ) : null}
    </SafeAreaView>
  );
}
