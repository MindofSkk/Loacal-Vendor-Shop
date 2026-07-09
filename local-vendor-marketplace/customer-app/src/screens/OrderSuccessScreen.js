import { ScrollView, Text, View } from 'react-native';
import { Button, Card, StatusBadge, styles } from '../components/ui';

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params || {};

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}>
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#16a34a', fontSize: 42, fontWeight: '900' }}>OK</Text>
        </View>
        <Text style={styles.heading}>Order placed</Text>
        <Text style={[styles.muted, { textAlign: 'center' }]}>Seller will confirm your order soon.</Text>
        <Text style={styles.title}>#{order?._id?.slice(-6)}</Text>
        <StatusBadge status={order?.status || 'Pending'} />
        <Text style={styles.price}>Rs.{order?.subtotal || 0}</Text>
        <Button title="View my orders" onPress={() => navigation.navigate('Orders', { screen: 'OrdersMain' })} style={{ alignSelf: 'stretch' }} />
        <Button title="Continue shopping" variant="secondary" onPress={() => navigation.navigate('Home', { screen: 'HomeMain' })} style={{ alignSelf: 'stretch' }} />
      </Card>
    </ScrollView>
  );
}
