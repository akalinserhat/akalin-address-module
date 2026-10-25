/**
 * @akalin/address_module - Örnek / Varsayılan Adres Verileri (defaultAddresses.ts)
 */

import { AdresItem, AdresIstatistik, ProviderHealthStatus } from '../types';

export const DEFAULT_ILLER: AdresItem[] = [
  { id: 1, ad: 'ADANA', gorunurAd: 'Adana', hariciId: 1 },
  { id: 6, ad: 'ANKARA', gorunurAd: 'Ankara', hariciId: 6 },
  { id: 7, ad: 'ANTALYA', gorunurAd: 'Antalya', hariciId: 7 },
  { id: 16, ad: 'BURSA', gorunurAd: 'Bursa', hariciId: 16 },
  { id: 34, ad: 'İSTANBUL', gorunurAd: 'İstanbul', hariciId: 34 },
  { id: 35, ad: 'İZMİR', gorunurAd: 'İzmir', hariciId: 35 },
  { id: 41, ad: 'KOCAELİ', gorunurAd: 'Kocaeli', hariciId: 41 },
  { id: 42, ad: 'KONYA', gorunurAd: 'Konya', hariciId: 42 }
];

export const DEFAULT_ILCELER_ISTANBUL: AdresItem[] = [
  { id: 101, ad: 'KADIKÖY', gorunurAd: 'Kadıköy', hariciId: 101 },
  { id: 102, ad: 'BEŞİKTAŞ', gorunurAd: 'Beşiktaş', hariciId: 102 },
  { id: 103, ad: 'ÜSKÜDAR', gorunurAd: 'Üsküdar', hariciId: 103 },
  { id: 104, ad: 'ŞİŞLİ', gorunurAd: 'Şişli', hariciId: 104 },
  { id: 105, ad: 'MALTEPE', gorunurAd: 'Maltepe', hariciId: 105 },
  { id: 106, ad: 'SARIYER', gorunurAd: 'Sarıyer', hariciId: 106 }
];

export const DEFAULT_ISTATISTIKLER: AdresIstatistik = {
  toplamIlSayisi: 81,
  toplamIlceSayisi: 973,
  toplamKoySayisi: 18240,
  toplamMahalleSayisi: 32150,
  toplamCaddeSokakSayisi: 540200,
  toplamDisKapiSayisi: 3200100,
  toplamIcKapiSayisi: 8900400,
  toplamGenelAdresSayisi: 12450,
  sonGuncellemeTarihi: new Date().toISOString()
};

export const DEFAULT_PROVIDERS: ProviderHealthStatus[] = [
  {
    key: 'SabitVeritabani',
    ad: 'Ulusal NVİ / Sabit Veritabanı',
    url: 'internal://database/uavt',
    aktifMi: true,
    sonSorguTarihi: new Date().toISOString(),
    sonIstekBasariliMi: true,
    sonIslemTuru: 'Yerel Okuma',
    sonMesaj: 'Sistem operasyonel.',
    toplamIstekSayisi: 1420,
    basariliIstekSayisi: 1420,
    basarisizIstekSayisi: 0,
    sonCevapSuresiMs: 8
  },
  {
    key: 'HepiyiSigorta',
    ad: 'Hepiyi Sigorta UAVT Servisi',
    url: 'https://servis.hepiyi.com.tr/api/Adres/UAVT',
    aktifMi: true,
    sonSorguTarihi: new Date().toISOString(),
    sonIstekBasariliMi: true,
    sonIslemTuru: 'Cadde / Sokak Sorgusu',
    sonMesaj: 'Bağlantı başarılı (200 OK)',
    toplamIstekSayisi: 680,
    basariliIstekSayisi: 672,
    basarisizIstekSayisi: 8,
    sonCevapSuresiMs: 145
  },
  {
    key: 'AxaSigorta',
    ad: 'AXA Sigorta Adres Entegrasyonu',
    url: 'https://api.axasigorta.com.tr/ws/AddressService',
    aktifMi: true,
    sonSorguTarihi: new Date().toISOString(),
    sonIstekBasariliMi: true,
    sonIslemTuru: 'Dış Kapı Doğrulama',
    sonMesaj: 'Bağlantı aktif.',
    toplamIstekSayisi: 310,
    basariliIstekSayisi: 305,
    basarisizIstekSayisi: 5,
    sonCevapSuresiMs: 198
  }
];
