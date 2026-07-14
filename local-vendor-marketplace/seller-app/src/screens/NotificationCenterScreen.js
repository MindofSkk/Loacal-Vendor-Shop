import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, SectionHeader, styles } from '../components/ui';
import { colors } from '../constants';
import { useNotifications } from '../context/NotificationContext';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function NotificationCenterScreen() {
  const { notifications, unreadCount, loading, loadNotifications, markRead, markAllRead } = useNotifications();

  const header = (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Notifications" action={unreadCount ? 'Mark all read' : ''} onAction={markAllRead} />
      <Text style={styles.muted}>{unreadCount ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'No unread alerts.'}</Text>
      <View style={[styles.card, { gap: 8 }]}>
        <Text style={styles.title}>Notification Preferences</Text>
        <Text style={styles.muted}>New Orders: enabled and required</Text>
        <Text style={styles.muted}>Order Updates: enabled</Text>
        <Text style={styles.muted}>Shop Alerts: enabled</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState title="No notifications" message="New orders and order actions will appear here." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => markRead(item)} style={({ pressed }) => [styles.card, { gap: 8, backgroundColor: item.isRead ? '#fff' : '#ECFDF5' }, pressed ? styles.pressed : null]}>
          <View style={styles.between}>
            <View style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: item.isRead ? '#F3F4F6' : '#DCFCE7' }]}>
                <Ionicons name={item.data?.type === 'NEW_ORDER' ? 'bag-check-outline' : 'notifications-outline'} size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.muted}>{item.body || item.message}</Text>
              </View>
            </View>
            {!item.isRead ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} /> : null}
          </View>
          <Text style={styles.small}>{formatTime(item.createdAt)}</Text>
        </Pressable>
      )}
    />
  );
}
