import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { getApiError } from '../api/client';
import { Button, Card, Input, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (err) {
      Alert.alert('Login failed', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ marginTop: 48 }}>
          <Text style={styles.heading}>LocalShop Customer</Text>
          <Text style={styles.muted}>Order from nearby restaurants, kirana, dairy and bakery shops.</Text>
        </View>
        <Card style={{ gap: 12 }}>
          <Text style={styles.subheading}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
          {mode === 'register' ? (
            <>
              <Input label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <Input label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm({ ...form, phone })} />
            </>
          ) : null}
          <Input label="Email" value={form.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(email) => setForm({ ...form, email })} />
          <Input label="Password" value={form.password} secureTextEntry onChangeText={(password) => setForm({ ...form, password })} />
          <Button title={loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'} disabled={loading} onPress={submit} />
          <Button title={mode === 'login' ? 'New customer? Register' : 'Already registered? Login'} variant="secondary" onPress={() => setMode(mode === 'login' ? 'register' : 'login')} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
