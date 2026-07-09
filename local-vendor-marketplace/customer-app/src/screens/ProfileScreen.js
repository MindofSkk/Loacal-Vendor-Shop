import { ScrollView, Text } from 'react-native';
import { Button, Card, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>
      <Card style={{ gap: 8 }}>
        <Text style={styles.title}>{user?.name}</Text>
        <Text style={styles.muted}>{user?.email}</Text>
        <Text style={styles.muted}>{user?.phone || 'Phone not added'}</Text>
      </Card>
      <Button title="Logout" variant="danger" onPress={logout} />
    </ScrollView>
  );
}
