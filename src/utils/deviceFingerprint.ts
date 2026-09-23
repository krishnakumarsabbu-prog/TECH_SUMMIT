import type { DeviceMetadata } from '../types';
import { getDeviceId } from './storage';

export function collectDeviceMetadata(): DeviceMetadata {
  const nav = navigator;
  const screen = window.screen;

  return {
    deviceId: getDeviceId(),
    userAgent: nav.userAgent,
    platform: nav.platform || 'unknown',
    language: nav.language || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    timezoneOffset: new Date().getTimezoneOffset(),
    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    touchSupport: 'ontouchstart' in window || nav.maxTouchPoints > 0,
    online: nav.onLine,
  };
}
