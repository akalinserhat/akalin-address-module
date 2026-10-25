/**
 * @akalin/address_module - Modül Fabrikası (createAddressModule.tsx)
 * @akalin/module_core ModuleRegistry ile tam uyumlu IModuleDefinition üretir.
 */

import React, { lazy } from 'react';
import { MapPin, Layers, Radio, Activity, Compass } from 'lucide-react';
import type { IModuleDefinition } from '@akalin/module_core';
import { CreateAddressModuleOptions } from './types';
import {
  createRestAddressAdapter,
  createMockAddressAdapter,
  AddressModuleProvider,
  setGlobalAddressModuleConfig
} from './adapters/AddressServiceContext';
import { AdresYonetimiPage } from './pages/AdresYonetimi';
import { AdresKayitBilgiPopup } from './components/AdresKayitBilgiPopup';

export function createAddressModule(
  options?: CreateAddressModuleOptions
): IModuleDefinition {
  const id = options?.id || 'adres_yonetimi_modulu';
  const appName = options?.appName || 'Webakus Adres Yönetimi';
  const baseRoute = (options?.baseRoute || '/adres-yonetimi').replace(/\/$/, '');

  const adapter =
    options?.adapter ||
    createRestAddressAdapter({
      apiBaseUrl: options?.apiBaseUrl,
      httpClient: options?.httpClient
    });

  setGlobalAddressModuleConfig({
    adapter,
    appName,
    baseRoute,
    onNotify: options?.onNotify
  });

  const ConnectedAdresPage: React.FC<any> = (props) => (
    <AddressModuleProvider
      adapter={adapter}
      appName={appName}
      baseRoute={baseRoute}
      onNotify={props.onShowToast || options?.onNotify}
    >
      <AdresYonetimiPage onNotify={props.onShowToast || options?.onNotify} {...props} />
    </AddressModuleProvider>
  );

  return {
    id,
    title: 'Adres Yönetimi',
    name: 'Adres Yönetimi',
    description:
      'Türkiye ulusal adres standartları (NVİ / UAVT), 7 kademeli hiyerarşik adres gezgini, sağlayıcı telemetrisi ve istatistik yönetim modülü.',
    version: '1.0.0',
    permissionPrefix: 'adres',
    icon: <MapPin size={20} />,
    iconName: 'MapPin',
    order: options?.order ?? 46,
    isCore: false,
    defaultActive: true,

    routes: [
      {
        path: baseRoute,
        element: <ConnectedAdresPage />,
        title: 'Adres Yönetimi',
        requiredPermissions: ['adres.view']
      },
      {
        path: '/ayarlar/adres-yonetimi',
        element: <ConnectedAdresPage />,
        title: 'Adres Yönetimi',
        requiredPermissions: ['adres.view']
      },
      {
        path: '/ayarlar/AdresYonetimi',
        element: <ConnectedAdresPage />,
        title: 'Adres Yönetimi',
        requiredPermissions: ['adres.view']
      }
    ],

    menuItems: [
      {
        id: 'adres-module-root',
        label: 'Adres Yönetimi',
        icon: <MapPin size={20} />,
        order: 46,
        children: [
          {
            id: 'adres-explorer',
            label: 'Adres Gezgini (UAVT)',
            path: baseRoute,
            icon: <Layers size={18} />,
            requiredPermissions: ['adres.view']
          }
        ]
      }
    ],

    settingsModules: [
      {
        id: 'adres-yonetimi',
        name: 'Adres Yönetimi',
        desc: 'Türkiye ulusal adres standartları, UAVT senkronizasyonu ve sağlayıcı telemetrisi',
        icon: <MapPin size={22} />,
        badge: 'UAVT & MERNİS',
        keywords: 'adres uavt nvi il ilçe mahalle sokak kapı no sağlayıcı hepiyi axa harita telemetri',
        order: options?.order ?? 46,
        hasOwnLayout: true,
        aliases: ['AdresYonetimi', 'adres_yonetimi_modulu', 'adres'],
        component: ConnectedAdresPage
      }
    ],

    cards: [
      {
        id: 'adres-kart',
        category: 'kart',
        titleKey: 'Merkezi Adres Kartı',
        route: baseRoute
      }
    ],

    operations: [
      {
        id: 'adres-uavt-sync',
        category: 'islem',
        titleKey: 'UAVT / NVİ Senkronizasyon ve Veri Bakımı',
        useStandardCrud: false,
        customActions: [
          {
            action: 'goruntule',
            labelKey: 'Adres Hiyerarşisini Görüntüleme',
            description: 'İl, ilçe, köy, mahalle ve bina numaralarını görüntüleme yetkisi.'
          },
          {
            action: 'sync',
            labelKey: 'Sağlayıcıdan UAVT Senkronizasyonu',
            description: 'Resmi sağlayıcı veya servislerden adres kayıtlarını anlık çekip eşitleme yetkisi.'
          },
          {
            action: 'telemetri-test',
            labelKey: 'Sağlayıcı Sağlık ve Telemetri Testi',
            description: 'Entegre adres sağlayıcılarına (Hepiyi, AXA vb.) canlı ping ve sağlık sorgusu gönderme yetkisi.'
          },
          {
            action: 'bakim-onarim',
            labelKey: 'Veri Bakım ve Standardizasyon',
            description: 'Görünür ad (Title Case) onarımı ve toplu veri iyileştirme yetkisi.'
          }
        ]
      }
    ],

    permissions: [
      {
        key: 'adres.view',
        name: 'Adres Modülünü Görüntüleme',
        description: 'Ulusal adres gezginini ve hiyerarşiyi görüntüleme yetkisi.',
        group: 'Adres Yönetimi'
      },
      {
        key: 'adres.sync',
        name: 'UAVT Senkronizasyonu',
        description: 'İl, ilçe ve mahalle düzeyinde resmi servislerden senkronizasyon yetkisi.',
        group: 'Adres Yönetimi'
      },
      {
        key: 'adres.manage',
        name: 'Adres Veri Bakımı & Yönetim',
        description: 'Adres kayıtlarını düzenleme ve bakım işlemlerini çalıştırma yetkisi.',
        group: 'Adres Yönetimi'
      }
    ],

    promotion: {
      title: 'Merkezi Adres Yönetimi Modülü',
      subtitle: "Türkiye'nin 81 ili, 973 ilçesi ve 32.000+ mahallesinde hatasız adres belirleme.",
      description:
        'Merkezi Adres Yönetimi Modülü ile cari, müşteri, sevkiyat ve fatura adreslerini Türkiye MERNİS & Nüfus İdaresi standartlarında tek tıkla seçebilir, kargo ve teslimat hatalarını sıfıra indirebilirsiniz.',
      badge: '%30 İndirim Fırsatı',
      buttonText: 'Modülü Hemen Satın Al',
      purchaseUrl: '/abonelik/moduller/MOD_ADRES',
      icon: 'MapPin',
      benefits: [
        '81 İl, 973 İlçe, Mahalle ve Sokak bazında anlık hiyerarşik arama',
        'Fatura ve sevk adreslerinde MERNİS / VUK tam uyumluluğu',
        'Kargo ve lojistik entegrasyonlarında sıfır teslimat hatası',
        'Cari, Sipariş, İrsaliye ve Depo hareketlerinde tek tıkla otomatik tamamlama'
      ]
    },

    components: {
      AdresYonetimiPage: ConnectedAdresPage,
      AdresKayitBilgiPopup
    }
  };
}

export default createAddressModule;
