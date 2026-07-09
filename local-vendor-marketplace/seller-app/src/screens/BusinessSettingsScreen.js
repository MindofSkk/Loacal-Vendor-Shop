import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { shopApi } from '../api/services';
import { Button, Card, Input, Loader, OptionRow, styles } from '../components/ui';
import { closureReasons, weekDays } from '../constants';

const defaultSettings = {
  workingHours: weekDays.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false })),
  temporaryClosure: { enabled: false, reason: 'Holiday', customReason: '' },
  deliverySettings: { radiusKm: '5', minimumOrder: '0', deliveryCharge: '0', freeDeliveryAbove: '0', estimatedDeliveryTime: '30 Minutes' }
};

export default function BusinessSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await shopApi.getSettings();
      setSettings({
        workingHours: data.workingHours?.length ? data.workingHours : defaultSettings.workingHours,
        temporaryClosure: { ...defaultSettings.temporaryClosure, ...data.temporaryClosure },
        deliverySettings: { ...defaultSettings.deliverySettings, ...data.deliverySettings }
      });
    } catch (err) {
      if (err.response?.status !== 404) {
        Alert.alert('Unable to load settings', getApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateHours = (index, key, value) => {
    const workingHours = [...settings.workingHours];
    workingHours[index] = { ...workingHours[index], [key]: value };
    setSettings({ ...settings, workingHours });
  };

  const save = async () => {
    try {
      await shopApi.updateSettings(settings);
      Alert.alert('Saved', 'Business settings saved.');
    } catch (err) {
      Alert.alert('Save failed', getApiError(err));
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Button title="Profile / Logout" variant="secondary" onPress={() => navigation.navigate('Profile')} />
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Delivery settings</Text>
        <Input label="Delivery Radius KM" keyboardType="numeric" value={String(settings.deliverySettings.radiusKm)} onChangeText={(radiusKm) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, radiusKm } })} />
        <Input label="Minimum Order" keyboardType="numeric" value={String(settings.deliverySettings.minimumOrder)} onChangeText={(minimumOrder) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, minimumOrder } })} />
        <Input label="Delivery Charge" keyboardType="numeric" value={String(settings.deliverySettings.deliveryCharge)} onChangeText={(deliveryCharge) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, deliveryCharge } })} />
        <Input label="Free Delivery Above" keyboardType="numeric" value={String(settings.deliverySettings.freeDeliveryAbove)} onChangeText={(freeDeliveryAbove) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, freeDeliveryAbove } })} />
        <Input label="Estimated Delivery Time" value={settings.deliverySettings.estimatedDeliveryTime} onChangeText={(estimatedDeliveryTime) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, estimatedDeliveryTime } })} />
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Temporary closure</Text>
        <OptionRow options={['Open', 'Temporarily Closed']} value={settings.temporaryClosure.enabled ? 'Temporarily Closed' : 'Open'} onChange={(value) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, enabled: value === 'Temporarily Closed' } })} />
        <OptionRow options={closureReasons} value={settings.temporaryClosure.reason} onChange={(reason) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, reason } })} />
        {settings.temporaryClosure.reason === 'Custom' ? <Input label="Custom reason" value={settings.temporaryClosure.customReason} onChangeText={(customReason) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, customReason } })} /> : null}
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.subheading}>Working hours</Text>
        {settings.workingHours.map((entry, index) => (
          <Card key={entry.day} style={{ gap: 8, backgroundColor: '#f8fafc' }}>
            <View style={styles.between}>
              <Text style={styles.title}>{entry.day}</Text>
              <OptionRow options={['Open', 'Closed']} value={entry.closed ? 'Closed' : 'Open'} onChange={(value) => updateHours(index, 'closed', value === 'Closed')} />
            </View>
            <Input label="Open Time HH:mm" value={entry.openTime} onChangeText={(value) => updateHours(index, 'openTime', value)} />
            <Input label="Close Time HH:mm" value={entry.closeTime} onChangeText={(value) => updateHours(index, 'closeTime', value)} />
          </Card>
        ))}
      </Card>
      <Button title="Save business settings" onPress={save} />
    </ScrollView>
  );
}
