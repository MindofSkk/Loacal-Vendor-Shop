import { ScrollView, Text } from 'react-native';
import { Button, Card, CartItemCard, EmptyState, PriceRow, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Cart</Text>
      {items.length === 0 ? <EmptyState title="Your cart is empty" message="Add products from a shop to place an order." /> : null}
      {items.map((item) => (
        <CartItemCard
          key={item._id}
          item={item}
          onMinus={() => updateQuantity(item._id, item.quantity - 1)}
          onPlus={() => updateQuantity(item._id, item.quantity + 1)}
          onRemove={() => removeItem(item._id)}
        />
      ))}
      {items.length > 0 ? (
        <Card style={{ gap: 12 }}>
          <Text style={styles.subheading}>Bill details</Text>
          <PriceRow label="Item total" value={subtotal} />
          <PriceRow label="To pay" value={subtotal} strong />
          <Button title="Proceed to checkout" onPress={() => navigation.navigate('Checkout')} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
