import { WEEK_DAYS } from '../models/Shop.js';

const minutesFromTime = (time) => {
  const [hours, minutes] = String(time || '00:00')
    .split(':')
    .map(Number);
  return hours * 60 + minutes;
};

export const defaultWorkingHours = () => WEEK_DAYS.map((day) => ({ day, openTime: '09:00', closeTime: '21:00', closed: false }));

export const getOpenStatus = (shop, date = new Date()) => {
  if (shop.temporaryClosure?.enabled) {
    return {
      isOpenNow: false,
      label: 'Temporarily Closed',
      message: 'This shop is temporarily closed.'
    };
  }

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = shop.workingHours?.find((entry) => entry.day === dayName);

  if (!shop.workingHours?.length || !todayHours) {
    return { isOpenNow: true, label: 'Open Now', message: 'Open Now' };
  }

  if (todayHours.closed) {
    return { isOpenNow: false, label: 'Closed', message: 'Closed today.' };
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = minutesFromTime(todayHours.openTime);
  const closeMinutes = minutesFromTime(todayHours.closeTime);
  const isOpenNow =
    openMinutes <= closeMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;

  return {
    isOpenNow,
    label: isOpenNow ? 'Open Now' : 'Closed',
    message: isOpenNow ? 'Open Now' : `Closed. Opens at ${todayHours.openTime}.`
  };
};

export const getDistanceKm = (from, to) => {
  const fromLat = Number(from?.latitude);
  const fromLng = Number(from?.longitude);
  const toLat = Number(to?.latitude);
  const toLng = Number(to?.longitude);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

export const getDeliveryEligibility = (shop, customerLocation) => {
  const distanceKm = getDistanceKm(customerLocation, shop.location);
  const radiusKm = Number(shop.deliverySettings?.radiusKm || shop.deliveryRadiusKm || 5);

  if (distanceKm == null) {
    return {
      distanceKm: null,
      radiusKm,
      canDeliver: true,
      message: 'Delivery distance will be confirmed by seller.'
    };
  }

  return {
    distanceKm,
    radiusKm,
    canDeliver: distanceKm <= radiusKm,
    message: distanceKm <= radiusKm ? 'Delivery available.' : 'This shop does not deliver to your location.'
  };
};

export const decorateShopForCustomer = (shop, customerLocation = {}) => {
  const plainShop = typeof shop.toObject === 'function' ? shop.toObject() : shop;
  const openStatus = getOpenStatus(plainShop);
  const deliveryEligibility = getDeliveryEligibility(plainShop, customerLocation);

  return {
    ...plainShop,
    openStatus,
    distanceKm: deliveryEligibility.distanceKm,
    deliveryEligibility
  };
};
