import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { shopApi } from '../api/services';
import { Button, Card, ConfirmDialog, EmptyState, Input, Loader, StatusBadge, styles } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function DeliveryBoysScreen({ route, navigation }) {
  const { showToast } = useToast();
  const [shop, setShop] = useState(route.params?.shop || null);
  const [deliveryBoys, setDeliveryBoys] = useState(route.params?.shop?.deliveryBoys || []);
  const [loading, setLoading] = useState(!route.params?.shop);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (!shop) {
      setLoading(true);
      shopApi
        .myShop()
        .then(({ data }) => {
          setShop(data);
          setDeliveryBoys(data.deliveryBoys || []);
        })
        .catch((err) => showToast({ type: 'error', message: getApiError(err) }))
        .finally(() => setLoading(false));
    }
  }, [shop, showToast]);

  const update = (index, key, value) => {
    const next = [...deliveryBoys];
    next[index] = { ...next[index], [key]: value };
    setDeliveryBoys(next);
  };

  const validate = () => {
    const nextErrors = {};
    deliveryBoys.forEach((contact, index) => {
      const contactErrors = {};
      if (!contact.name?.trim()) contactErrors.name = 'Name is required.';
      if (!/^[6-9]\d{9}$/.test(String(contact.phone || '').trim())) contactErrors.phone = 'Enter a valid 10 digit phone number.';
      if (Object.keys(contactErrors).length) nextErrors[index] = contactErrors;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await shopApi.saveMyShop({ ...shop, category: shop.category?._id || shop.category, deliveryBoys });
      showToast({ type: 'success', message: 'Delivery boy contacts saved.' });
      navigation.goBack();
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  const removeContact = () => {
    setDeliveryBoys(deliveryBoys.filter((_item, current) => current !== pendingDelete));
    setPendingDelete(null);
    showToast({ type: 'info', message: 'Contact removed. Save changes to update shop.' });
  };

  if (loading) return <Loader message="Loading delivery contacts..." />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={[styles.hero, { gap: 8 }]}>
        <Text style={styles.heading}>Delivery Boys</Text>
        <Text style={styles.muted}>Save trusted contacts for one-tap WhatsApp order sharing.</Text>
      </Card>
      {deliveryBoys.length === 0 ? (
        <EmptyState title="No contacts" message="Add delivery boy phone numbers to share orders faster." actionLabel="Add delivery boy" onAction={() => setDeliveryBoys([{ name: '', phone: '' }])} />
      ) : null}
      {deliveryBoys.map((contact, index) => (
        <Card key={`${contact.name}-${index}`} style={{ gap: 10 }}>
          <View style={styles.between}>
            <Text style={styles.title}>Contact {index + 1}</Text>
            <StatusBadge status={contact.phone ? 'Active' : 'Draft'} />
          </View>
          <Input label="Name" error={errors[index]?.name} value={contact.name} onChangeText={(value) => update(index, 'name', value)} />
          <Input label="Phone" helper="Use 10 digit Indian mobile number." error={errors[index]?.phone} keyboardType="phone-pad" value={contact.phone} onChangeText={(value) => update(index, 'phone', value)} />
          <Button title="Delete" variant="outlineDanger" onPress={() => setPendingDelete(index)} />
        </Card>
      ))}
      <View style={styles.row}>
        <Button title="Add contact" variant="secondary" onPress={() => setDeliveryBoys([...deliveryBoys, { name: '', phone: '' }])} style={styles.flex} />
        <Button title="Save" loading={saving} onPress={save} style={styles.flex} disabled={!shop} />
      </View>
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete contact?"
        message="This delivery boy will be removed from the shop profile after you save."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeContact}
      />
    </ScrollView>
  );
}
