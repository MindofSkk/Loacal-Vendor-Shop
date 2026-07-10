import { ActivityIndicator, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
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

export function MetricCard({ label, value, tone = 'green', icon = 'stats-chart-outline' }) {
  const toneStyle = tone === 'orange' ? styles.orangeMetric : tone === 'blue' ? styles.blueMetric : tone === 'purple' ? styles.purpleMetric : styles.greenMetric;
  return (
    <Card style={[styles.metricCard, toneStyle]}>
      <View style={styles.between}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

export function ProductRow({ product, onEdit, onDelete }) {
  const image = getProductThumbnail(product);
  const available = product.status !== 'inactive';

  return (
    <Card style={{ gap: 12 }}>
      <Pressable onPress={onEdit} style={styles.row}>
        <View style={styles.thumb}>{image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="cube-outline" size={28} color={colors.primary} />}</View>
        <View style={styles.flex}>
          <View style={styles.between}>
            <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
            <StatusBadge status={available ? 'Active' : 'Inactive'} />
          </View>
          <Text style={styles.muted} numberOfLines={1}>{product.brand || product.foodCategory || product.groceryCategory || product.businessType}</Text>
          <Text style={styles.price}>Rs.{product.price}{product.stock != null ? ` | Stock ${product.stock}` : ''}</Text>
        </View>
      </Pressable>
      <View style={styles.row}>
        <Button title="Edit" variant="secondary" onPress={onEdit} style={styles.flex} />
        <Button title="Delete" variant="outlineDanger" onPress={onDelete} style={styles.flex} />
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
            <Text style={styles.title}>#{order._id?.slice(-6)}</Text>
            <Text style={styles.muted} numberOfLines={1}>{order.customer?.name || 'Customer'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.price}>Rs.{total}</Text>
            <StatusBadge status={order.status === 'Pending' ? 'New' : order.status} />
          </View>
        </View>
        <Text style={styles.small} numberOfLines={1}>{order.deliveryAddress?.fullAddress || 'Address not available'}</Text>
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
  content: { padding: 16, paddingBottom: 96, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  hero: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  headerSubtitle: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 15, fontWeight: '900', color: colors.ink },
  heading: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: colors.ink },
  subheading: { fontSize: 18, fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600', lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  link: { color: colors.primary, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  inputShell: {
    minHeight: 48,
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
  fieldError: { color: colors.error, fontSize: 12, fontWeight: '800', marginTop: 5 },
  helperText: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 5 },
  textAreaShell: { minHeight: 96, justifyContent: 'flex-start', paddingTop: 12 },
  input: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700', paddingVertical: 10 },
  textArea: { minHeight: 74, textAlignVertical: 'top' },
  searchShell: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
  iconButtonTiny: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 48,
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
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  secondaryButtonText: { color: colors.ink },
  outlineDangerText: { color: colors.red },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
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
  price: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  empty: { alignItems: 'center', gap: 8 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  activeOption: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontWeight: '900', color: colors.ink, fontSize: 12 },
  activeOptionText: { color: '#fff' },
  metricCard: { flex: 1, minHeight: 96, justifyContent: 'space-between' },
  metricLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '900', color: colors.muted },
  metricValue: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 8 },
  greenMetric: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  orangeMetric: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  blueMetric: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  purpleMetric: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' },
  pendingOrder: { borderColor: '#fdba74', backgroundColor: '#fff7ed' },
  skeletonWide: { height: 76, borderRadius: radius.md, backgroundColor: '#e5e7eb' },
  skeletonLine: { height: 14, width: '80%', borderRadius: 999, backgroundColor: '#e5e7eb' },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconBubble: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  dangerBubble: { backgroundColor: '#FEF2F2' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', gap: 14 }
});
