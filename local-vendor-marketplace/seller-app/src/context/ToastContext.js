import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants';

const ToastContext = createContext(null);
const displayMs = 2800;

const toneMap = {
  success: { icon: 'checkmark', bg: '#16A34A' },
  error: { icon: 'close', bg: '#EF4444' },
  warning: { icon: 'warning', bg: '#F59E0B' },
  info: { icon: 'information', bg: colors.primary }
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const insets = useSafeAreaInsets();
  const queueRef = useRef([]);
  const currentRef = useRef(null);
  const showingRef = useRef(false);
  const timerRef = useRef(null);
  const processQueueRef = useRef(null);
  const dismissRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const processQueue = useCallback(() => {
    if (showingRef.current) return;
    const nextToast = queueRef.current.shift();
    if (!nextToast) return;

    showingRef.current = true;
    currentRef.current = nextToast;
    setToast(nextToast);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true
    }).start();

    timerRef.current = setTimeout(() => {
      dismissRef.current?.();
    }, nextToast.duration || displayMs);
  }, [progress]);

  processQueueRef.current = processQueue;

  const dismissToast = useCallback((runAction = false) => {
    if (!currentRef.current && !toast) return;
    clearTimer();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true
    }).start(() => {
      const closedToast = currentRef.current;
      setToast(null);
      currentRef.current = null;
      showingRef.current = false;
      if (runAction) closedToast?.onAction?.();
      setTimeout(() => processQueueRef.current?.(), 80);
    });
  }, [clearTimer, progress, toast]);

  dismissRef.current = dismissToast;

  const showToast = useCallback(({ message, type = 'info', actionLabel, onAction, duration }) => {
    if (!message) return;
    queueRef.current.push({ message, type, actionLabel, onAction, duration });
    processQueueRef.current?.();
  }, []);

  const hideToast = useCallback(() => {
    dismissRef.current?.();
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy < -6,
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dy < -20) {
        dismissRef.current?.();
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      }).start();
    }
  }), [progress]);

  const value = useMemo(() => ({ showToast, hideToast }), [hideToast, showToast]);
  const tone = toneMap[toast?.type] || toneMap.info;
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0]
  });

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[toastStyles.wrap, { top: Math.max(insets.top, 0) + 12 }]}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              toastStyles.toast,
              { backgroundColor: tone.bg, opacity: progress, transform: [{ translateY }] }
            ]}
          >
            <View style={toastStyles.iconBubble}>
              <Ionicons name={tone.icon} size={18} color="#fff" />
            </View>
            <Text style={toastStyles.message} numberOfLines={2}>{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable onPress={() => dismissToast(true)} hitSlop={8} style={toastStyles.actionButton}>
                <Text style={toastStyles.action}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '3%',
    right: '3%',
    zIndex: 999
  },
  toast: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600'
  },
  actionButton: {
    minHeight: 32,
    justifyContent: 'center'
  },
  action: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline'
  }
});
