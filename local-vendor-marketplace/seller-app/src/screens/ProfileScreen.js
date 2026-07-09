import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, ConfirmDialog, MenuCard, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
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
      <Card style={[styles.hero, { gap: 12 }]}>
        <Text style={styles.heading}>More</Text>
        <Text style={styles.muted}>Manage your seller account and shop settings.</Text>
      </Card>
      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#059669', fontWeight: '900', fontSize: 22 }}>{initials}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.subheading}>{user?.name || 'Seller'}</Text>
            <Text style={styles.muted}>{user?.email || 'Email not added'}</Text>
            <Text style={styles.muted}>{user?.phone || 'Phone not added'}</Text>
          </View>
        </View>
      </Card>
      <MenuCard icon="storefront-outline" title="View Shop / Edit Profile" subtitle="Edit shop details, logo and address" onPress={() => goDashboardStack('ShopProfile')} />
      <MenuCard icon="settings-outline" title="Business Settings" subtitle="Hours, delivery rules and closures" onPress={() => navigation.navigate('SettingsMain')} />
      <MenuCard icon="people-outline" title="Delivery Boys" subtitle="Manage order sharing contacts" onPress={() => goDashboardStack('DeliveryBoys')} />
      <MenuCard icon="help-circle-outline" title="Help & Support" subtitle="Support details coming soon" onPress={() => {}} />
      <MenuCard icon="document-text-outline" title="Terms & Conditions" subtitle="Marketplace policy information" onPress={() => {}} />
      <Button title="Logout" variant="outlineDanger" onPress={() => setConfirmLogout(true)} />
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
