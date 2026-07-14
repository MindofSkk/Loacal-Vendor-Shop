import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, ConfirmDialog, MenuCard, styles } from '../components/ui';
import { colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'S';

  const goDashboardStack = (screen) => {
    navigation.getParent()?.navigate('Dashboard', { screen });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={profileStyles.header}>
        <View style={styles.row}>
          <View style={profileStyles.avatar}>
            <Text style={profileStyles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.subheading}>{user?.name || 'Seller'}</Text>
            <Text style={styles.muted}>{user?.email || 'Email not added'}</Text>
            <Text style={styles.muted}>{user?.phone || 'Phone not added'}</Text>
          </View>
        </View>
        <View style={profileStyles.statsRow}>
          {[
            ['Shop', 'Profile'],
            ['Orders', 'Live'],
            ['Products', 'Active']
          ].map(([value, label]) => (
            <View key={label} style={profileStyles.statCard}>
              <Text style={profileStyles.statValue}>{value}</Text>
              <Text style={styles.small}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Text style={profileStyles.sectionLabel}>Shop</Text>
      <MenuCard icon="storefront-outline" title="View Shop / Edit Profile" subtitle="Edit shop details, logo and address" onPress={() => goDashboardStack('ShopProfile')} />
      <MenuCard icon="settings-outline" title="Business Settings" subtitle="Hours, delivery rules and closures" onPress={() => navigation.navigate('SettingsMain')} />
      <MenuCard icon="people-outline" title="Delivery Boys" subtitle="Manage order sharing contacts" onPress={() => goDashboardStack('DeliveryBoys')} />
      <Text style={profileStyles.sectionLabel}>Support</Text>
      <MenuCard icon="help-circle-outline" title="Help & Support" subtitle="Support details coming soon" onPress={() => showToast({ type: 'info', message: 'Help & Support is coming soon.' })} />
      <MenuCard icon="document-text-outline" title="Terms & Conditions" subtitle="Marketplace policy information" onPress={() => showToast({ type: 'info', message: 'Terms page is coming soon.' })} />
      <MenuCard icon="shield-checkmark-outline" title="Privacy Policy" subtitle="Data and account safety" onPress={() => showToast({ type: 'info', message: 'Privacy Policy is coming soon.' })} />
      <Text style={profileStyles.sectionLabel}>Account</Text>
      <MenuCard icon="lock-closed-outline" title="Change Password" subtitle="Secure your seller account" onPress={() => showToast({ type: 'info', message: 'Change Password is coming soon.' })} />
      <MenuCard icon="log-out-outline" title="Logout" subtitle="Sign out from this device" danger onPress={() => setConfirmLogout(true)} />
      <Text style={profileStyles.version}>LocalShop Seller App - Version 1.0.0</Text>
      <ConfirmDialog
        visible={confirmLogout}
        title="Logout?"
        message="You will need to login again to manage your shop."
        confirmLabel="Logout"
        danger
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </ScrollView>
  );
}

const profileStyles = StyleSheet.create({
  header: { gap: 14, backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  avatar: { width: 62, height: 62, borderRadius: 21, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 19 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, backgroundColor: '#fff', padding: 12, alignItems: 'center' },
  statValue: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  sectionLabel: { color: colors.muted, fontWeight: '700', textTransform: 'uppercase', fontSize: 12, marginTop: 4 },
  version: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 4 }
});
