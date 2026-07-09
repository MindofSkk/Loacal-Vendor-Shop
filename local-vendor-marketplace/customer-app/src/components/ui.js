import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants';

export function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const isDisabled = Boolean(disabled);
  const label = title == null ? '' : String(title);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : null,
        variant === 'danger' ? styles.dangerButton : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' ? styles.secondaryButtonText : null]}>{label}</Text>
    </Pressable>
  );
}

export function Input({ label, multiline, style, secureTextEntry, editable, autoFocus, ...props }) {
  const isMultiline = Boolean(multiline);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor="#94a3b8"
        multiline={isMultiline}
        secureTextEntry={Boolean(secureTextEntry)}
        editable={editable == null ? true : Boolean(editable)}
        autoFocus={Boolean(autoFocus)}
        style={[styles.input, isMultiline ? styles.textArea : null, props.style]}
      />
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ title, message }) {
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
    </Card>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'new').toLowerCase();
  const tone =
    normalized.includes('delivered') || normalized.includes('approved') || normalized.includes('active')
      ? styles.greenBadge
      : normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('suspend')
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

export function ShopCard({ shop, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.listCard}>
        <View style={styles.row}>
          <View style={styles.thumb}>
            {shop.logoUrl ? <Image source={{ uri: shop.logoUrl }} style={styles.image} /> : <Text style={styles.thumbText}>S</Text>}
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{shop.name}</Text>
            <Text style={styles.muted}>{shop.businessType}</Text>
            <Text style={styles.small}>{[shop.location?.area, shop.location?.city].filter(Boolean).join(', ')}</Text>
            <View style={styles.metaRow}>
              <StatusBadge status={shop.openStatus?.isOpenNow ? 'Open Now' : 'Closed'} />
              <Text style={styles.small}>{shop.distanceKm == null ? 'Distance N/A' : `${shop.distanceKm} km`}</Text>
            </View>
            <Text style={styles.small}>
              ETA {shop.deliverySettings?.estimatedDeliveryTime || '30 Minutes'} | Delivery ₹{shop.deliverySettings?.deliveryCharge || 0}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function ProductCard({ product, onPress, onAdd }) {
  const image = product.images?.[0]?.url;
  return (
    <Card style={styles.listCard}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.thumb}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <Text style={styles.thumbText}>P</Text>}
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.muted}>{product.shop?.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>
        </View>
      </Pressable>
      {onAdd ? <Button title="Add to cart" onPress={onAdd} style={styles.fullButton} /> : null}
    </Card>
  );
}

export function OrderCard({ order, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.title}>Order #{order._id?.slice(-6)}</Text>
            <Text style={styles.muted}>{order.shop?.name}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.price}>₹{order.subtotal}</Text>
      </Card>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  listCard: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 17, fontWeight: '900', color: colors.ink },
  heading: { fontSize: 28, fontWeight: '900', color: colors.ink },
  subheading: { fontSize: 20, fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600' },
  small: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  button: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.red },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  secondaryButtonText: { color: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  fullButton: { marginTop: 4 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbText: { color: colors.primary, fontWeight: '900', fontSize: 24 },
  image: { width: '100%', height: '100%' },
  price: { color: colors.ink, fontWeight: '900', fontSize: 18, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  greenBadge: { backgroundColor: '#dcfce7' },
  redBadge: { backgroundColor: '#fee2e2' },
  amberBadge: { backgroundColor: '#fef3c7' },
  blueBadge: { backgroundColor: '#dbeafe' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 4 }
});
