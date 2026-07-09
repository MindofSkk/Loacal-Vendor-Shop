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
      }
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  };

  if (welcome) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}>
        <Card style={{ gap: 22, alignItems: 'center', paddingVertical: 28 }}>
          <View style={{ width: '100%', minHeight: 210, borderRadius: 22, backgroundColor: '#F1ECFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#5B2EEB', alignItems: 'center', justifyContent: 'center', shadowColor: '#5B2EEB', shadowOpacity: 0.28, shadowRadius: 20, elevation: 6 }}>
              <Ionicons name="location" size={54} color="#fff" />
            </View>
            <View style={{ position: 'absolute', bottom: 22, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', opacity: 0.55 }}>
              {['storefront', 'home', 'bag-handle', 'storefront'].map((icon, index) => (
                <View key={`${icon}-${index}`} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon} size={20} color="#5B2EEB" />
                </View>
              ))}
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={[styles.heading, { textAlign: 'center', color: '#5B2EEB' }]}>Shop Local.{'\n'}Support Local.</Text>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Discover restaurants, groceries, dairy and bakery near you.</Text>
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
          <View style={{ gap: 6, marginBottom: 2 }}>
            <Text style={styles.heading}>Welcome Back!</Text>
            <Text style={styles.muted}>Login or register to continue</Text>
          </View>
          <Text style={styles.subheading}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
          {mode === 'register' ? (
            <>
              <Input label="Name" value={form.name} error={errors.name} onChangeText={(name) => setForm({ ...form, name })} />
              <Input
                label="Phone"
                value={form.phone}
                error={errors.phone}
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(phone) => setForm({ ...form, phone: phone.replace(/\D/g, '') })}
              />
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
          <View style={styles.row}>
            <View style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
            <Text style={styles.small}>or</Text>
            <View style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
          </View>
          <Button title="Continue with Google" variant="secondary" disabled onPress={() => {}} />
          <Button title="Continue with Facebook" variant="secondary" disabled onPress={() => {}} />
          <Button title={mode === 'login' ? 'New customer? Register' : 'Already registered? Login'} variant="secondary" onPress={switchMode} />
          <Text style={[styles.small, { textAlign: 'center' }]}>By continuing, you agree to our Terms & Conditions and Privacy Policy</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
