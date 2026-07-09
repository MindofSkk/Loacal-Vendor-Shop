import { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

const ToastContext = createContext(null);

const toneMap = {
  success: { icon: 'checkmark-circle', bg: '#ECFDF5', border: '#BBF7D0', color: colors.success },
  error: { icon: 'alert-circle-outline', bg: '#FEF2F2', border: '#FECACA', color: colors.error },
  warning: { icon: 'warning-outline', bg: '#FFFBEB', border: '#FDE68A', color: colors.warning },
  info: { icon: 'information-circle-outline', bg: '#EEF2FF', border: '#DDD6FE', color: colors.primary }
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = ({ message, type = 'info', actionLabel, onAction }) => {
    setToast({ message, type, actionLabel, onAction });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 2500);
  };

  const value = useMemo(() => ({ showToast, hideToast: () => setToast(null) }), []);
  const tone = toneMap[toast?.type] || toneMap.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={toastStyles.wrap}>
          <View style={[toastStyles.toast, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            <Ionicons name={tone.icon} size={20} color={tone.color} />
            <Text style={toastStyles.message} numberOfLines={2}>{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable
                onPress={() => {
                  setToast(null);
                  toast.onAction?.();
                }}
                hitSlop={8}
              >
                <Text style={[toastStyles.action, { color: tone.color }]}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 86,
    zIndex: 50
  },
  toast: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  message: {
    flex: 1,
    color: colors.ink,
    fontWeight: '800'
  },
  action: {
    fontWeight: '900'
  }
});
