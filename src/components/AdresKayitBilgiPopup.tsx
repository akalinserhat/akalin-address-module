/**
 * @akalin/address_module - Adres Kayıt Bilgisi Popup Bileşeni (AdresKayitBilgiPopup.tsx)
 * @akalin/ui BasePopup sınıfı üzerine kurulu;
 * Seçili adres kaydının UAVT kimliği, veri kaynağı (Sabit Veritabanı / Hepiyi / Axa),
 * denetim tarihçesi ve hiyerarşik üst yolunu gösteren detay modalı.
 */

import React, { useState, useEffect } from 'react';
import { 
  Info, 
  MapPin, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  Calendar, 
  Database, 
  Radio, 
  Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BasePopup } from '@akalin/ui';
import { useAddressService } from '../adapters/AddressServiceContext';
import { AdresKayitDetay } from '../types';

export interface AdresKayitBilgiPopupProps {
  isOpen: boolean;
  onClose: () => void;
  seviye: string;
  recordId: number | null;
  onSync?: (() => Promise<void> | void) | null;
}

export const AdresKayitBilgiPopup: React.FC<AdresKayitBilgiPopupProps> = ({
  isOpen,
  onClose,
  seviye,
  recordId,
  onSync
}) => {
  const { t } = useTranslation();
  const { adapter } = useAddressService();
  const [detay, setDetay] = useState<AdresKayitDetay | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && recordId && seviye) {
      loadDetay();
    } else {
      setDetay(null);
    }
  }, [isOpen, recordId, seviye]);

  const loadDetay = async () => {
    if (!recordId) return;
    try {
      setLoading(true);
      const data = await adapter.getKayitDetay(seviye, recordId);
      setDetay(data);
    } catch {
      toast.error(t('kayit_detay_hatasi', 'Kayıt detayları yüklenirken hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: any, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    toast.success(`${label} ${t('kopyalandi', 'kopyalandı.')}`);
  };

  const handleTriggerSync = async () => {
    if (!onSync) return;
    try {
      setSyncing(true);
      await onSync();
      await loadDetay();
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('adres_kayit_detayi', 'Adres Kayıt Detayı')} - ${detay?.seviye || ''}`}
      size="lg"
      hideFooter={true}
    >
      <div className="adres-popup-content">
        {loading ? (
          <div className="flex items-center justify-center p-32 text-secondary">
            <RefreshCw size={24} className="spinning mr-8" />
            <span>{t('yukleniyor', 'Yükleniyor...')}</span>
          </div>
        ) : !detay ? (
          <div className="p-24 text-center text-secondary">
            {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
          </div>
        ) : (
          <>
            {/* HERO KİMLİK KARTI */}
            <div className="adres-popup-hero">
              <div className="adres-popup-hero-info">
                <div className="flex items-center gap-8 mb-4">
                  <span className="chip-primary">{detay.seviye}</span>
                  <span className="text-12 text-secondary">ID: #{detay.id}</span>
                </div>
                <h3 className="adres-popup-hero-title">
                  {detay.gorunurAd || detay.ad}
                </h3>
                {detay.gorunurAd && detay.gorunurAd !== detay.ad && (
                  <span className="text-12 text-secondary">
                    {t('sistem_adi', 'Sistem Adı')}: {detay.ad}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-8">
                {detay.hariciId ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(detay.hariciId, 'UAVT Kodu')}
                    className="btn btn-outline flex items-center gap-6 py-6 px-12 text-13"
                    title={t('uavt_kodu_kopyala', 'UAVT Kodunu Kopyala')}
                  >
                    <Copy size={14} />
                    <span>UAVT: {detay.hariciId}</span>
                  </button>
                ) : (
                  <span className="chip-secondary text-12">
                    {t('uavt_kodu_yok', 'UAVT Kodu Yok')}
                  </span>
                )}
              </div>
            </div>

            {/* 2 SÜTUNLU BİLGİ KARTLARI */}
            <div className="adres-popup-grid">
              {/* KART 1: SAĞLAYICI & KAYNAK */}
              <div className="adres-popup-card">
                <div className="adres-popup-card-header">
                  <Radio size={16} className="text-accent" />
                  <span>{t('saglayici_ve_kaynak', 'Sağlayıcı ve Veri Kaynağı')}</span>
                </div>
                <div className="adres-popup-card-rows">
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('veri_kaynagi', 'Veri Kaynağı')}:</span>
                    <span className="adres-popup-value text-accent">
                      {detay.kaynakProvider || 'Sabit Veritabanı'}
                    </span>
                  </div>
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('son_guncelleyen_provider', 'Son Güncelleyen Sağlayıcı')}:</span>
                    <span className="adres-popup-value">
                      {detay.sonGuncelleyenProvider || '-'}
                    </span>
                  </div>
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('dogrulama_durumu', 'Doğrulama Durumu')}:</span>
                    <span className="flex items-center gap-4 text-success font-medium">
                      <CheckCircle2 size={15} />
                      <span>{detay.hariciId ? t('nvi_dogrulandi', 'NVİ Doğrulandı') : t('yerel_kayit', 'Yerel Kayıt')}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* KART 2: DENETİM & ZAMAN ÇİZELGESİ */}
              <div className="adres-popup-card">
                <div className="adres-popup-card-header">
                  <Calendar size={16} className="text-accent" />
                  <span>{t('zaman_cizelgesi_ve_denetim', 'Zaman Çizelgesi & Denetim')}</span>
                </div>
                <div className="adres-popup-card-rows">
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('olusturulma_tarihi', 'İlk Aktarım / Giriş')}:</span>
                    <span className="adres-popup-value">{formatDate(detay.olusturulmaTarihi)}</span>
                  </div>
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('guncellenme_tarihi', 'Son Güncelleme')}:</span>
                    <span className="adres-popup-value">{formatDate(detay.guncellenmeTarihi)}</span>
                  </div>
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('son_senkronizasyon', 'Son Senkronizasyon')}:</span>
                    <span className="adres-popup-value">{formatDate(detay.sonSenkronizasyonTarihi)}</span>
                  </div>
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('durum', 'Durum')}:</span>
                    <span className={detay.silindiMi ? 'text-danger font-medium' : 'text-success font-medium'}>
                      {detay.silindiMi ? t('silinmis_pasif', 'Pasif (Silinmiş)') : t('aktif', 'Aktif')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KART 3: HİYERARŞİK KONUM (AÇIK ADRES YOLU) */}
            <div className="adres-popup-card">
              <div className="adres-popup-card-header">
                <Layers size={16} className="text-accent" />
                <span>{t('hiyerarsik_konum', 'Hiyerarşik Konum & Zincir')}</span>
              </div>
              <div className="adres-popup-card-rows">
                <div className="adres-popup-row">
                  <span className="adres-popup-label">{t('tam_yol', 'Hiyerarşi Yolu')}:</span>
                  <span className="adres-popup-value text-accent font-semibold">
                    {detay.hiyerarsiYolu || '-'}
                  </span>
                </div>
                {detay.ilAdi && (
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('bagli_il', 'Bağlı İl')}:</span>
                    <span className="adres-popup-value">{detay.ilAdi} {detay.ilId ? `(#${detay.ilId})` : ''}</span>
                  </div>
                )}
                {detay.ilceAdi && (
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('bagli_ilce', 'Bağlı İlçe')}:</span>
                    <span className="adres-popup-value">{detay.ilceAdi} {detay.ilceId ? `(#${detay.ilceId})` : ''}</span>
                  </div>
                )}
                {detay.mahalleAdi && (
                  <div className="adres-popup-row">
                    <span className="adres-popup-label">{t('bagli_mahalle', 'Bağlı Mahalle')}:</span>
                    <span className="adres-popup-value">{detay.mahalleAdi} {detay.mahalleId ? `(#${detay.mahalleId})` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ALT BUTONLAR */}
            <div className="flex items-center justify-between pt-12 border-t border-glass-border">
              <div>
                {onSync && (
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    disabled={syncing}
                    className="btn btn-outline flex items-center gap-6"
                  >
                    <RefreshCw size={15} className={syncing ? 'spinning' : ''} />
                    <span>{syncing ? t('senkronize_ediliyor', 'Eşitleniyor...') : t('saglayicidan_esitle', 'Sağlayıcıdan Eşitle (Sync)')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary px-20"
                >
                  {t('kapat', 'Kapat')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BasePopup>
  );
};

export default AdresKayitBilgiPopup;
