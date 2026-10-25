/**
 * @akalin/address_module - Servis Adaptörleri ve React Context (AddressServiceContext.tsx)
 * Hem REST (/api/AdresYonetimi), hem de Mock/Bellek adaptörlerini destekler.
 * Tüketen uygulama kendi httpClient (axios örneği vb.) nesnesini enjekte edebilir.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  AdresItem,
  AdresIstatistik,
  AdresKayitDetay,
  IAddressServiceAdapter,
  ProviderHealthStatus,
  ProviderTestSonuc
} from '../types';
import {
  DEFAULT_ILLER,
  DEFAULT_ILCELER_ISTANBUL,
  DEFAULT_ISTATISTIKLER,
  DEFAULT_PROVIDERS
} from '../defaults/defaultAddresses';

export interface AddressContextValue {
  adapter: IAddressServiceAdapter;
  appName?: string;
  baseRoute?: string;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const AddressModuleContext = createContext<AddressContextValue | null>(null);

let globalConfig: AddressContextValue = {
  adapter: createMockAddressAdapter(),
  appName: 'Webakus Adres Yönetimi',
  baseRoute: '/adres-yonetimi'
};

export function setGlobalAddressModuleConfig(config: Partial<AddressContextValue>) {
  globalConfig = { ...globalConfig, ...config };
}

export function getGlobalAddressModuleConfig(): AddressContextValue {
  return globalConfig;
}

export interface AddressModuleProviderProps {
  adapter?: IAddressServiceAdapter;
  appName?: string;
  baseRoute?: string;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  children: ReactNode;
}

export const AddressModuleProvider: React.FC<AddressModuleProviderProps> = ({
  adapter,
  appName,
  baseRoute,
  onNotify,
  children
}) => {
  const value: AddressContextValue = {
    adapter: adapter || globalConfig.adapter,
    appName: appName || globalConfig.appName,
    baseRoute: baseRoute || globalConfig.baseRoute,
    onNotify: onNotify || globalConfig.onNotify
  };

  return (
    <AddressModuleContext.Provider value={value}>
      {children}
    </AddressModuleContext.Provider>
  );
};

export function useAddressService(): AddressContextValue {
  const context = useContext(AddressModuleContext);
  return context || globalConfig;
}

/**
 * 1) REST Tabanlı Webakus API Adaptörü
 */
export function createRestAddressAdapter(options?: {
  apiBaseUrl?: string;
  httpClient?: {
    get<T = any>(url: string, config?: any): Promise<{ data: T }>;
    post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
    put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
    delete<T = any>(url: string, config?: any): Promise<{ data: T }>;
  };
}): IAddressServiceAdapter {
  const base = (options?.apiBaseUrl || '').replace(/\/$/, '');
  const prefix = `${base}/api/AdresYonetimi`;

  interface IGenericHttpClient {
    get<T = any>(url: string, config?: any): Promise<{ data: T }>;
    post<T = any>(url: string, body?: any, config?: any): Promise<{ data: T }>;
    put<T = any>(url: string, body?: any, config?: any): Promise<{ data: T }>;
    delete<T = any>(url: string, config?: any): Promise<{ data: T }>;
  }

  const getClient = (): IGenericHttpClient => {
    if (options?.httpClient) return options.httpClient as IGenericHttpClient;
    if (typeof window !== 'undefined' && (window as any).axios) {
      return (window as any).axios as IGenericHttpClient;
    }
    // Basit fetch wrapper fallback
    return {
      async get<T>(url: string): Promise<{ data: T }> {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return { data: await res.json() };
      },
      async post<T>(url: string, body?: any): Promise<{ data: T }> {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return { data: await res.json() };
      },
      async put<T>(url: string, body?: any): Promise<{ data: T }> {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return { data: await res.json() };
      },
      async delete<T>(url: string): Promise<{ data: T }> {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return { data: await res.json() };
      }
    };
  };

  return {
    async getIstatistikler(): Promise<AdresIstatistik> {
      const client = getClient();
      const res = await client.get<AdresIstatistik>(`${prefix}/Istatistikler`);
      return res.data;
    },

    // 1. İller
    async getIller(): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/Iller`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncIller(): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncIller`);
      return res.data;
    },
    async createIl(data: { ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/Iller`, data);
      return res.data;
    },

    // 2. İlçeler
    async getIlceler(ilId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/Ilceler/${ilId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncIlceler(ilId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncIlceler/${ilId}`);
      return res.data;
    },
    async createIlce(data: { ilId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/Ilceler`, data);
      return res.data;
    },

    // 3. Köyler
    async getKoyler(ilceId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/Koyler/${ilceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncKoyler(ilceId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncKoyler/${ilceId}`);
      return res.data;
    },
    async createKoy(data: { ilceId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/Koyler`, data);
      return res.data;
    },

    // 4. Mahalleler
    async getMahalleler(koyId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/Mahalleler/${koyId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncMahalleler(koyId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncMahalleler/${koyId}`);
      return res.data;
    },
    async createMahalle(data: { koyId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/Mahalleler`, data);
      return res.data;
    },

    // 5. Cadde / Sokaklar
    async getCaddeSokaklar(mahalleId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/CaddeSokaklar/${mahalleId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncCaddeSokaklar(mahalleId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncCaddeSokaklar/${mahalleId}`);
      return res.data;
    },
    async createCaddeSokak(data: { mahalleId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/CaddeSokaklar`, data);
      return res.data;
    },

    // 6. Dış Kapılar
    async getDisKapilar(caddeSokakId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/DisKapilar/${caddeSokakId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncDisKapilar(caddeSokakId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncDisKapilar/${caddeSokakId}`);
      return res.data;
    },
    async createDisKapi(data: { caddeSokakId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/DisKapilar`, data);
      return res.data;
    },

    // 7. İç Kapılar
    async getIcKapilar(disKapiId: number): Promise<AdresItem[]> {
      const client = getClient();
      const res = await client.get<AdresItem[]>(`${prefix}/IcKapilar/${disKapiId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    async syncIcKapilar(disKapiId: number): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/SyncIcKapilar/${disKapiId}`);
      return res.data;
    },
    async createIcKapi(data: { disKapiId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const client = getClient();
      const res = await client.post<AdresItem>(`${prefix}/IcKapilar`, data);
      return res.data;
    },

    // Genel Adres & Kayıt Detayı & Sağlayıcılar
    async getKayitDetay(seviye: string, id: number): Promise<AdresKayitDetay> {
      const client = getClient();
      const res = await client.get<AdresKayitDetay>(`${prefix}/KayitDetay?seviye=${encodeURIComponent(seviye)}&id=${id}`);
      return res.data;
    },

    async getGenelAdres(id: number): Promise<any> {
      const client = getClient();
      const res = await client.get(`${prefix}/GenelAdres/${id}`);
      return res.data;
    },

    async getProviderlar(): Promise<ProviderHealthStatus[]> {
      const client = getClient();
      const res = await client.get<ProviderHealthStatus[]>(`${prefix}/Providerlar`);
      return Array.isArray(res.data) ? res.data : [];
    },

    async testProvider(providerKey: string): Promise<ProviderTestSonuc> {
      const client = getClient();
      const res = await client.post<ProviderTestSonuc>(`${prefix}/TestProvider`, { providerKey });
      return res.data;
    },

    async backfillGorunurAd(): Promise<any> {
      const client = getClient();
      const res = await client.post(`${prefix}/BackfillGorunurAd`);
      return res.data;
    }
  };
}

/**
 * 2) Mock / Bellek Tabanlı Adaptör (Testler & Offline mod için)
 */
export function createMockAddressAdapter(): IAddressServiceAdapter {
  let iller = [...DEFAULT_ILLER];
  let ilcelerMap: Record<number, AdresItem[]> = {
    34: [...DEFAULT_ILCELER_ISTANBUL]
  };
  let stats = { ...DEFAULT_ISTATISTIKLER };
  let providers = [...DEFAULT_PROVIDERS];

  return {
    async getIstatistikler(): Promise<AdresIstatistik> {
      return { ...stats };
    },
    async getIller(): Promise<AdresItem[]> {
      return [...iller];
    },
    async syncIller(): Promise<any> {
      return { message: 'İller başarıyla güncellendi (Mock).' };
    },
    async createIl(data: { ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const newItem: AdresItem = {
        id: Math.max(0, ...iller.map((i) => i.id)) + 1,
        ad: data.ad.toUpperCase(),
        gorunurAd: data.ad,
        hariciId: data.hariciId || null
      };
      iller.push(newItem);
      return newItem;
    },
    async getIlceler(ilId: number): Promise<AdresItem[]> {
      return ilcelerMap[ilId] ? [...ilcelerMap[ilId]] : [];
    },
    async syncIlceler(ilId: number): Promise<any> {
      return { message: `İlçe senkronizasyonu tamamlandı (İl: ${ilId})` };
    },
    async createIlce(data: { ilId: number; ad: string; hariciId?: number | null }): Promise<AdresItem> {
      const list = ilcelerMap[data.ilId] || [];
      const newItem: AdresItem = {
        id: Math.max(0, ...list.map((i) => i.id), 100) + 1,
        ad: data.ad.toUpperCase(),
        gorunurAd: data.ad,
        hariciId: data.hariciId || null
      };
      ilcelerMap[data.ilId] = [...list, newItem];
      return newItem;
    },
    async getKoyler(): Promise<AdresItem[]> {
      return [{ id: 1, ad: 'MERKEZ KÖY', gorunurAd: 'Merkez Köy' }];
    },
    async syncKoyler(): Promise<any> {
      return { message: 'Köyler senkronize edildi.' };
    },
    async createKoy(data): Promise<AdresItem> {
      return { id: 99, ad: data.ad, gorunurAd: data.ad };
    },
    async getMahalleler(): Promise<AdresItem[]> {
      return [{ id: 1, ad: 'ÖRNEK MAHALLESİ', gorunurAd: 'Örnek Mahallesi' }];
    },
    async syncMahalleler(): Promise<any> {
      return { message: 'Mahalleler senkronize edildi.' };
    },
    async createMahalle(data): Promise<AdresItem> {
      return { id: 99, ad: data.ad, gorunurAd: data.ad };
    },
    async getCaddeSokaklar(): Promise<AdresItem[]> {
      return [{ id: 1, ad: 'ATATÜRK CADDESİ', gorunurAd: 'Atatürk Caddesi' }];
    },
    async syncCaddeSokaklar(): Promise<any> {
      return { message: 'Cadde / sokaklar senkronize edildi.' };
    },
    async createCaddeSokak(data): Promise<AdresItem> {
      return { id: 99, ad: data.ad, gorunurAd: data.ad };
    },
    async getDisKapilar(): Promise<AdresItem[]> {
      return [{ id: 1, ad: 'NO: 1', gorunurAd: '1' }];
    },
    async syncDisKapilar(): Promise<any> {
      return { message: 'Dış kapılar senkronize edildi.' };
    },
    async createDisKapi(data): Promise<AdresItem> {
      return { id: 99, ad: data.ad, gorunurAd: data.ad };
    },
    async getIcKapilar(): Promise<AdresItem[]> {
      return [{ id: 1, ad: 'DAİRE: 1', gorunurAd: '1' }];
    },
    async syncIcKapilar(): Promise<any> {
      return { message: 'İç kapılar senkronize edildi.' };
    },
    async createIcKapi(data): Promise<AdresItem> {
      return { id: 99, ad: data.ad, gorunurAd: data.ad };
    },
    async getKayitDetay(seviye: string, id: number): Promise<AdresKayitDetay> {
      return {
        id,
        seviye,
        ad: 'Örnek Kayıt',
        gorunurAd: 'Örnek Kayıt',
        hariciId: id * 1000,
        kaynakProvider: 'SabitVeritabani',
        sonGuncelleyenProvider: 'UAVT Standart',
        olusturulmaTarihi: new Date().toISOString(),
        silindiMi: false,
        hiyerarsiYolu: 'Türkiye / İstanbul / Kadıköy'
      };
    },
    async getGenelAdres(id: number): Promise<any> {
      return { id, adresMetni: 'Örnek Genel Adres Metni' };
    },
    async getProviderlar(): Promise<ProviderHealthStatus[]> {
      return [...providers];
    },
    async testProvider(providerKey: string): Promise<ProviderTestSonuc> {
      return {
        providerKey,
        basariliMi: true,
        mesaj: `${providerKey} bağlantı testi başarılı. 200 OK`,
        sureMs: 65,
        gelenKayitSayisi: 81,
        testZamani: new Date().toISOString()
      };
    },
    async backfillGorunurAd(): Promise<any> {
      return { message: 'Tüm görünür adlar güncellendi.' };
    }
  };
}
