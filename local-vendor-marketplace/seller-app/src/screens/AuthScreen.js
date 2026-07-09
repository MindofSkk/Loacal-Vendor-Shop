import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiError } from '../api/client';
import { Button, Card, Input, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [welcome, setWelcome] = useState(true);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (mode === 'register' && !form.name.trim()) nextErrors.name = 'Name is required.';
    if (mode === 'register' && !/^[6-9]\d{9}$/.test(form.phone.trim())) nextErrors.phone = 'Enter a valid 10 digit mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email.trim(), password: form.password });
      } else {
        await register({ ...form, email: form.email.trim(), phone: form.phone.trim() });
        showToast({ type: 'success', message: 'Seller account created. Create your shop profile next.' });
      }
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  if (welcome) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}>
        <Card style={{ gap: 20, alignItems: 'center', paddingVertical: 28 }}>
          <View style={{ width: '100%', minHeight: 220, borderRadius: 22, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 104, height: 104, borderRadius: 32, backgroundColor: '#049B4F', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="storefront" size={58} color="#fff" />
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={[styles.heading, { color: '#049B4F', textAlign: 'center' }]}>LocalShop</Text>
            <Text style={[styles.subheading, { textAlign: 'center' }]}>Sell more. Serve your local.</Text>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Manage your shop, orders and deliveries with ease.</Text>
          </View>
          <Button title="Get Started" onPress={() => setWelcome(false)} style={{ alignSelf: 'stretch' }} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 14 }}>
          <Text style={styles.heading}>Welcome Back!</Text>
          <Text style={styles.muted}>Login to continue to your account</Text>
          <View style={styles.row}>
            <Button title="Login" variant={mode === 'login' ? 'primary' : 'secondary'} onPress={() => setMode('login')} style={styles.flex} />
            <Button title="Register" variant={mode === 'register' ? 'primary' : 'secondary'} onPress={() => setMode('register')} style={styles.flex} />
          </View>
          {mode === 'register' ? (
            <>
              <Input label="Name" value={form.name} error={errors.name} onChangeText={(name) => setForm({ ...form, name })} />
              <Input label="Phone" keyboardType="phone-pad" maxLength={10} value={form.phone} error={errors.phone} onChangeText={(phone) => setForm({ ...form, phone: phone.replace(/\D/g, '') })} />
            </>
          ) : null}
          <Input label="Email" value={form.email} error={errors.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(email) => setForm({ ...form, email })} />
          <Input
            label="Password"
            value={form.password}
            error={errors.password}
            secureTextEntry={!showPassword}
            onChangeText={(password) => setForm({ ...form, password })}
            rightElement={(
              <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </Pressable>
            )}
          />
          <Button title={mode === 'login' ? 'Login' : 'Register'} loading={loading} onPress={submit} />
          <Button title="Continue with WhatsApp" variant="secondary" disabled onPress={() => {}} />
          <Text style={[styles.small, { textAlign: 'center' }]}>By continuing, you agree to our Terms & Conditions and Privacy Policy</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
