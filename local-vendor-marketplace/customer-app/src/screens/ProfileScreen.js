import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, styles } from '../components/ui';
import { colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const menuItems = [
  { icon: 'receipt-outline', title: 'My Orders', description: 'Track and view your order history', action: 'orders' },
  { icon: 'location-outline', title: 'Saved Addresses', description: 'Manage your delivery locations', action: 'address' },
  { icon: 'heart-outline', title: 'Wishlist', description: 'Products and shops you saved', action: 'wishlist' },
  { icon: 'help-circle-outline', title: 'Help & Support', description: 'Get help with orders and account', action: 'support' },
  { icon: 'shield-checkmark-outline', title: 'Privacy Policy', description: 'How your data is handled', action: 'privacy' },
  { icon: 'document-text-outline', title: 'Terms & Conditions', description: 'App policies and usage terms', action: 'terms' },
  { icon: 'information-circle-outline', title: 'About App', description: 'LocalShop app information', action: 'about' },
  { icon: 'share-social-outline', title: 'Invite Friends', description: 'Share LocalShop with others', action: 'invite' },
  { icon: 'star-outline', title: 'Rate App', description: 'Tell us how we are doing', action: 'rate' }
];

const accountItems = [
  { icon: 'person-outline', title: 'Edit Profile', description: 'Update name, phone and email', action: 'edit' },
  { icon: 'lock-closed-outline', title: 'Change Password', description: 'Secure your account', action: 'password' },
  { icon: 'trash-outline', title: 'Delete Account', description: 'Coming Soon', action: 'delete', disabled: true }
];

function getInitials(name) {
  return String(name || 'User')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return 'Phone not added';
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

function buildAddress(address) {
  return [address?.line1, address?.area, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(', ');
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const initials = getInitials(user?.name);
  const address = buildAddress(user?.address);
  const shortAddress = [user?.address?.area, user?.address?.city].filter(Boolean).join(', ');
  const addressLineTwo = [user?.address?.state, user?.address?.pincode].filter(Boolean).join(' ');

  const confirmLogout = () => {
    Alert.alert('Logout?', 'You will need to login again to place orders.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const handleAction = (action) => {
    if (action === 'orders') {
      navigation.navigate('Orders', { screen: 'OrdersMain' });
      return;
    }

    const messages = {
      address: 'Saved address management is coming soon.',
      wishlist: 'Wishlist is coming soon. Browse products to start saving.',
      support: 'Support center is coming soon.',
      privacy: 'Privacy policy screen is coming soon.',
      terms: 'Terms and conditions screen is coming soon.',
      about: 'LocalShop version 1.0.0',
      invite: 'Invite sharing is coming soon.',
      rate: 'Rating flow is coming soon.',
      edit: 'Profile editing is coming soon.',
      password: 'Change password is coming soon.',
      delete: 'Delete account is coming soon.'
    };

    showToast({ type: 'info', message: messages[action] || 'Coming soon.' });
  };

  return (
    <SafeAreaView style={profileStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        style={profileStyles.screen}
        contentContainerStyle={[profileStyles.content, { paddingBottom: Math.max(insets.bottom, 0) + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={profileStyles.screenTitle}>Profile</Text>

        <Pressable onPress={() => handleAction('edit')} style={({ pressed }) => [pressed ? profileStyles.pressedScale : null]}>
          <Card style={profileStyles.profileCard}>
            <View style={profileStyles.avatar}>
              <Text style={profileStyles.avatarText}>{initials}</Text>
            </View>
            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.userName} numberOfLines={1}>{user?.name || 'LocalShop User'}</Text>
              <Text style={profileStyles.userMeta}>{formatPhone(user?.phone)}</Text>
              <Text style={profileStyles.userMeta} numberOfLines={1}>{user?.email || 'Email not added'}</Text>
            </View>
            <View style={profileStyles.editPill}>
              <Text style={profileStyles.editText}>Edit</Text>
            </View>
          </Card>
        </Pressable>

        <View style={profileStyles.statsRow}>
          <StatCard value="0" label="Orders" icon="receipt-outline" />
          <StatCard value="0" label="Wishlist" icon="heart-outline" />
          <StatCard value={address ? '1' : '0'} label="Addresses" icon="location-outline" />
        </View>

        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Saved Address</Text>
          {address ? (
            <Card style={profileStyles.addressCard}>
              <View style={profileStyles.addressIcon}>
                <Ionicons name="home-outline" size={21} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <View style={profileStyles.addressTitleRow}>
                  <Text style={profileStyles.cardTitle}>Home</Text>
                  <View style={profileStyles.defaultBadge}>
                    <Text style={profileStyles.defaultText}>Default</Text>
                  </View>
                </View>
                <Text style={profileStyles.bodyText} numberOfLines={1}>{shortAddress || address}</Text>
                {addressLineTwo ? <Text style={profileStyles.caption}>{addressLineTwo}</Text> : null}
              </View>
              <Pressable onPress={() => handleAction('address')} hitSlop={10} style={profileStyles.changeButton}>
                <Text style={profileStyles.changeText}>Change</Text>
              </Pressable>
            </Card>
          ) : (
            <Card style={profileStyles.emptyAddressCard}>
              <View style={profileStyles.emptyIcon}>
                <Ionicons name="home-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={profileStyles.cardTitle}>Add your first delivery address</Text>
                <Text style={profileStyles.caption}>Save your home address for faster checkout.</Text>
              </View>
              <Pressable onPress={() => handleAction('address')} style={profileStyles.addAddressButton}>
                <Ionicons name="add" size={17} color="#fff" />
                <Text style={profileStyles.addAddressText}>Add Address</Text>
              </Pressable>
            </Card>
          )}
        </View>

        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Explore</Text>
          <View style={profileStyles.menuGroup}>
            {menuItems.map((item) => (
              <ProfileMenuItem key={item.title} item={item} onPress={() => handleAction(item.action)} />
            ))}
          </View>
        </View>

        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Account</Text>
          <View style={profileStyles.menuGroup}>
            {accountItems.map((item) => (
              <ProfileMenuItem key={item.title} item={item} onPress={() => handleAction(item.action)} />
            ))}
            <ProfileMenuItem
              item={{ icon: 'log-out-outline', title: 'Logout', description: 'Sign out from this device', danger: true }}
              onPress={confirmLogout}
            />
          </View>
        </View>

        <View style={profileStyles.appInfo}>
          <Text style={profileStyles.appVersion}>Version 1.0.0</Text>
          <Text style={profileStyles.madeIn}>Made with love in India</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <Card style={profileStyles.statCard}>
      <View style={profileStyles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={profileStyles.statValue}>{value}</Text>
      <Text style={profileStyles.statLabel}>{label}</Text>
    </Card>
  );
}

function ProfileMenuItem({ item, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={item.disabled}
      style={({ pressed }) => [profileStyles.menuItem, pressed && !item.disabled ? profileStyles.pressedScale : null, item.disabled ? profileStyles.disabled : null]}
    >
      <View style={[profileStyles.menuIcon, item.danger ? profileStyles.menuIconDanger : null]}>
        <Ionicons name={item.icon} size={20} color={item.danger ? colors.error : colors.primary} />
      </View>
      <View style={profileStyles.menuTextWrap}>
        <Text style={[profileStyles.menuTitle, item.danger ? profileStyles.dangerText : null]}>{item.title}</Text>
        <Text style={profileStyles.menuDescription} numberOfLines={1}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={19} color={colors.muted} />
    </Pressable>
  );
}

const profileStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8FC' },
  content: { padding: 16, paddingTop: 8, gap: 14 },
  screenTitle: { color: colors.ink, fontSize: 24, lineHeight: 30, fontWeight: '600' },
  profileCard: {
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 0,
    shadowOpacity: 0.08,
    shadowRadius: 14
  },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  userName: { color: colors.ink, fontSize: 19, fontWeight: '600' },
  userMeta: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  editPill: { minHeight: 34, borderRadius: 999, backgroundColor: '#F5F3FF', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 18, padding: 12, alignItems: 'center', gap: 5, borderWidth: 0 },
  statIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  statValue: { color: colors.ink, fontSize: 19, fontWeight: '600' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  section: { gap: 10 },
  sectionTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '600' },
  addressCard: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0 },
  addressIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  bodyText: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '500', marginTop: 4 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 2 },
  defaultBadge: { minHeight: 22, borderRadius: 999, paddingHorizontal: 8, backgroundColor: '#DCFCE7', justifyContent: 'center' },
  defaultText: { color: colors.success, fontSize: 11, fontWeight: '600' },
  changeButton: { minHeight: 34, borderRadius: 999, backgroundColor: '#F5F3FF', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  changeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  emptyAddressCard: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  addAddressButton: { minHeight: 38, borderRadius: 999, backgroundColor: colors.primary, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addAddressText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  menuGroup: { gap: 8 },
  menuItem: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  menuIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F3EEFF', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: '#FEF2F2' },
  menuTextWrap: { flex: 1, minWidth: 0 },
  menuTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  menuDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 2 },
  dangerText: { color: colors.error },
  disabled: { opacity: 0.6 },
  pressedScale: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  appInfo: { alignItems: 'center', paddingVertical: 8, gap: 4 },
  appVersion: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  madeIn: { color: colors.muted, fontSize: 12, fontWeight: '500' }
});
