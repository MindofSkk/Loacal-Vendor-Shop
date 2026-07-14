import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiError } from '../api/client';
import { shopApi } from '../api/services';
import { Button, Card, Input, Loader, OptionRow, SearchBar, styles } from '../components/ui';
import { closureReasons, colors, weekDays } from '../constants';
import { useToast } from '../context/ToastContext';

const defaultSettings = {
  workingHours: weekDays.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false })),
  temporaryClosure: { enabled: false, reason: 'Holiday', customReason: '' },
  deliverySettings: { radiusKm: '5', minimumOrder: '0', deliveryCharge: '0', freeDeliveryAbove: '0', estimatedDeliveryTime: '30 Minutes' }
};

export default function BusinessSettingsScreen({ navigation }) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [settingSearch, setSettingSearch] = useState('');

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
        showToast({ type: 'error', message: getApiError(err) });
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
    const nextErrors = {};
    if (Number(settings.deliverySettings.radiusKm) <= 0) nextErrors.radiusKm = 'Radius must be greater than 0.';
    if (Number(settings.deliverySettings.minimumOrder) < 0) nextErrors.minimumOrder = 'Minimum order cannot be negative.';
    if (Number(settings.deliverySettings.deliveryCharge) < 0) nextErrors.deliveryCharge = 'Delivery charge cannot be negative.';
    if (!settings.deliverySettings.estimatedDeliveryTime.trim()) nextErrors.estimatedDeliveryTime = 'ETA is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await shopApi.updateSettings(settings);
      showToast({ type: 'success', message: 'Business settings saved.' });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  const query = settingSearch.trim().toLowerCase();
  const matches = (...values) => !query || values.join(' ').toLowerCase().includes(query);
  const visibleHours = matches('working hours operating open closed days')
    ? settings.workingHours
    : settings.workingHours.filter((entry) => entry.day.toLowerCase().includes(query));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={settingsStyles.header}>
        <Text style={styles.heading}>Business Settings</Text>
        <Text style={styles.muted}>Shop status, delivery rules and operating hours in one place.</Text>
        <View style={styles.row}>
          <Button title="Profile" variant="secondary" onPress={() => navigation.navigate('Profile')} style={styles.flex} />
          <Button title="Delivery Boys" variant="secondary" onPress={() => navigation.getParent()?.navigate('Dashboard', { screen: 'DeliveryBoys' })} style={styles.flex} />
        </View>
      </Card>
      <SearchBar value={settingSearch} onChangeText={setSettingSearch} onClear={() => setSettingSearch('')} placeholder="Search settings, delivery, hours..." />
      {matches('delivery radius minimum order charge free eta time') ? (
        <Card style={settingsStyles.section}>
          <Text style={styles.subheading}>Delivery</Text>
          <View style={settingsStyles.twoColumn}>
            <Input label="Radius KM" helper="Example: 3" error={errors.radiusKm} keyboardType="numeric" value={String(settings.deliverySettings.radiusKm)} onChangeText={(radiusKm) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, radiusKm } })} style={styles.flex} />
            <Input label="Minimum Order" error={errors.minimumOrder} keyboardType="numeric" value={String(settings.deliverySettings.minimumOrder)} onChangeText={(minimumOrder) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, minimumOrder } })} style={styles.flex} />
          </View>
          <View style={settingsStyles.twoColumn}>
            <Input label="Delivery Charge" error={errors.deliveryCharge} keyboardType="numeric" value={String(settings.deliverySettings.deliveryCharge)} onChangeText={(deliveryCharge) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, deliveryCharge } })} style={styles.flex} />
            <Input label="Free Above" keyboardType="numeric" value={String(settings.deliverySettings.freeDeliveryAbove)} onChangeText={(freeDeliveryAbove) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, freeDeliveryAbove } })} style={styles.flex} />
          </View>
          <Input label="Estimated Delivery Time" helper="Example: 20-30 min" error={errors.estimatedDeliveryTime} value={settings.deliverySettings.estimatedDeliveryTime} onChangeText={(estimatedDeliveryTime) => setSettings({ ...settings, deliverySettings: { ...settings.deliverySettings, estimatedDeliveryTime } })} />
        </Card>
      ) : null}
      {matches('temporary closure shop status holiday stock personal maintenance custom open closed') ? (
        <Card style={settingsStyles.section}>
          <Text style={styles.subheading}>Shop Status</Text>
          <OptionRow options={['Open', 'Temporarily Closed']} value={settings.temporaryClosure.enabled ? 'Temporarily Closed' : 'Open'} onChange={(value) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, enabled: value === 'Temporarily Closed' } })} />
          {settings.temporaryClosure.enabled ? (
            <>
              <OptionRow options={closureReasons} value={settings.temporaryClosure.reason} onChange={(reason) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, reason } })} />
              {settings.temporaryClosure.reason === 'Custom' ? <Input label="Custom reason" value={settings.temporaryClosure.customReason} onChangeText={(customReason) => setSettings({ ...settings, temporaryClosure: { ...settings.temporaryClosure, customReason } })} /> : null}
            </>
          ) : (
            <Text style={styles.muted}>Customers can place orders while your shop is open.</Text>
          )}
        </Card>
      ) : null}
      {visibleHours.length ? (
        <Card style={settingsStyles.section}>
          <Text style={styles.subheading}>Operating Hours</Text>
          {visibleHours.map((entry) => {
            const index = settings.workingHours.findIndex((item) => item.day === entry.day);
            return (
              <Card key={entry.day} style={settingsStyles.dayCard}>
                <View style={styles.between}>
                  <Text style={styles.title}>{entry.day}</Text>
                  <OptionRow options={['Open', 'Closed']} value={entry.closed ? 'Closed' : 'Open'} onChange={(value) => updateHours(index, 'closed', value === 'Closed')} />
                </View>
                {!entry.closed ? (
                  <View style={settingsStyles.twoColumn}>
                    <Input label="Open" helper="24-hour, e.g. 09:00" value={entry.openTime} onChangeText={(value) => updateHours(index, 'openTime', value)} style={styles.flex} />
                    <Input label="Close" helper="24-hour, e.g. 21:00" value={entry.closeTime} onChangeText={(value) => updateHours(index, 'closeTime', value)} style={styles.flex} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </Card>
      ) : null}
      <Button title="Save business settings" loading={saving} onPress={save} />
    </ScrollView>
  );
}

const settingsStyles = StyleSheet.create({
  header: { gap: 10, backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  section: { gap: 12 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  dayCard: { gap: 9, backgroundColor: '#F8FAFC', borderColor: colors.border, padding: 12 }
});
