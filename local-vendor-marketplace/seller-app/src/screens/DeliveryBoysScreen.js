import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { shopApi } from '../api/services';
import { Button, Card, Input, styles } from '../components/ui';

export default function DeliveryBoysScreen({ route, navigation }) {
  const [shop, setShop] = useState(route.params?.shop || null);
  const [deliveryBoys, setDeliveryBoys] = useState(route.params?.shop?.deliveryBoys || []);

  useEffect(() => {
    if (!shop) {
      shopApi.myShop().then(({ data }) => {
        setShop(data);
        setDeliveryBoys(data.deliveryBoys || []);
      });
    }
  }, [shop]);

  const update = (index, key, value) => {
    const next = [...deliveryBoys];
    next[index] = { ...next[index], [key]: value };
    setDeliveryBoys(next);
  };

  const save = async () => {
    try {
      await shopApi.saveMyShop({ ...shop, category: shop.category?._id || shop.category, deliveryBoys });
      Alert.alert('Saved', 'Delivery boy contacts saved.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', getApiError(err));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Delivery Boys</Text>
      {deliveryBoys.map((contact, index) => (
        <Card key={`${contact.name}-${index}`} style={{ gap: 10 }}>
          <Input label="Name" value={contact.name} onChangeText={(value) => update(index, 'name', value)} />
          <Input label="Phone" keyboardType="phone-pad" value={contact.phone} onChangeText={(value) => update(index, 'phone', value)} />
          <Button title="Delete" variant="danger" onPress={() => setDeliveryBoys(deliveryBoys.filter((_item, current) => current !== index))} />
        </Card>
      ))}
      <View style={styles.row}>
        <Button title="Add contact" variant="secondary" onPress={() => setDeliveryBoys([...deliveryBoys, { name: '', phone: '' }])} style={styles.flex} />
        <Button title="Save" onPress={save} style={styles.flex} disabled={!shop} />
      </View>
    </ScrollView>
  );
}
