import { useRef } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants';
import { getProductThumbnail } from '../utils/productImages';

const radius = {
  sm: 12,
  md: 16,
  lg: 22
};

export function ScreenWrapper({ children, style }) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }) {
  const isDisabled = Boolean(disabled || loading);
  const label = title == null ? '' : String(title);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : null,
        variant === 'danger' ? styles.dangerButton : null,
        variant === 'outlineDanger' ? styles.outlineDangerButton : null,
        variant === 'ghost' ? styles.ghostButton : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'outlineDanger' || variant === 'ghost' ? colors.primary : '#fff'} /> : null}
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' || variant === 'ghost' ? styles.secondaryButtonText : null,
          variant === 'outlineDanger' ? styles.outlineDangerText : null
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Input({ label, multiline, style, secureTextEntry, editable, autoFocus, leftText, rightElement, error, helper, ...props }) {
  const isMultiline = Boolean(multiline);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, isMultiline ? styles.textAreaShell : null, error ? styles.inputError : null]}>
        {leftText ? <Text style={styles.inputIcon}>{leftText}</Text> : null}
        <TextInput
          {...props}
          placeholderTextColor="#94a3b8"
          multiline={isMultiline}
          secureTextEntry={Boolean(secureTextEntry)}
          editable={editable == null ? true : Boolean(editable)}
          autoFocus={Boolean(autoFocus)}
          style={[styles.input, isMultiline ? styles.textArea : null, props.style]}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppHeader({ title, subtitle, right }) {
  return (
    <View style={styles.appHeader}>
      <View style={styles.flex}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function CompactLocationHeader({ greeting = 'Hello!', addressText, loading, onPressLocation }) {
  return (
    <View style={styles.homeHeader}>
      <View style={styles.flex}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Pressable onPress={onPressLocation} style={styles.locationRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {loading ? 'Getting location...' : addressText || 'Select location'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.smallIconButton}>
          <Ionicons name="notifications-outline" size={22} color={colors.ink} />
        </View>
        <View style={[styles.smallIconButton, { backgroundColor: '#EDE9FE' }]}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

export function SearchBar({ value, onChangeText, onClear, onVoicePress, placeholder = 'Search for shops or products...' }) {
  const inputRef = useRef(null);
  const handleVoicePress = () => {
    inputRef.current?.focus();
    onVoicePress?.();
  };

  return (
    <View style={styles.searchShell}>
      <Ionicons name="search-outline" size={18} color={colors.muted} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={onClear} hitSlop={10} style={styles.searchClearButton}>
          <Ionicons name="close-circle" size={19} color={colors.muted} />
        </Pressable>
      ) : (
        <Pressable onPress={handleVoicePress} hitSlop={10} style={styles.searchClearButton}>
          <Ionicons name="mic-outline" size={18} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export function FixedFooter({ children, style }) {
  return <View style={[styles.fixedFooter, style]}>{children}</View>;
}

export function CartPreviewBar({ items, subtotal, quantity, onPress }) {
  const previewItems = items.slice(0, 3);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cartPreviewBar, pressed ? styles.pressed : null]}>
      <View style={styles.cartPreviewImages}>
        {previewItems.map((item, index) => {
          const image = getProductThumbnail(item);
          return (
            <View key={`${item._id}-${index}`} style={[styles.cartPreviewThumb, { marginLeft: index === 0 ? 0 : -10 }]}>
              {image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={16} color={colors.primary} />}
            </View>
          );
        })}
      </View>
      <View style={styles.flex}>
        <Text style={styles.cartPreviewTitle} numberOfLines={1}>{quantity} {quantity === 1 ? 'item' : 'items'} in cart</Text>
        <Text style={styles.cartPreviewSubtitle}>Rs.{subtotal}</Text>
      </View>
      <View style={styles.cartPreviewCta}>
        <Text style={styles.cartPreviewCtaText}>View Cart</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </View>
    </Pressable>
  );
}

export function DeliveryAddressCard({
  addressText,
  latitude,
  longitude,
  loading,
  error,
  onUseCurrentLocation,
  onEditAddress
}) {
  const hasLocation = latitude !== '' && latitude != null && longitude !== '' && longitude != null;

  return (
    <Card style={{ gap: 14 }}>
      <View style={styles.between}>
        <View style={styles.row}>
          <View style={styles.iconBubble}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.subheading}>Delivery Address</Text>
            <Text style={styles.muted} numberOfLines={2}>{addressText?.trim() || (hasLocation ? 'Location added' : 'No address selected')}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
        {onEditAddress ? (
          <Pressable onPress={onEditAddress} hitSlop={10}>
            <Text style={styles.link}>Change</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        disabled={loading}
        onPress={onUseCurrentLocation}
        style={[styles.locationAction, loading ? styles.disabled : null]}
      >
        <MaterialIcons name="my-location" size={20} color={colors.primary} />
        <Text style={styles.locationActionText}>{loading ? 'Getting location...' : 'Use Current Location'}</Text>
      </Pressable>
    </Card>
  );
}

export function PaymentMethodCard({ onSelectUpi }) {
  return (
    <Card style={{ gap: 12 }}>
      <Text style={styles.subheading}>Payment Method</Text>
      <View style={[styles.paymentOption, styles.paymentSelected]}>
        <View style={styles.iconBubble}>
          <Ionicons name="cash-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Cash on Delivery</Text>
          <Text style={styles.muted}>Pay directly to seller/delivery boy</Text>
        </View>
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      </View>
      <Pressable onPress={onSelectUpi} style={[styles.paymentOption, styles.paymentDisabled]}>
        <View style={styles.iconBubbleMuted}>
          <MaterialIcons name="payment" size={22} color={colors.muted} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.muted }]}>Pay via UPI</Text>
          <Text style={styles.muted}>Coming soon</Text>
        </View>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </Pressable>
    </Card>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.between}>
      <Text style={styles.subheading}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loader({ message = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.muted, { marginTop: 12 }]}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>LS</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={[styles.muted, { textAlign: 'center' }]}>{message}</Text> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: 10, alignSelf: 'stretch' }} /> : null}
    </Card>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'new').toLowerCase();
  const tone =
    normalized.includes('open') || normalized.includes('delivered') || normalized.includes('approved') || normalized.includes('active') || normalized.includes('placed')
      ? styles.greenBadge
      : normalized.includes('closed') || normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('suspend')
        ? styles.redBadge
        : normalized.includes('accepted') || normalized.includes('packed') || normalized.includes('out')
          ? styles.blueBadge
          : styles.amberBadge;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{status || 'New'}</Text>
    </View>
  );
}

export function ProductTraitBadge({ product }) {
  const type = String(product?.vegType || '').toLowerCase();

  if (type.includes('non')) {
    return (
      <View style={[styles.traitBadge, styles.nonVegTrait]}>
        <Ionicons name="restaurant-outline" size={12} color="#b91c1c" />
        <Text style={[styles.traitText, { color: '#b91c1c' }]}>Non-veg</Text>
      </View>
    );
  }

  if (type.includes('egg')) {
    return (
      <View style={[styles.traitBadge, styles.eggTrait]}>
        <MaterialCommunityIcons name="egg-outline" size={13} color="#b45309" />
        <Text style={[styles.traitText, { color: '#b45309' }]}>Egg</Text>
      </View>
    );
  }

  if (type.includes('veg')) {
    return (
      <View style={[styles.traitBadge, styles.vegTrait]}>
        <Ionicons name="leaf-outline" size={12} color="#15803d" />
        <Text style={[styles.traitText, { color: '#15803d' }]}>Veg</Text>
      </View>
    );
  }

  return null;
}

export function AvailabilityIcon({ unavailable }) {
  return (
    <View style={[styles.availabilityDot, unavailable ? styles.availabilityOff : styles.availabilityOn]}>
      <Ionicons name={unavailable ? 'close' : 'checkmark'} size={13} color={unavailable ? colors.error : colors.success} />
    </View>
  );
}

export function CategoryCard({ title, subtitle, active, onPress }) {
  const iconName = title.includes('Restaurant') ? 'food-fork-drink' : title.includes('Grocery') ? 'basket-outline' : title.includes('Dairy') ? 'bottle-soda-outline' : 'apps';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryCard, active ? styles.activeCategoryCard : null, pressed ? styles.pressed : null]}>
      <View style={[styles.categoryIcon, active ? styles.activeCategoryIcon : null]}>
        <MaterialCommunityIcons name={iconName} size={25} color={active ? '#fff' : colors.primary} />
      </View>
      <Text style={styles.categoryTitle} numberOfLines={2}>{title.replace(' Store', '').replace(' / ', '/')}</Text>
      {subtitle ? <Text style={styles.categorySubtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export function ShopCard({ shop, onPress }) {
  const open = shop.openStatus?.isOpenNow && !shop.temporaryClosure?.enabled;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={styles.shopCard}>
        <View style={styles.row}>
          <View style={styles.shopThumb}>
            {shop.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Ionicons name="storefront-outline" size={24} color={colors.primary} />}
          </View>
          <View style={styles.flex}>
            <View style={styles.between}>
              <Text style={styles.title} numberOfLines={1}>{shop.name}</Text>
              <StatusBadge status={open ? 'Open' : 'Closed'} />
            </View>
            <Text style={styles.muted} numberOfLines={1}>{shop.businessType}</Text>
            <Text style={styles.small} numberOfLines={1}>4.5 | {shop.deliverySettings?.estimatedDeliveryTime || '25-30 min'} | Min Rs.{shop.deliverySettings?.minimumOrder || 0}</Text>
            <Text style={styles.small}>
              Delivery Rs.{shop.deliverySettings?.deliveryCharge || 0} | {shop.distanceKm == null ? 'Nearby' : `${shop.distanceKm} km`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}

export function ProductCard({ product, onPress, onAdd }) {
  const image = getProductThumbnail(product);
  const available = product.status !== 'inactive';

  return (
    <Card style={styles.productCard}>
      <Pressable onPress={onPress} style={{ gap: 8 }}>
        <View style={styles.productThumb}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={25} color={colors.primary} />}
        </View>
        <Text style={styles.productTitle} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productMeta} numberOfLines={1}>{product.brand || product.foodCategory || product.groceryCategory || product.shop?.name}</Text>
        <ProductTraitBadge product={product} />
        <Text style={styles.price}>Rs.{product.price}</Text>
      </Pressable>
      {onAdd ? (
        <Pressable onPress={onAdd} disabled={!available} style={styles.addFab}>
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      ) : null}
    </Card>
  );
}

export function ProductListCard({ product, onPress, onAdd, disabled, quantity = 0, onMinus, onPlus }) {
  const image = getProductThumbnail(product);
  const unavailable = disabled || product.status === 'inactive';
  const meta = product.brand || product.foodCategory || product.groceryCategory || product.dairyBakeryType || product.shop?.name;

  return (
    <Card style={styles.productListCard}>
      <View style={styles.productListRow}>
        <Pressable onPress={onPress} style={styles.productListInfo}>
          <View style={styles.productListThumb}>
            {image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={26} color={colors.primary} />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
            <View style={styles.productMetaRow}>
              {meta ? <Text style={[styles.muted, { flexShrink: 1 }]} numberOfLines={1}>{meta}</Text> : null}
              <ProductTraitBadge product={product} />
            </View>
            <Text style={styles.price}>Rs.{product.price}</Text>
          </View>
        </Pressable>
        <View style={styles.productListActions}>
          <AvailabilityIcon unavailable={product.status === 'inactive'} />
          {quantity > 0 ? (
            <QuantityStepper value={quantity} onMinus={onMinus} onPlus={onPlus} />
          ) : (
            <Pressable onPress={onAdd} disabled={unavailable} style={[styles.addSmallButton, unavailable ? styles.disabled : null]}>
              <Text style={styles.addSmallText}>+ Add</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}

export function CartItemCard({ item, onMinus, onPlus, onRemove }) {
  const image = getProductThumbnail(item);

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.cartItemTop}>
        <View style={styles.cartItemThumb}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={24} color={colors.primary} />}
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.muted}>Rs.{item.price} each</Text>
          <ProductTraitBadge product={item} />
        </View>
        <Text style={styles.price}>Rs.{Number(item.price) * item.quantity}</Text>
      </View>
      <View style={styles.between}>
        <QuantityStepper value={item.quantity} onMinus={onMinus} onPlus={onPlus} />
        <Button title="Remove" variant="danger" onPress={onRemove} style={{ minHeight: 42 }} />
      </View>
    </Card>
  );
}

export function MenuCard({ icon, title, subtitle, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={styles.menuCard}>
        <View style={[styles.iconBubble, danger ? styles.dangerBubble : null]}>
          <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, danger ? { color: colors.error } : null]}>{title}</Text>
          {subtitle ? <Text style={styles.muted} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export function OrderCard({ order, onPress }) {
  const total = order.totalAmount ?? order.subtotal ?? 0;
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={{ gap: 10 }}>
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.title}>Order #{order._id?.slice(-6)}</Text>
            <Text style={styles.muted} numberOfLines={1}>{order.shop?.name || 'Local shop'}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
        <View style={styles.between}>
          <Text style={styles.small}>{date}</Text>
          <Text style={styles.price}>Rs.{total}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function PriceRow({ label, value, strong }) {
  return (
    <View style={styles.between}>
      <Text style={strong ? styles.title : styles.muted}>{label}</Text>
      <Text style={strong ? styles.price : styles.title}>Rs.{value}</Text>
    </View>
  );
}

export function QuantityStepper({ value, onMinus, onPlus }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepButton}>
        <Text style={styles.stepText}>-</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={onPlus} style={styles.stepButton}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export const AppButton = Button;
export const AppInput = Input;
export const AppCard = Card;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 116, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  hero: {
    backgroundColor: '#f1ecff',
    borderColor: '#ddd6fe',
    overflow: 'hidden'
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.bg },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  greeting: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  locationText: { color: colors.ink, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  headerSubtitle: { color: colors.muted, fontWeight: '600', fontSize: 12, marginTop: 2 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 16, lineHeight: 20, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  subheading: { fontSize: 16, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '500', lineHeight: 19, fontSize: 13 },
  small: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  link: { color: colors.primary, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  inputShell: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputError: { borderColor: colors.error, backgroundColor: '#fff7f7' },
  fieldError: { color: colors.error, fontSize: 12, fontWeight: '800', marginTop: 5 },
  helperText: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 5 },
  textAreaShell: { minHeight: 100, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { color: colors.primary, fontWeight: '800', marginRight: 8 },
  input: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '500', paddingVertical: 10 },
  textArea: { minHeight: 78, textAlignVertical: 'top' },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8
  },
  compactButton: { minHeight: 44, alignSelf: 'stretch' },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.red },
  outlineDangerButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.red },
  ghostButton: { backgroundColor: 'transparent' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButtonText: { color: colors.ink },
  outlineDangerText: { color: colors.red },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  shopCard: { gap: 8, padding: 10 },
  productCard: { width: 126, gap: 8, padding: 10, position: 'relative' },
  productListCard: { padding: 10 },
  productListRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  productListInfo: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  shopThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productThumb: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productListThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbText: { color: colors.primary, fontWeight: '900', fontSize: 24 },
  image: { width: '100%', height: '100%' },
  price: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  productTitle: { color: colors.ink, fontWeight: '800', fontSize: 12, minHeight: 32 },
  productMeta: { color: colors.muted, fontWeight: '600', fontSize: 10 },
  addFab: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metaPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: { backgroundColor: '#f8fafc', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, color: colors.muted, fontSize: 11, fontWeight: '700' },
  badge: { minHeight: 24, maxHeight: 28, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  badgeText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  greenBadge: { backgroundColor: '#dcfce7' },
  redBadge: { backgroundColor: '#fee2e2' },
  amberBadge: { backgroundColor: '#fef3c7' },
  blueBadge: { backgroundColor: '#dbeafe' },
  categoryCard: {
    width: '31.5%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    minHeight: 96,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  activeCategoryCard: { borderColor: colors.primary, backgroundColor: '#f5f3ff' },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeCategoryIcon: { backgroundColor: colors.primary },
  categoryIconText: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  activeCategoryIconText: { color: '#fff' },
  categoryTitle: { color: colors.ink, fontWeight: '800', fontSize: 11, textAlign: 'center', lineHeight: 14 },
  categorySubtitle: { color: colors.muted, fontWeight: '600', fontSize: 9, textAlign: 'center' },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBubbleMuted: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: { color: colors.error, fontSize: 12, fontWeight: '800', marginTop: 4 },
  paymentOption: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  paymentSelected: { borderColor: colors.primary, backgroundColor: '#F5F3FF' },
  paymentDisabled: { opacity: 0.62, backgroundColor: '#F9FAFB' },
  comingSoonBadge: { borderRadius: 999, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  locationAction: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  locationActionText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  searchShell: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '500' },
  searchClearButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  fixedFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 82,
    padding: 10,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dangerBubble: { backgroundColor: '#FEF2F2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  empty: { alignItems: 'center', gap: 8 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.primary, fontWeight: '900' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  productListActions: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', gap: 8, maxWidth: 112 },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 },
  traitBadge: { minHeight: 22, borderRadius: 999, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  traitText: { fontSize: 10, fontWeight: '700' },
  vegTrait: { backgroundColor: '#dcfce7' },
  nonVegTrait: { backgroundColor: '#fee2e2' },
  eggTrait: { backgroundColor: '#fef3c7' },
  availabilityDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  availabilityOn: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  availabilityOff: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  cartItemTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartItemThumb: { width: 62, height: 62, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },
  cartPreviewBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 82,
    minHeight: 64,
    borderRadius: 22,
    backgroundColor: '#111827',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  cartPreviewImages: { width: 72, flexDirection: 'row', alignItems: 'center' },
  cartPreviewThumb: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  cartPreviewTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cartPreviewSubtitle: { color: '#d1d5db', fontWeight: '600', fontSize: 12, marginTop: 2 },
  cartPreviewCta: { minHeight: 42, borderRadius: 16, backgroundColor: colors.primary, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cartPreviewCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  checkoutFooter: { gap: 10, padding: 12, borderRadius: 22 },
  orderFooter: {
    gap: 8,
    padding: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.98)',
    shadowOpacity: 0.18,
    shadowRadius: 18
  },
  footerSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  footerSummaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  footerSummaryValue: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  addSmallButton: { minHeight: 34, borderRadius: 11, paddingHorizontal: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addSmallText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 999, overflow: 'hidden', backgroundColor: '#fff' },
  stepButton: { minWidth: 30, minHeight: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  stepText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  stepValue: { minWidth: 30, textAlign: 'center', color: colors.ink, fontWeight: '800', fontSize: 12 }
});
