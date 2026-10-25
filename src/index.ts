/**
 * @akalin/address_module - Ana Giriş Noktası (index.ts)
 */

export * from './types';
export * from './defaults/defaultAddresses';
export * from './adapters/AddressServiceContext';
export * from './components/AdresKayitBilgiPopup';
export * from './pages/AdresYonetimi';
export { createAddressModule, AdresYonetimiModule, default } from './createAddressModule';
