import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants';

const radius = {
  sm: 12,
  md: 16,
  lg: 22
};

export function ScreenWrapper({ children, style }) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

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
        variant === 'ghost' ? styles.ghostButton : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' || variant === 'ghost' ? styles.secondaryButtonText : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Input({ label, multiline, style, secureTextEntry, editable, autoFocus, ...props }) {
  const isMultiline = Boolean(multiline);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, isMultiline ? styles.textAreaShell : null]}>
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

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }) {
  return <Input value={value} onChangeText={onChangeText} placeholder={placeholder} />;
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
    normalized.includes('open') || normalized.includes('delivered') || normalized.includes('approved') || normalized.includes('active') || normalized.includes('stock')
      ? styles.greenBadge
      : normalized.includes('closed') || normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('suspend') || normalized.includes('out')
        ? styles.redBadge
        : normalized.includes('accepted') || normalized.includes('packed') || normalized.includes('delivery')
          ? styles.blueBadge
          : styles.amberBadge;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{status || 'New'}</Text>
    </View>
  );
}

export function OptionRow({ options, value, onChange, getLabel }) {
  return (
    <View style={styles.optionWrap}>
      {options.map((option) => (
        <Pressable key={String(option)} onPress={() => onChange(option)} style={[styles.option, value === option ? styles.activeOption : null]}>
          <Text style={[styles.optionText, value === option ? styles.activeOptionText : null]}>{String(getLabel ? getLabel(option) : option)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function MetricCard({ label, value, tone = 'green' }) {
  const toneStyle = tone === 'orange' ? styles.orangeMetric : tone === 'blue' ? styles.blueMetric : tone === 'purple' ? styles.purpleMetric : styles.greenMetric;
  return (
    <Card style={[styles.metricCard, toneStyle]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

export function ProductRow({ product, onEdit, onDelete }) {
  const image = product.images?.[0]?.url;
  const available = product.status !== 'inactive';

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.row}>
        <View style={styles.thumb}>{image ? <Image source={{ uri: image }} style={styles.image} /> : <Text style={styles.thumbText}>{product.name?.slice(0, 1) || 'P'}</Text>}</View>
        <View style={styles.flex}>
          <View style={styles.between}>
            <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
            <StatusBadge status={available ? 'In Stock' : 'Out'} />
          </View>
          <Text style={styles.muted} numberOfLines={1}>{product.brand || product.foodCategory || product.groceryCategory || product.businessType}</Text>
          <Text style={styles.price}>Rs.{product.price}{product.stock != null ? ` | Stock ${product.stock}` : ''}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Button title="Edit" variant="secondary" onPress={onEdit} style={styles.flex} />
        <Button title="Delete" variant="danger" onPress={onDelete} style={styles.flex} />
      </View>
    </Card>
  );
}

export function OrderRow({ order, onPress }) {
  const total = order.totalAmount ?? order.subtotal ?? 0;
  const pendingStyle = order.status === 'Pending' ? styles.pendingOrder : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={[{ gap: 10 }, pendingStyle]}>
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.title}>Order #{order._id?.slice(-6)}</Text>
            <Text style={styles.muted} numberOfLines={1}>{order.customer?.name || 'Customer'}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.small} numberOfLines={1}>{order.deliveryAddress?.fullAddress || 'Address not available'}</Text>
        <View style={styles.between}>
          <Text style={styles.small}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</Text>
          <Text style={styles.price}>Rs.{total}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function InfoRow({ label, value }) {
  return (
    <View style={styles.between}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.title, { textAlign: 'right', flex: 1 }]}>{value}</Text>
    </View>
  );
}

export const AppButton = Button;
export const AppInput = Input;
export const AppCard = Card;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  hero: { backgroundColor: '#e8f8ef', borderColor: '#bbf7d0' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  headerSubtitle: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 16, fontWeight: '900', color: colors.ink },
  heading: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: colors.ink },
  subheading: { fontSize: 20, fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600', lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  link: { color: colors.primary, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  textAreaShell: { minHeight: 100, justifyContent: 'flex-start', paddingTop: 12 },
  input: { color: colors.ink, fontSize: 15, fontWeight: '700', paddingVertical: 10 },
  textArea: { minHeight: 78, textAlignVertical: 'top' },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.red },
  ghostButton: { backgroundColor: 'transparent' },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  secondaryButtonText: { color: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  greenBadge: { backgroundColor: '#dcfce7' },
  redBadge: { backgroundColor: '#fee2e2' },
  amberBadge: { backgroundColor: '#fef3c7' },
  blueBadge: { backgroundColor: '#dbeafe' },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: '#dcfce7',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbText: { color: colors.primary, fontWeight: '900', fontSize: 24 },
  image: { width: '100%', height: '100%' },
  price: { color: colors.ink, fontWeight: '900', fontSize: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  empty: { alignItems: 'center', gap: 8 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.primary, fontWeight: '900' },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  activeOption: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontWeight: '900', color: colors.ink, fontSize: 12 },
  activeOptionText: { color: '#fff' },
  metricCard: { flex: 1, minHeight: 102, justifyContent: 'space-between' },
  metricLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '900', color: colors.muted },
  metricValue: { fontSize: 26, fontWeight: '900', color: colors.ink },
  greenMetric: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  orangeMetric: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  blueMetric: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  purpleMetric: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' },
  pendingOrder: { borderColor: '#fdba74', backgroundColor: '#fff7ed' }
});
