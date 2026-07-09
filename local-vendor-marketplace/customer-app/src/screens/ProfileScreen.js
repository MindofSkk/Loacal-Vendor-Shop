import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, MenuCard, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const address = [user?.address?.line1, user?.address?.area, user?.address?.city, user?.address?.pincode].filter(Boolean).join(', ');
  const initials = (user?.name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const confirmLogout = () => {
    Alert.alert('Logout?', 'You will need to login again to place orders.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>
      <Card style={{ gap: 14 }}>
        <View style={styles.row}>
          <View style={{ width: 68, height: 68, borderRadius: 24, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#5B2EEB', fontWeight: '900', fontSize: 22 }}>{initials}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{user?.name}</Text>
            <Text style={styles.muted}>{user?.email}</Text>
            <Text style={styles.muted}>{user?.phone || 'Phone not added'}</Text>
          </View>
        </View>
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={styles.subheading}>Saved address</Text>
        <Text style={styles.muted}>{address || 'No saved address yet.'}</Text>
      </Card>
      <MenuCard icon="receipt-outline" title="My Orders" subtitle="View order history" onPress={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} />
      <MenuCard icon="location-outline" title="Saved Address" subtitle={address || 'No saved address yet'} />
      <MenuCard icon="help-circle-outline" title="Help & Support" subtitle="Contact local support" />
      <MenuCard icon="document-text-outline" title="Terms & Conditions" subtitle="App policies and usage terms" />
      <Button title="Logout" variant="outlineDanger" onPress={confirmLogout} />
    </ScrollView>
  );
}
