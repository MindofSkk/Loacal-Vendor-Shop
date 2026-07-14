import { ActivityIndicator, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
import { fontSizes, fontWeights, lineHeights, spacing } from '../theme/typography';
import { getProductThumbnail } from '../utils/productImages';

const radius = {
  sm: 12,
  md: 16,
  lg: 20
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

export function Input({ label, multiline, style, secureTextEntry, editable, autoFocus, rightElement, error, helper, ...props }) {
  const isMultiline = Boolean(multiline);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, isMultiline ? styles.textAreaShell : null, error ? styles.inputError : null]}>
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

export function SearchBar({ value, onChangeText, onClear, placeholder = 'Search...' }) {
  return (
    <View style={styles.searchShell}>
      <Ionicons name="search-outline" size={18} color={colors.muted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" style={styles.searchInput} />
      {value ? (
        <Pressable onPress={onClear} hitSlop={10} style={styles.iconButtonTiny}>
          <Ionicons name="close-circle" size={19} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
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

export function SkeletonCard() {
  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.skeletonWide} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '62%' }]} />
    </Card>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bag-handle-outline" size={30} color={colors.primary} />
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
    normalized.includes('open') || normalized.includes('delivered') || normalized.includes('approved') || normalized.includes('active') || normalized.includes('stock') || normalized.includes('completed')
      ? styles.greenBadge
      : normalized.includes('closed') || normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('suspend') || normalized.includes('out') || normalized.includes('inactive')
        ? styles.redBadge
        : normalized.includes('accepted') || normalized.includes('packed') || normalized.includes('delivery') || normalized.includes('preparing')
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

export function MetricCard({ label, value, tone = 'green', icon = 'stats-chart-outline', trend }) {
  const toneStyle = tone === 'orange' ? styles.orangeMetric : tone === 'blue' ? styles.blueMetric : tone === 'purple' ? styles.purpleMetric : styles.greenMetric;
  return (
    <Card style={[styles.metricCard, toneStyle]}>
      <View style={styles.between}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {trend ? <Text style={styles.metricTrend}>{trend}</Text> : null}
    </Card>
  );
}

export function ProductRow({ product, onEdit, onDelete, onDuplicate }) {
  const image = getProductThumbnail(product);
  const available = product.status !== 'inactive';
  const meta = product.brand || product.foodCategory || product.groceryCategory || product.businessType || 'Product';
  const stock = product.stock == null ? 'Stock managed' : `Stock ${product.stock}`;

  return (
    <Card style={styles.productRowCard}>
      <Pressable onPress={onEdit} style={styles.row}>
        <View style={styles.thumb}>{image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={28} color={colors.primary} />}</View>
        <View style={[styles.flex, { gap: 4 }]}>
          <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.muted} numberOfLines={1}>{meta}</Text>
          <View style={styles.productMetaLine}>
            <Text style={styles.price}>Rs.{product.price}</Text>
            <Text style={styles.small}>{stock}</Text>
          </View>
        </View>
        <View style={styles.productStatusColumn}>
          <StatusBadge status={available ? 'Available' : 'Out'} />
          <View style={[styles.switchTrack, available ? styles.switchTrackOn : null]}>
            <View style={[styles.switchKnob, available ? styles.switchKnobOn : null]} />
          </View>
        </View>
      </Pressable>
      <View style={styles.row}>
        <Button title="Edit" variant="secondary" onPress={onEdit} style={styles.flex} />
        {onDuplicate ? <Button title="Duplicate" variant="secondary" onPress={onDuplicate} style={styles.flex} /> : null}
        <Button title="Delete" variant="outlineDanger" onPress={onDelete} style={styles.flex} />
      </View>
    </Card>
  );
}

export function OrderRow({ order, onPress }) {
  const total = order.totalAmount ?? order.subtotal ?? 0;
  const pendingStyle = order.status === 'Pending' ? styles.pendingOrder : null;
  const itemCount = order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={[styles.orderRowCard, pendingStyle]}>
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text style={styles.title}>#{order._id?.slice(-6)?.toUpperCase()}</Text>
            <Text style={styles.muted} numberOfLines={1}>{order.customer?.name || 'Customer'} - {itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.price}>Rs.{total}</Text>
            <StatusBadge status={order.status === 'Pending' ? 'New' : order.status} />
          </View>
        </View>
        <Text style={styles.small} numberOfLines={1}>{order.deliveryAddress?.fullAddress || 'Address not available'}</Text>
        <View style={styles.orderQuickRow}>
          <Text style={styles.orderQuickText}>COD</Text>
          <Text style={styles.orderQuickText}>ETA 25-30 min</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
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

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirm', danger, loading, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <Card style={styles.modalCard}>
          <Text style={styles.subheading}>{title}</Text>
          {message ? <Text style={styles.muted}>{message}</Text> : null}
          <View style={styles.row}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button title={confirmLabel} variant={danger ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} style={styles.flex} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export const AppButton = Button;
export const AppInput = Input;
export const AppCard = Card;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 88, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  hero: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.ink },
  headerSubtitle: { color: colors.muted, fontWeight: fontWeights.medium, fontSize: fontSizes.sm, marginTop: 2 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: fontSizes.base, lineHeight: lineHeights.base, fontWeight: fontWeights.semibold, color: colors.ink },
  heading: { fontSize: fontSizes.xl, lineHeight: lineHeights.xl, fontWeight: fontWeights.semibold, color: colors.ink },
  subheading: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.ink },
  muted: { color: colors.muted, fontWeight: fontWeights.medium, lineHeight: lineHeights.md, fontSize: fontSizes.md },
  small: { color: colors.muted, fontSize: fontSizes.sm, fontWeight: fontWeights.medium, marginTop: 3 },
  link: { color: colors.primary, fontWeight: fontWeights.semibold },
  label: { color: colors.muted, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, textTransform: 'uppercase', marginBottom: 6 },
  inputShell: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputError: { borderColor: colors.error, backgroundColor: '#fff7f7' },
  fieldError: { color: colors.error, fontSize: 12, fontWeight: '600', marginTop: 5 },
  helperText: { color: colors.muted, fontSize: fontSizes.sm, fontWeight: fontWeights.medium, marginTop: 5 },
  textAreaShell: { minHeight: 90, justifyContent: 'flex-start', paddingTop: 11 },
  input: { flex: 1, color: colors.ink, fontSize: fontSizes.base, fontWeight: fontWeights.medium, paddingVertical: 9 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  searchShell: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: fontSizes.md, fontWeight: fontWeights.medium },
  iconButtonTiny: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8
  },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.red },
  outlineDangerButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.red },
  ghostButton: { backgroundColor: 'transparent' },
  buttonText: { color: '#fff', fontWeight: fontWeights.semibold, fontSize: fontSizes.md },
  secondaryButtonText: { color: colors.ink },
  outlineDangerText: { color: colors.red },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { color: colors.ink, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  greenBadge: { backgroundColor: '#dcfce7' },
  redBadge: { backgroundColor: '#fee2e2' },
  amberBadge: { backgroundColor: '#fef3c7' },
  blueBadge: { backgroundColor: '#dbeafe' },
  thumb: {
    width: 62,
    height: 62,
    borderRadius: radius.md,
    backgroundColor: '#dcfce7',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbText: { color: colors.primary, fontWeight: '700', fontSize: 24 },
  image: { width: '100%', height: '100%' },
  price: { color: colors.ink, fontWeight: fontWeights.semibold, fontSize: fontSizes.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  empty: { alignItems: 'center', gap: 8 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.ink },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  activeOption: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontWeight: fontWeights.semibold, color: colors.ink, fontSize: fontSizes.sm },
  activeOptionText: { color: '#fff' },
  metricCard: { flex: 1, minHeight: 82, justifyContent: 'space-between', gap: 5 },
  metricLabel: { fontSize: fontSizes.xs, textTransform: 'uppercase', fontWeight: fontWeights.semibold, color: colors.muted },
  metricValue: { fontSize: 21, fontWeight: fontWeights.semibold, color: colors.ink },
  metricTrend: { color: colors.success, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  metricIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(4,155,79,0.1)', alignItems: 'center', justifyContent: 'center' },
  greenMetric: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  orangeMetric: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  blueMetric: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  purpleMetric: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' },
  pendingOrder: { borderColor: '#fdba74', backgroundColor: '#fff7ed' },
  skeletonWide: { height: 76, borderRadius: radius.md, backgroundColor: '#e5e7eb' },
  skeletonLine: { height: 14, width: '80%', borderRadius: 999, backgroundColor: '#e5e7eb' },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 },
  iconBubble: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  dangerBubble: { backgroundColor: '#FEF2F2' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', gap: spacing.md },
  productRowCard: { gap: 11, padding: 12 },
  productMetaLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  productStatusColumn: { alignItems: 'flex-end', gap: 8 },
  switchTrack: { width: 38, height: 22, borderRadius: 999, backgroundColor: '#E5E7EB', padding: 3 },
  switchTrackOn: { backgroundColor: '#BBF7D0' },
  switchKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
  switchKnobOn: { transform: [{ translateX: 16 }], backgroundColor: colors.primary },
  orderRowCard: { gap: 9, padding: 12 },
  orderQuickRow: { minHeight: 28, borderRadius: 999, backgroundColor: '#F8FAFC', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderQuickText: { color: colors.muted, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold }
});
