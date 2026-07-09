import { ScrollView, Text, View } from 'react-native';
import { Button, Card, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>
      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#059669', fontWeight: '900', fontSize: 20 }}>{user?.name?.slice(0, 1) || 'S'}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{user?.name}</Text>
            <Text style={styles.muted}>{user?.email}</Text>
          </View>
        </View>
        <Text style={styles.muted}>{user?.phone || 'Phone not added'}</Text>
      </Card>
      <Button title="Logout" variant="danger" onPress={logout} />
    </ScrollView>
  );
}
