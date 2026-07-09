import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, CartItemCard, EmptyState, FixedFooter, PriceRow, styles } from '../components/ui';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const shop = items[0]?.shop;
  const minimumOrder = Number(shop?.deliverySettings?.minimumOrder || 0);
  const deliveryCharge = Number(shop?.deliverySettings?.deliveryCharge || 0);
  const toPay = subtotal + deliveryCharge;
  const belowMinimum = items.length > 0 && subtotal < minimumOrder;

  const confirmRemove = (item) => {
    Alert.alert('Remove item?', `${item.name} will be removed from cart.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(item._id) }
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: items.length > 0 ? 150 : 96 }]}>
        <Text style={styles.heading}>Cart</Text>
        {items.length === 0 ? <EmptyState title="Your cart is empty" message="Add products from a shop to place an order." /> : null}
        {items.map((item) => (
          <CartItemCard
            key={item._id}
            item={item}
            onMinus={() => updateQuantity(item._id, item.quantity - 1)}
            onPlus={() => updateQuantity(item._id, item.quantity + 1)}
            onRemove={() => confirmRemove(item)}
          />
        ))}
        {items.length > 0 ? (
          <Card style={{ gap: 12 }}>
            <Text style={styles.subheading}>Bill details</Text>
            {shop?.name ? <Text style={styles.muted}>Ordering from {shop.name}</Text> : null}
            <PriceRow label="Item total" value={subtotal} />
            <PriceRow label="Delivery charge" value={deliveryCharge} />
            <PriceRow label="To pay" value={toPay} strong />
            {minimumOrder > 0 ? (
              <Text style={belowMinimum ? { color: '#b45309', fontWeight: '900' } : styles.muted}>
                Minimum order: Rs.{minimumOrder}
              </Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
      {items.length > 0 ? (
        <FixedFooter>
          <Button title="Proceed to checkout" disabled={belowMinimum} onPress={() => navigation.navigate('Checkout')} />
        </FixedFooter>
      ) : null}
    </View>
  );
}
