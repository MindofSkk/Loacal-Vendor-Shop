import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, StatusBadge, styles } from '../components/ui';

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params || {};
  const total = order?.totalAmount ?? order?.subtotal ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}>
      <Card style={{ gap: 16, alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={58} color="#16A34A" />
        </View>
        <Text style={styles.heading}>Order placed!</Text>
        <Text style={[styles.muted, { textAlign: 'center' }]}>Seller will confirm your order soon.</Text>
        <Card style={{ gap: 10, alignSelf: 'stretch', backgroundColor: '#f8fafc' }}>
          <View style={styles.between}>
            <Text style={styles.muted}>Order ID</Text>
            <Text style={styles.title}>#{order?._id?.slice(-6)}</Text>
          </View>
          <View style={styles.between}>
            <Text style={styles.muted}>Shop</Text>
            <Text style={[styles.title, { textAlign: 'right', flex: 1 }]} numberOfLines={1}>{order?.shop?.name || 'Local shop'}</Text>
          </View>
          <View style={styles.between}>
            <Text style={styles.muted}>Total</Text>
            <Text style={styles.price}>Rs.{total}</Text>
          </View>
          <StatusBadge status={order?.status || 'Pending'} />
        </Card>
        <Button title="View Orders" onPress={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} style={{ alignSelf: 'stretch' }} />
        <Button title="Continue Shopping" variant="secondary" onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })} style={{ alignSelf: 'stretch' }} />
      </Card>
    </ScrollView>
  );
}
