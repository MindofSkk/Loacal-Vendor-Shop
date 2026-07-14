import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigateToSellerOrderDetails = (order) => {
  if (!navigationRef.isReady() || !order) return;

  navigationRef.navigate('AppTabs', {
    screen: 'Orders',
    params: {
      screen: 'OrderDetails',
      params: { order }
    }
  });
};
