/**
 * @akalin/address_module - Tip Tanımları (types.ts)
 */

import type { IModuleDefinition } from '@akalin/module_core';

export type AdresSeviyesi =
  | 'il'
  | 'ilce'
  | 'koy'
  | 'mahalle'
  | 'cadde'
  | 'disKapi'
  | 'icKapi';

export interface AdresItem {
  id: number;
  hariciId?: number | null;
  ad: string;
  gorunurAd?: string;
  guncellenmeTarihi?: string | null;
}

export interface AdresIstatistik {
  toplamIlSayisi: number;
  toplamIlceSayisi: number;
  toplamKoySayisi: number;
  toplamMahalleSayisi: number;
  toplamCaddeSokakSayisi: number;
  toplamDisKapiSayisi: number;
  toplamIcKapiSayisi: number;
  toplamGenelAdresSayisi: number;
  sonGuncellemeTarihi?: string | null;
}

export interface AdresKayitDetay {
  id: number;
  seviye: string;
  hariciId?: number | null;
  stringHariciId?: string | null;
  ad: string;
  gorunurAd?: string;
  kaynakProvider?: string | null;
  sonGuncelleyenProvider?: string | null;
  olusturulmaTarihi?: string | null;
  guncellenmeTarihi?: string | null;
  sonSenkronizasyonTarihi?: string | null;
  silindiMi: boolean;
  ilAdi?: string | null;
  ilId?: number | null;
  ilceAdi?: string | null;
  ilceId?: number | null;
  koyAdi?: string | null;
  koyId?: number | null;
  mahalleAdi?: string | null;
  mahalleId?: number | null;
  caddeAdi?: string | null;
  caddeId?: number | null;
  disKapiAdi?: string | null;
  disKapiId?: number | null;
  hiyerarsiYolu: string;
}

export interface ProviderHealthStatus {
  key: string;
  ad: string;
  url: string;
  aktifMi: boolean;
  sonSorguTarihi?: string | null;
  sonIstekBasariliMi?: boolean | null;
  sonIslemTuru?: string | null;
  sonMesaj?: string | null;
  toplamIstekSayisi: number;
  basariliIstekSayisi: number;
  basarisizIstekSayisi: number;
  sonCevapSuresiMs?: number | null;
}

export interface ProviderTestSonuc {
  providerKey: string;
  basariliMi: boolean;
  mesaj: string;
  sureMs: number;
  gelenKayitSayisi: number;
  testZamani: string;
}

/**
 * Adres Servisi Adaptör Arayüzü (Veri Katmanı Soyutlaması)
 */
export interface IAddressServiceAdapter {
  getIstatistikler(): Promise<AdresIstatistik>;

  // 1. İller
  getIller(): Promise<AdresItem[]>;
  syncIller(): Promise<any>;
  createIl(data: { ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 2. İlçeler
  getIlceler(ilId: number): Promise<AdresItem[]>;
  syncIlceler(ilId: number): Promise<any>;
  createIlce(data: { ilId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 3. Köyler
  getKoyler(ilceId: number): Promise<AdresItem[]>;
  syncKoyler(ilceId: number): Promise<any>;
  createKoy(data: { ilceId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 4. Mahalleler
  getMahalleler(koyId: number): Promise<AdresItem[]>;
  syncMahalleler(koyId: number): Promise<any>;
  createMahalle(data: { koyId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 5. Cadde / Sokaklar
  getCaddeSokaklar(mahalleId: number): Promise<AdresItem[]>;
  syncCaddeSokaklar(mahalleId: number): Promise<any>;
  createCaddeSokak(data: { mahalleId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 6. Dış Kapılar
  getDisKapilar(caddeSokakId: number): Promise<AdresItem[]>;
  syncDisKapilar(caddeSokakId: number): Promise<any>;
  createDisKapi(data: { caddeSokakId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // 7. İç Kapılar
  getIcKapilar(disKapiId: number): Promise<AdresItem[]>;
  syncIcKapilar(disKapiId: number): Promise<any>;
  createIcKapi(data: { disKapiId: number; ad: string; hariciId?: number | null }): Promise<AdresItem>;

  // Genel Adres & Kayıt Detayı & Sağlayıcılar
  getKayitDetay(seviye: string, id: number): Promise<AdresKayitDetay>;
  getGenelAdres(id: number): Promise<any>;
  getProviderlar(): Promise<ProviderHealthStatus[]>;
  testProvider(providerKey: string): Promise<ProviderTestSonuc>;
  backfillGorunurAd(): Promise<any>;
}

export interface CreateAddressModuleOptions {
  id?: string;
  appName?: string;
  baseRoute?: string;
  order?: number;
  apiBaseUrl?: string;
  adapter?: IAddressServiceAdapter;
  httpClient?: {
    get<T = any>(url: string, config?: any): Promise<{ data: T }>;
    post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
    put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
    delete<T = any>(url: string, config?: any): Promise<{ data: T }>;
  };
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}
