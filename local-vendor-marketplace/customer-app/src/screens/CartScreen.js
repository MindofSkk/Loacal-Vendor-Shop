import { ScrollView, Text, View } from 'react-native';
import { Button, Card, EmptyState, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {items.length === 0 ? <EmptyState title="Your cart is empty" message="Add products from a shop to place an order." /> : null}
      {items.map((item) => (
        <Card key={item._id}>
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.muted}>₹{item.price} each</Text>
            </View>
            <Text style={styles.price}>₹{Number(item.price) * item.quantity}</Text>
          </View>
          <View style={[styles.row, { marginTop: 12 }]}>
            <Button title="-" variant="secondary" onPress={() => updateQuantity(item._id, item.quantity - 1)} style={{ flex: 1 }} />
            <Text style={[styles.title, { minWidth: 40, textAlign: 'center' }]}>{item.quantity}</Text>
            <Button title="+" variant="secondary" onPress={() => updateQuantity(item._id, item.quantity + 1)} style={{ flex: 1 }} />
            <Button title="Remove" variant="danger" onPress={() => removeItem(item._id)} style={{ flex: 2 }} />
          </View>
        </Card>
      ))}
      {items.length > 0 ? (
        <Card style={{ gap: 12 }}>
          <View style={styles.between}>
            <Text style={styles.title}>Subtotal</Text>
            <Text style={styles.price}>₹{subtotal}</Text>
          </View>
          <Button title="Checkout" onPress={() => navigation.navigate('Checkout')} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
