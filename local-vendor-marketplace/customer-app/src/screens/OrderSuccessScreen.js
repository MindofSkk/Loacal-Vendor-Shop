import { ScrollView, Text } from 'react-native';
import { Button, Card, StatusBadge, styles } from '../components/ui';

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params || {};

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <Text style={styles.heading}>Order placed</Text>
        <Text style={styles.muted}>Seller will confirm your order soon.</Text>
        <Text style={styles.title}>#{order?._id?.slice(-6)}</Text>
        <StatusBadge status={order?.status || 'Pending'} />
        <Text style={styles.price}>₹{order?.subtotal || 0}</Text>
        <Button title="View my orders" onPress={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} />
        <Button title="Back to home" variant="secondary" onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })} />
      </Card>
    </ScrollView>
  );
}
