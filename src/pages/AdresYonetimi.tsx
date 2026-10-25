/**
 * @akalin/address_module - Adres Yönetimi Modülü Sayfası (AdresYonetimi.tsx)
 * BaseSystemPage ve TabLayout mimarisi üzerine kurulu;
 * 7 Kademeli Adres Gezgini (Miller Columns Layout: İl → İlçe → Köy → Mahalle → Cadde/Sokak → Dış Kapı → İç Kapı),
 * UAVT Senkronizasyonu, Sağlayıcı Sağlık Monitörü ve Veri Standartlaştırma aracı.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Building2, 
  Compass, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Search, 
  ChevronRight, 
  Database,
  Info,
  Copy,
  Home,
  Hash,
  Key,
  Radio,
  Shield,
  Clock,
  Activity,
  Zap,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BaseSystemPage } from '@akalin/ui';
import { useAddressService } from '../adapters/AddressServiceContext';
import { AdresKayitBilgiPopup } from '../components/AdresKayitBilgiPopup';
import { AdresItem, AdresIstatistik, ProviderHealthStatus } from '../types';
import '../styles/AdresYonetimi.css';

export interface AdresYonetimiProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdresYonetimiPage: React.FC<AdresYonetimiProps> = ({ onNotify }) => {
  const { t } = useTranslation();
  const { adapter, onNotify: contextNotify } = useAddressService();
  const notify = onNotify || contextNotify;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (notify) {
      notify(msg, type);
    } else {
      if (type === 'error') toast.error(msg);
      else toast.success(msg);
    }
  };

  const [activeTab, setActiveTab] = useState('explorer');

  // Konteyner ref (yatay kaydırma için)
  const cascadeContainerRef = useRef<HTMLDivElement>(null);

  // Sağlayıcılar State
  const [providers, setProviders] = useState<ProviderHealthStatus[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Kayıt Detay Bilgi Popup State'i
  const [infoPopup, setInfoPopup] = useState<{
    isOpen: boolean;
    seviye: string;
    recordId: number | null;
    onSync?: (() => Promise<void> | void) | null;
  }>({
    isOpen: false,
    seviye: '',
    recordId: null,
    onSync: null
  });

  const handleOpenInfo = (e: React.MouseEvent, seviye: string, recordId: number, onSync: (() => Promise<void> | void) | null = null) => {
    e.stopPropagation();
    setInfoPopup({
      isOpen: true,
      seviye,
      recordId,
      onSync
    });
  };

  const handleCloseInfo = () => {
    setInfoPopup(prev => ({ ...prev, isOpen: false }));
  };

  // İstatistikler State
  const [stats, setStats] = useState<AdresIstatistik | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 1. İller State
  const [iller, setIller] = useState<AdresItem[]>([]);
  const [illerLoading, setIllerLoading] = useState(true);
  const [selectedIl, setSelectedIl] = useState<AdresItem | null>(null);
  const [ilSearch, setIlSearch] = useState('');
  const [syncingIl, setSyncingIl] = useState(false);

  // 2. İlçeler State
  const [ilceler, setIlceler] = useState<AdresItem[]>([]);
  const [ilcelerLoading, setIlcelerLoading] = useState(false);
  const [selectedIlce, setSelectedIlce] = useState<AdresItem | null>(null);
  const [ilceSearch, setIlceSearch] = useState('');
  const [syncingIlce, setSyncingIlce] = useState(false);

  // 3. Köyler State
  const [koyler, setKoyler] = useState<AdresItem[]>([]);
  const [koylerLoading, setKoylerLoading] = useState(false);
  const [selectedKoy, setSelectedKoy] = useState<AdresItem | null>(null);
  const [koySearch, setKoySearch] = useState('');
  const [syncingKoy, setSyncingKoy] = useState(false);

  // 4. Mahalleler State
  const [mahalleler, setMahalleler] = useState<AdresItem[]>([]);
  const [mahallelerLoading, setMahallelerLoading] = useState(false);
  const [selectedMahalle, setSelectedMahalle] = useState<AdresItem | null>(null);
  const [mahalleSearch, setMahalleSearch] = useState('');
  const [syncingMahalle, setSyncingMahalle] = useState(false);

  // 5. Cadde / Sokaklar State
  const [caddeSokaklar, setCaddeSokaklar] = useState<AdresItem[]>([]);
  const [caddeLoading, setCaddeLoading] = useState(false);
  const [selectedCadde, setSelectedCadde] = useState<AdresItem | null>(null);
  const [caddeSearch, setCaddeSearch] = useState('');
  const [syncingCadde, setSyncingCadde] = useState(false);

  // 6. Dış Kapılar State
  const [disKapilar, setDisKapilar] = useState<AdresItem[]>([]);
  const [disKapiLoading, setDisKapiLoading] = useState(false);
  const [selectedDisKapi, setSelectedDisKapi] = useState<AdresItem | null>(null);
  const [disKapiSearch, setDisKapiSearch] = useState('');
  const [syncingDisKapi, setSyncingDisKapi] = useState(false);

  // 7. İç Kapılar State
  const [icKapilar, setIcKapilar] = useState<AdresItem[]>([]);
  const [icKapiLoading, setIcKapiLoading] = useState(false);
  const [selectedIcKapi, setSelectedIcKapi] = useState<AdresItem | null>(null);
  const [icKapiSearch, setIcKapiSearch] = useState('');
  const [syncingIcKapi, setSyncingIcKapi] = useState(false);

  // Bakım State
  const [backfilling, setBackfilling] = useState(false);

  // İlk yüklemede istatistikleri ve illeri çek
  useEffect(() => {
    loadStats();
    loadIller();
    loadProviders();
  }, []);

  useEffect(() => {
    if (activeTab === 'health') {
      loadStats();
      loadProviders();
    }
  }, [activeTab]);

  const scrollToColumn = (index: number) => {
    setTimeout(() => {
      if (cascadeContainerRef.current) {
        const targetScroll = Math.max(0, (index - 1) * 306);
        cascadeContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }, 100);
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adapter.getIstatistikler();
      setStats(data);
    } catch {
      // sessizce geç
    } finally {
      setStatsLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const data = await adapter.getProviderlar();
      setProviders(data);
    } catch {
      // sessiz
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleTestProvider = async (providerKey: string) => {
    try {
      setTestingProvider(providerKey);
      const res = await adapter.testProvider(providerKey);
      if (res.basariliMi) {
        showToast(res.mesaj, 'success');
      } else {
        showToast(res.mesaj, 'error');
      }
      await loadProviders();
    } catch {
      showToast(t('provider_test_hatasi', 'Sağlayıcı testi sırasında hata oluştu.'), 'error');
    } finally {
      setTestingProvider(null);
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return t('henuz_sorgu_yapilmadi', 'Henüz sorgu yapılmadı');
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  const isKibrisIl = (il: AdresItem) => {
    if (!il) return false;
    if (il.hariciId && (il.hariciId > 81 || il.hariciId < 1)) return true;
    const name = (il.gorunurAd || il.ad || '').toLocaleUpperCase('tr-TR');
    return name.includes('KIBRIS') || name.includes('LEFKOŞ') || name.includes('GİRNE') || name.includes('MAĞUSA');
  };

  const loadIller = async () => {
    try {
      setIllerLoading(true);
      const data = await adapter.getIller();
      const filtered = Array.isArray(data) ? data.filter(il => !isKibrisIl(il)) : [];
      setIller(filtered);
      if (filtered.length > 0 && !selectedIl) {
        handleSelectIl(filtered[0]);
      }
    } catch (err) {
      console.error('İller yüklenirken hata oluştu:', err);
      showToast(t('iller_yuklenirken_hata', 'İller yüklenirken hata oluştu.'), 'error');
    } finally {
      setIllerLoading(false);
    }
  };

  // ─── ADIM SEÇİM METOTLARI ──────────────────────────────────────────────────

  const handleSelectIl = async (il: AdresItem) => {
    setSelectedIl(il);
    setSelectedIlce(null);
    setSelectedKoy(null);
    setSelectedMahalle(null);
    setSelectedCadde(null);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setKoyler([]);
    setMahalleler([]);
    setCaddeSokaklar([]);
    setDisKapilar([]);
    setIcKapilar([]);

    try {
      setIlcelerLoading(true);
      const data = await adapter.getIlceler(il.id);
      setIlceler(data);
      scrollToColumn(1);
    } catch {
      showToast(t('ilceler_yuklenirken_hata', 'İlçeler yüklenirken hata oluştu.'), 'error');
    } finally {
      setIlcelerLoading(false);
    }
  };

  const handleSelectIlce = async (ilce: AdresItem) => {
    setSelectedIlce(ilce);
    setSelectedKoy(null);
    setSelectedMahalle(null);
    setSelectedCadde(null);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setMahalleler([]);
    setCaddeSokaklar([]);
    setDisKapilar([]);
    setIcKapilar([]);

    try {
      setKoylerLoading(true);
      const data = await adapter.getKoyler(ilce.id);
      setKoyler(data);
      scrollToColumn(2);
      if (data.length > 0) {
        handleSelectKoy(data[0]);
      }
    } catch {
      showToast(t('koyler_yuklenirken_hata', 'Köyler yüklenirken hata oluştu.'), 'error');
    } finally {
      setKoylerLoading(false);
    }
  };

  const handleSelectKoy = async (koy: AdresItem) => {
    setSelectedKoy(koy);
    setSelectedMahalle(null);
    setSelectedCadde(null);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setCaddeSokaklar([]);
    setDisKapilar([]);
    setIcKapilar([]);

    try {
      setMahallelerLoading(true);
      const data = await adapter.getMahalleler(koy.id);
      setMahalleler(data);
      scrollToColumn(3);
    } catch {
      showToast(t('mahalleler_yuklenirken_hata', 'Mahalleler yüklenirken hata oluştu.'), 'error');
    } finally {
      setMahallelerLoading(false);
    }
  };

  const handleSelectMahalle = async (mahalle: AdresItem) => {
    setSelectedMahalle(mahalle);
    setSelectedCadde(null);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setDisKapilar([]);
    setIcKapilar([]);

    try {
      setCaddeLoading(true);
      const data = await adapter.getCaddeSokaklar(mahalle.id);
      setCaddeSokaklar(data);
      scrollToColumn(4);
    } catch {
      showToast(t('cadde_yuklenirken_hata', 'Cadde/sokaklar yüklenirken hata oluştu.'), 'error');
    } finally {
      setCaddeLoading(false);
    }
  };

  const handleSelectCadde = async (cadde: AdresItem) => {
    setSelectedCadde(cadde);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setIcKapilar([]);

    try {
      setDisKapiLoading(true);
      const data = await adapter.getDisKapilar(cadde.id);
      setDisKapilar(data);
      scrollToColumn(5);
    } catch {
      showToast(t('dis_kapi_yuklenirken_hata', 'Dış kapılar yüklenirken hata oluştu.'), 'error');
    } finally {
      setDisKapiLoading(false);
    }
  };

  const handleSelectDisKapi = async (disKapi: AdresItem) => {
    setSelectedDisKapi(disKapi);
    setSelectedIcKapi(null);

    try {
      setIcKapiLoading(true);
      const data = await adapter.getIcKapilar(disKapi.id);
      setIcKapilar(data);
      scrollToColumn(6);
    } catch {
      showToast(t('ic_kapi_yuklenirken_hata', 'İç kapılar yüklenirken hata oluştu.'), 'error');
    } finally {
      setIcKapiLoading(false);
    }
  };

  const handleSelectIcKapi = (icKapi: AdresItem) => {
    setSelectedIcKapi(icKapi);
  };

  const handleResetAll = () => {
    setSelectedIl(null);
    setSelectedIlce(null);
    setSelectedKoy(null);
    setSelectedMahalle(null);
    setSelectedCadde(null);
    setSelectedDisKapi(null);
    setSelectedIcKapi(null);

    setIlceler([]);
    setKoyler([]);
    setMahalleler([]);
    setCaddeSokaklar([]);
    setDisKapilar([]);
    setIcKapilar([]);

    if (cascadeContainerRef.current) {
      cascadeContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // ─── SYNC METOTLARI ────────────────────────────────────────────────────────
  const handleSyncIl = async () => {
    try {
      setSyncingIl(true);
      const res = await adapter.syncIller();
      showToast(
        t('il_senkronizasyonu_tamamlandi', 'İl listesi sağlayıcıdan güncellendi. ({{guncellenen}} güncellendi, {{eklenen}} yeni eklendi)', {
          guncellenen: res?.updated ?? 0,
          eklenen: res?.added ?? 0
        }),
        'success'
      );
      await loadIller();
      loadStats();
      loadProviders();
    } catch (err: any) {
      showToast(err?.message || t('il_senkronizasyon_hatasi', 'İl senkronizasyonu sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingIl(false);
    }
  };

  const handleSyncIlce = async () => {
    if (!selectedIl) return;
    try {
      setSyncingIlce(true);
      await adapter.syncIlceler(selectedIl.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getIlceler(selectedIl.id);
      setIlceler(data);
      if (selectedIlce) {
        const updated = data.find((x) => x.id === selectedIlce.id);
        if (updated) setSelectedIlce(updated);
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingIlce(false);
    }
  };

  const handleSyncKoy = async () => {
    if (!selectedIlce) return;
    try {
      setSyncingKoy(true);
      await adapter.syncKoyler(selectedIlce.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getKoyler(selectedIlce.id);
      setKoyler(data);
      if (selectedKoy) {
        const updated = data.find((x) => x.id === selectedKoy.id || x.ad === selectedKoy.ad);
        if (updated) {
          setSelectedKoy(updated);
        } else if (data.length > 0) {
          handleSelectKoy(data[0]);
        } else {
          setSelectedKoy(null);
          setMahalleler([]);
        }
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingKoy(false);
    }
  };

  const handleSyncMahalle = async () => {
    if (!selectedKoy) return;
    try {
      setSyncingMahalle(true);
      await adapter.syncMahalleler(selectedKoy.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getMahalleler(selectedKoy.id);
      setMahalleler(data);
      if (selectedMahalle) {
        const updated = data.find((x) => x.id === selectedMahalle.id);
        if (updated) setSelectedMahalle(updated);
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingMahalle(false);
    }
  };

  const handleSyncCadde = async () => {
    if (!selectedMahalle) return;
    try {
      setSyncingCadde(true);
      await adapter.syncCaddeSokaklar(selectedMahalle.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getCaddeSokaklar(selectedMahalle.id);
      setCaddeSokaklar(data);
      if (selectedCadde) {
        const updated = data.find((x) => x.id === selectedCadde.id);
        if (updated) setSelectedCadde(updated);
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingCadde(false);
    }
  };

  const handleSyncDisKapi = async () => {
    if (!selectedCadde) return;
    try {
      setSyncingDisKapi(true);
      await adapter.syncDisKapilar(selectedCadde.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getDisKapilar(selectedCadde.id);
      setDisKapilar(data);
      if (selectedDisKapi) {
        const updated = data.find((x) => x.id === selectedDisKapi.id);
        if (updated) setSelectedDisKapi(updated);
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingDisKapi(false);
    }
  };

  const handleSyncIcKapi = async () => {
    if (!selectedDisKapi) return;
    try {
      setSyncingIcKapi(true);
      await adapter.syncIcKapilar(selectedDisKapi.id);
      showToast(t('senkronizasyon_basarili', 'Senkronizasyon başarıyla tamamlandı.'), 'success');
      const data = await adapter.getIcKapilar(selectedDisKapi.id);
      setIcKapilar(data);
      if (selectedIcKapi) {
        const updated = data.find((x) => x.id === selectedIcKapi.id);
        if (updated) setSelectedIcKapi(updated);
      }
      loadStats();
    } catch (err: any) {
      showToast(err?.message || t('senkronizasyon_hatasi', 'Senkronizasyon sırasında hata oluştu.'), 'error');
    } finally {
      setSyncingIcKapi(false);
    }
  };

  const handleBackfillGorunurAd = async () => {
    try {
      setBackfilling(true);
      const res = await adapter.backfillGorunurAd();
      showToast(res?.message || t('bakim_basarili', 'Veri formatlama ve bakım işlemi tamamlandı.'), 'success');
      if (selectedIl) {
        const data = await adapter.getIlceler(selectedIl.id);
        setIlceler(data);
      }
    } catch {
      showToast(t('bakim_hatasi', 'Bakım işlemi sırasında hata oluştu.'), 'error');
    } finally {
      setBackfilling(false);
    }
  };

  // ─── FİLTRELEMELER ─────────────────────────────────────────────────────────

  const filteredIller = useMemo(() => {
    const q = ilSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return iller;
    return iller.filter(i => 
      (i.gorunurAd || i.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (i.hariciId && String(i.hariciId).includes(q))
    );
  }, [iller, ilSearch]);

  const filteredIlceler = useMemo(() => {
    const q = ilceSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return ilceler;
    return ilceler.filter(i => 
      (i.gorunurAd || i.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (i.hariciId && String(i.hariciId).includes(q))
    );
  }, [ilceler, ilceSearch]);

  const filteredKoyler = useMemo(() => {
    const q = koySearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return koyler;
    return koyler.filter(k => 
      (k.gorunurAd || k.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (k.hariciId && String(k.hariciId).includes(q))
    );
  }, [koyler, koySearch]);

  const filteredMahalleler = useMemo(() => {
    const q = mahalleSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return mahalleler;
    return mahalleler.filter(m => 
      (m.gorunurAd || m.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (m.hariciId && String(m.hariciId).includes(q))
    );
  }, [mahalleler, mahalleSearch]);

  const filteredCaddeSokaklar = useMemo(() => {
    const q = caddeSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return caddeSokaklar;
    return caddeSokaklar.filter(c => 
      (c.gorunurAd || c.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (c.hariciId && String(c.hariciId).includes(q))
    );
  }, [caddeSokaklar, caddeSearch]);

  const filteredDisKapilar = useMemo(() => {
    const q = disKapiSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return disKapilar;
    return disKapilar.filter(d => 
      (d.gorunurAd || d.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (d.hariciId && String(d.hariciId).includes(q))
    );
  }, [disKapilar, disKapiSearch]);

  const filteredIcKapilar = useMemo(() => {
    const q = icKapiSearch.toLocaleLowerCase('tr-TR').trim();
    if (!q) return icKapilar;
    return icKapilar.filter(i => 
      (i.gorunurAd || i.ad).toLocaleLowerCase('tr-TR').includes(q) ||
      (i.hariciId && String(i.hariciId).includes(q))
    );
  }, [icKapilar, icKapiSearch]);

  // Oluşan Hiyerarşik Adres Metni
  const formattedAddress = useMemo(() => {
    const parts: string[] = [];
    if (selectedMahalle) parts.push(`${selectedMahalle.gorunurAd || selectedMahalle.ad} Mah.`);
    if (selectedCadde) parts.push(`${selectedCadde.gorunurAd || selectedCadde.ad}`);
    if (selectedDisKapi) parts.push(`No: ${selectedDisKapi.gorunurAd || selectedDisKapi.ad}`);
    if (selectedIcKapi) parts.push(`Daire: ${selectedIcKapi.gorunurAd || selectedIcKapi.ad}`);
    if (selectedIlce) parts.push(`${selectedIlce.gorunurAd || selectedIlce.ad}`);
    if (selectedIl) parts.push(`${selectedIl.gorunurAd || selectedIl.ad}`);
    return parts.join(', ');
  }, [selectedIl, selectedIlce, selectedMahalle, selectedCadde, selectedDisKapi, selectedIcKapi]);

  const handleCopyAddress = () => {
    if (!formattedAddress) return;
    navigator.clipboard.writeText(formattedAddress);
    showToast(t('adres_kopyalandi', 'Adres panoya kopyalandı.'), 'success');
  };

  // Aktif Adım Derinliği (0-6)
  const activeStepIndex = useMemo(() => {
    if (selectedIcKapi) return 6;
    if (selectedDisKapi) return 5;
    if (selectedCadde) return 4;
    if (selectedMahalle) return 3;
    if (selectedKoy) return 2;
    if (selectedIlce) return 1;
    if (selectedIl) return 0;
    return -1;
  }, [selectedIl, selectedIlce, selectedKoy, selectedMahalle, selectedCadde, selectedDisKapi, selectedIcKapi]);

  // ─── SEKME TANIMLARI ───────────────────────────────────────────────────────
  const tabs = useMemo(() => [
    {
      id: 'explorer',
      label: t('adres_gezgini_uavt', 'Adres Gezgini (UAVT)'),
      icon: <Layers size={18} />,
      content: (
        <div className="flex flex-col gap-16">
          {/* Adres İnceleme & Seçili Yol Özeti */}
          <div className="adres-inspector-card">
            <div className="adres-inspector-content">
              <span className="adres-inspector-title">
                {t('aktif_hiyerarsik_adres', 'Aktif Hiyerarşik Adres (MERNİS / UAVT Standardı)')}
              </span>
              <div className="adres-inspector-text">
                {formattedAddress || t('adres_secilmedi_ipucu', 'Lütfen aşağıdaki sütunlardan bir adres hiyerarşisi seçiniz (İl → İlçe → Köy → Mahalle → Cadde → No)')}
              </div>
              {selectedIl && (
                <div className="adres-inspector-tags">
                  <span className="chip-primary">
                    {selectedIl.gorunurAd || selectedIl.ad} {selectedIl.hariciId ? `(#${selectedIl.hariciId})` : ''}
                  </span>
                  {selectedIlce && (
                    <span className="chip-primary">
                      {selectedIlce.gorunurAd || selectedIlce.ad} {selectedIlce.hariciId ? `(#${selectedIlce.hariciId})` : ''}
                    </span>
                  )}
                  {selectedKoy && selectedKoy.ad !== (selectedIlce?.ad || '') && (
                    <span className="chip-secondary">
                      {selectedKoy.gorunurAd || selectedKoy.ad}
                    </span>
                  )}
                  {selectedMahalle && (
                    <span className="chip-primary">
                      {selectedMahalle.gorunurAd || selectedMahalle.ad} Mah.
                    </span>
                  )}
                  {selectedCadde && (
                    <span className="chip-primary">
                      {selectedCadde.gorunurAd || selectedCadde.ad}
                    </span>
                  )}
                  {selectedDisKapi && (
                    <span className="chip-primary">
                      No: {selectedDisKapi.gorunurAd || selectedDisKapi.ad}
                    </span>
                  )}
                  {selectedIcKapi && (
                    <span className="chip-primary">
                      İç Kapı: {selectedIcKapi.gorunurAd || selectedIcKapi.ad}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-8">
              {formattedAddress && (
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="btn btn-outline flex items-center gap-6"
                >
                  <Copy size={16} />
                  <span>{t('adresi_kopyala', 'Adresi Kopyala')}</span>
                </button>
              )}
              {selectedIl && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="btn btn-secondary"
                >
                  {t('secimi_temizle', 'Sıfırla')}
                </button>
              )}
            </div>
          </div>

          {/* Hızlı Kademeli Gezinme Yolu (Trail Bar) */}
          <div className="adres-trail-bar">
            <div className="adres-trail-steps">
              <span className="text-secondary text-12 font-medium mr-4">
                {t('adresi_izle', 'Konum:')}
              </span>
              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 0 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(0)}
              >
                <Compass size={14} />
                <span>{selectedIl ? (selectedIl.gorunurAd || selectedIl.ad) : t('il_secin', '1. İl')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 1 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(1)}
                disabled={!selectedIl}
              >
                <Building2 size={14} />
                <span>{selectedIlce ? (selectedIlce.gorunurAd || selectedIlce.ad) : t('ilce_secin', '2. İlçe')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 2 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(2)}
                disabled={!selectedIlce}
              >
                <MapPin size={14} />
                <span>{selectedKoy ? (selectedKoy.gorunurAd || selectedKoy.ad) : t('koy_secin', '3. Köy / Belde')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 3 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(3)}
                disabled={!selectedKoy}
              >
                <Home size={14} />
                <span>{selectedMahalle ? (selectedMahalle.gorunurAd || selectedMahalle.ad) : t('mahalle_secin', '4. Mahalle')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 4 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(4)}
                disabled={!selectedMahalle}
              >
                <Layers size={14} />
                <span>{selectedCadde ? (selectedCadde.gorunurAd || selectedCadde.ad) : t('cadde_secin', '5. Cadde/Sokak')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 5 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(5)}
                disabled={!selectedCadde}
              >
                <Hash size={14} />
                <span>{selectedDisKapi ? (selectedDisKapi.gorunurAd || selectedDisKapi.ad) : t('diskapi_secin', '6. Dış Kapı')}</span>
              </button>

              <span className="adres-trail-sep"><ChevronRight size={14} /></span>

              <button
                type="button"
                className={`adres-trail-step ${activeStepIndex === 6 ? 'is-current' : ''}`}
                onClick={() => scrollToColumn(6)}
                disabled={!selectedDisKapi}
              >
                <Key size={14} />
                <span>{selectedIcKapi ? (selectedIcKapi.gorunurAd || selectedIcKapi.ad) : t('ickapi_secin', '7. İç Kapı')}</span>
              </button>
            </div>

            <div className="flex items-center gap-8">
              <span className="text-12 text-secondary">
                {t('yatay_kaydirma_destegi', 'Yatay sütunlar arasında gezinebilirsiniz')}
              </span>
            </div>
          </div>

          {/* 7 KADEMELİ MILLER COLUMNS (CASCADE EXPLORER) */}
          <div className="adres-cascade-container" ref={cascadeContainerRef}>
            {/* 1. SÜTUN: İLLER */}
            <div className={`adres-column-card ${activeStepIndex === 0 ? 'is-active-level' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">1</span>
                  <h4 className="adres-column-title">{t('iller', 'İller')}</h4>
                  <span className="chip-secondary text-11">{filteredIller.length}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncIl}
                  disabled={syncingIl}
                  className="btn btn-icon btn-secondary"
                  title={t('iller_sync', 'İlleri NVİ/UAVT üzerinden senkronize et')}
                >
                  <RefreshCw size={14} className={syncingIl ? 'spinning' : ''} />
                </button>
              </div>

              <div className="adres-column-search">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder={t('il_ara', 'İl veya Plaka Ara...')}
                    value={ilSearch}
                    onChange={(e) => setIlSearch(e.target.value)}
                    className="form-control text-13 py-6"
                  />
                </div>
              </div>

              <div className="adres-column-list">
                {illerLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('yukleniyor', 'Yükleniyor...')}</span>
                  </div>
                ) : filteredIller.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredIller.map((il) => {
                    const isSelected = selectedIl?.id === il.id;
                    return (
                      <button
                        key={il.id}
                        type="button"
                        onClick={() => handleSelectIl(il)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          <span className="adres-item-code">
                            {il.hariciId ? String(il.hariciId).padStart(2, '0') : il.id}
                          </span>
                          <span className="font-medium truncate">{il.gorunurAd || il.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'il', il.id, handleSyncIl)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. SÜTUN: İLÇELER */}
            <div className={`adres-column-card ${activeStepIndex === 1 ? 'is-active-level' : ''} ${!selectedIl ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">2</span>
                  <h4 className="adres-column-title">{t('ilceler', 'İlçeler')}</h4>
                  {selectedIl && <span className="chip-secondary text-11">{filteredIlceler.length}</span>}
                </div>
                {selectedIl && (
                  <button
                    type="button"
                    onClick={handleSyncIlce}
                    disabled={syncingIlce}
                    className="btn btn-icon btn-secondary"
                    title={t('ilceler_sync', 'Seçili ilin ilçelerini UAVT üzerinden senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingIlce ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedIl && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('ilce_ara', 'İlçe Ara...')}
                      value={ilceSearch}
                      onChange={(e) => setIlceSearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedIl ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <Building2 size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_il_secin', 'Lütfen önce soldaki listeden bir il seçiniz.')}</span>
                  </div>
                ) : ilcelerLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('ilceler_yukleniyor', 'İlçeler yükleniyor...')}</span>
                  </div>
                ) : filteredIlceler.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredIlceler.map((ilce) => {
                    const isSelected = selectedIlce?.id === ilce.id;
                    return (
                      <button
                        key={ilce.id}
                        type="button"
                        onClick={() => handleSelectIlce(ilce)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {ilce.hariciId && <span className="adres-item-code">{ilce.hariciId}</span>}
                          <span className="font-medium truncate">{ilce.gorunurAd || ilce.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'ilce', ilce.id, handleSyncIlce)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. SÜTUN: KÖYLER / BELDELER */}
            <div className={`adres-column-card ${activeStepIndex === 2 ? 'is-active-level' : ''} ${!selectedIlce ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">3</span>
                  <h4 className="adres-column-title">{t('koyler_beldeler', 'Köyler / Beldeler')}</h4>
                  {selectedIlce && <span className="chip-secondary text-11">{filteredKoyler.length}</span>}
                </div>
                {selectedIlce && (
                  <button
                    type="button"
                    onClick={handleSyncKoy}
                    disabled={syncingKoy}
                    className="btn btn-icon btn-secondary"
                    title={t('koyler_sync', 'Köyleri senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingKoy ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedIlce && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('koy_ara', 'Köy / Belde Ara...')}
                      value={koySearch}
                      onChange={(e) => setKoySearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedIlce ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <MapPin size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_ilce_secin', 'Lütfen önce bir ilçe seçiniz.')}</span>
                  </div>
                ) : koylerLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('koyler_yukleniyor', 'Köyler yükleniyor...')}</span>
                  </div>
                ) : filteredKoyler.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredKoyler.map((koy) => {
                    const isSelected = selectedKoy?.id === koy.id;
                    return (
                      <button
                        key={koy.id}
                        type="button"
                        onClick={() => handleSelectKoy(koy)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {koy.hariciId && <span className="adres-item-code">{koy.hariciId}</span>}
                          <span className="font-medium truncate">{koy.gorunurAd || koy.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'koy', koy.id, handleSyncKoy)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. SÜTUN: MAHALLELER */}
            <div className={`adres-column-card ${activeStepIndex === 3 ? 'is-active-level' : ''} ${!selectedKoy ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">4</span>
                  <h4 className="adres-column-title">{t('mahalleler', 'Mahalleler')}</h4>
                  {selectedKoy && <span className="chip-secondary text-11">{filteredMahalleler.length}</span>}
                </div>
                {selectedKoy && (
                  <button
                    type="button"
                    onClick={handleSyncMahalle}
                    disabled={syncingMahalle}
                    className="btn btn-icon btn-secondary"
                    title={t('mahalleler_sync', 'Mahalleleri senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingMahalle ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedKoy && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('mahalle_ara', 'Mahalle Ara...')}
                      value={mahalleSearch}
                      onChange={(e) => setMahalleSearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedKoy ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <Home size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_koy_secin', 'Lütfen önce köy veya belde seçiniz.')}</span>
                  </div>
                ) : mahallelerLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('mahalleler_yukleniyor', 'Mahalleler yükleniyor...')}</span>
                  </div>
                ) : filteredMahalleler.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredMahalleler.map((mahalle) => {
                    const isSelected = selectedMahalle?.id === mahalle.id;
                    return (
                      <button
                        key={mahalle.id}
                        type="button"
                        onClick={() => handleSelectMahalle(mahalle)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {mahalle.hariciId && <span className="adres-item-code">{mahalle.hariciId}</span>}
                          <span className="font-medium truncate">{mahalle.gorunurAd || mahalle.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'mahalle', mahalle.id, handleSyncMahalle)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5. SÜTUN: CADDE / SOKAKLAR */}
            <div className={`adres-column-card ${activeStepIndex === 4 ? 'is-active-level' : ''} ${!selectedMahalle ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">5</span>
                  <h4 className="adres-column-title">{t('cadde_sokaklar', 'Cadde / Sokak')}</h4>
                  {selectedMahalle && <span className="chip-secondary text-11">{filteredCaddeSokaklar.length}</span>}
                </div>
                {selectedMahalle && (
                  <button
                    type="button"
                    onClick={handleSyncCadde}
                    disabled={syncingCadde}
                    className="btn btn-icon btn-secondary"
                    title={t('cadde_sync', 'Cadde ve sokakları senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingCadde ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedMahalle && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('cadde_ara', 'Cadde veya Sokak Ara...')}
                      value={caddeSearch}
                      onChange={(e) => setCaddeSearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedMahalle ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <Layers size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_mahalle_secin', 'Lütfen önce mahalle seçiniz.')}</span>
                  </div>
                ) : caddeLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('cadde_yukleniyor', 'Cadde/sokaklar yükleniyor...')}</span>
                  </div>
                ) : filteredCaddeSokaklar.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredCaddeSokaklar.map((cadde) => {
                    const isSelected = selectedCadde?.id === cadde.id;
                    return (
                      <button
                        key={cadde.id}
                        type="button"
                        onClick={() => handleSelectCadde(cadde)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {cadde.hariciId && <span className="adres-item-code">{cadde.hariciId}</span>}
                          <span className="font-medium truncate">{cadde.gorunurAd || cadde.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'cadde', cadde.id, handleSyncCadde)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6. SÜTUN: DIŞ KAPILAR */}
            <div className={`adres-column-card ${activeStepIndex === 5 ? 'is-active-level' : ''} ${!selectedCadde ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">6</span>
                  <h4 className="adres-column-title">{t('dis_kapilar', 'Dış Kapı No')}</h4>
                  {selectedCadde && <span className="chip-secondary text-11">{filteredDisKapilar.length}</span>}
                </div>
                {selectedCadde && (
                  <button
                    type="button"
                    onClick={handleSyncDisKapi}
                    disabled={syncingDisKapi}
                    className="btn btn-icon btn-secondary"
                    title={t('diskapi_sync', 'Dış kapıları senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingDisKapi ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedCadde && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('diskapi_ara', 'Bina / Kapı No Ara...')}
                      value={disKapiSearch}
                      onChange={(e) => setDisKapiSearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedCadde ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <Hash size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_cadde_secin', 'Lütfen önce cadde veya sokak seçiniz.')}</span>
                  </div>
                ) : disKapiLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('diskapi_yukleniyor', 'Dış kapılar yükleniyor...')}</span>
                  </div>
                ) : filteredDisKapilar.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredDisKapilar.map((disKapi) => {
                    const isSelected = selectedDisKapi?.id === disKapi.id;
                    return (
                      <button
                        key={disKapi.id}
                        type="button"
                        onClick={() => handleSelectDisKapi(disKapi)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {disKapi.hariciId && <span className="adres-item-code">{disKapi.hariciId}</span>}
                          <span className="font-semibold">{disKapi.gorunurAd || disKapi.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'disKapi', disKapi.id, handleSyncDisKapi)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <ChevronRight size={15} className="text-secondary" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 7. SÜTUN: İÇ KAPILAR */}
            <div className={`adres-column-card ${activeStepIndex === 6 ? 'is-active-level' : ''} ${!selectedDisKapi ? 'is-placeholder' : ''}`}>
              <div className="adres-column-header">
                <div className="adres-column-title-wrap">
                  <span className="adres-column-step-badge">7</span>
                  <h4 className="adres-column-title">{t('ic_kapilar', 'İç Kapı No (Daire)')}</h4>
                  {selectedDisKapi && <span className="chip-secondary text-11">{filteredIcKapilar.length}</span>}
                </div>
                {selectedDisKapi && (
                  <button
                    type="button"
                    onClick={handleSyncIcKapi}
                    disabled={syncingIcKapi}
                    className="btn btn-icon btn-secondary"
                    title={t('ickapi_sync', 'İç kapıları senkronize et')}
                  >
                    <RefreshCw size={14} className={syncingIcKapi ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {selectedDisKapi && (
                <div className="adres-column-search">
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={t('ickapi_ara', 'Daire No Ara...')}
                      value={icKapiSearch}
                      onChange={(e) => setIcKapiSearch(e.target.value)}
                      className="form-control text-13 py-6"
                    />
                  </div>
                </div>
              )}

              <div className="adres-column-list">
                {!selectedDisKapi ? (
                  <div className="p-32 text-center text-secondary text-13">
                    <Key size={24} className="mx-auto mb-8 opacity-40" />
                    <span>{t('once_diskapi_secin', 'Lütfen önce dış kapı seçiniz.')}</span>
                  </div>
                ) : icKapiLoading ? (
                  <div className="p-20 text-center text-secondary text-13">
                    <RefreshCw size={18} className="spinning mx-auto mb-8" />
                    <span>{t('ickapi_yukleniyor', 'İç kapılar yükleniyor...')}</span>
                  </div>
                ) : filteredIcKapilar.length === 0 ? (
                  <div className="p-20 text-center text-secondary text-13">
                    {t('kayit_bulunamadi', 'Kayıt bulunamadı.')}
                  </div>
                ) : (
                  filteredIcKapilar.map((icKapi) => {
                    const isSelected = selectedIcKapi?.id === icKapi.id;
                    return (
                      <button
                        key={icKapi.id}
                        type="button"
                        onClick={() => handleSelectIcKapi(icKapi)}
                        className={`adres-item-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="adres-item-info">
                          {icKapi.hariciId && <span className="adres-item-code">{icKapi.hariciId}</span>}
                          <span className="font-semibold">{icKapi.gorunurAd || icKapi.ad}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenInfo(e, 'icKapi', icKapi.id, handleSyncIcKapi)}
                            className="btn-info-icon"
                            title={t('kayit_detayi', 'Kayıt ve UAVT Detayı')}
                          >
                            <Info size={14} />
                          </button>
                          <CheckCircle2 size={15} className={isSelected ? 'text-accent' : 'opacity-0'} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'health',
      label: t('saglayici_sagligi_istatistikler', 'Sağlayıcı Sağlığı & İstatistikler'),
      icon: <Activity size={18} />,
      content: (
        <div className="flex flex-col gap-20">
          {/* İstatistik Kartları */}
          <div className="settings-stats-grid">
            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_il', 'Toplam İl')}</span>
                <div className="adres-stat-icon-wrap"><Compass size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamIlSayisi ?? 81}</div>
              <div className="adres-stat-subtext">{t('stat_il_subtext', 'Türkiye Cumhuriyeti MERNİS İlleri')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_ilce', 'Toplam İlçe')}</span>
                <div className="adres-stat-icon-wrap"><Building2 size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamIlceSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_ilce_subtext', 'Aktif kayıtlı ilçe sayısı')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_koy', 'Köy & Belde')}</span>
                <div className="adres-stat-icon-wrap"><MapPin size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamKoySayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_koy_subtext', 'Kırsal ve belde yerleşimleri')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_mahalle', 'Toplam Mahalle')}</span>
                <div className="adres-stat-icon-wrap"><Home size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamMahalleSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_mahalle_subtext', 'Ulusal mahalle kayıtları')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_cadde', 'Cadde / Sokak')}</span>
                <div className="adres-stat-icon-wrap"><Layers size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamCaddeSokakSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_cadde_subtext', 'Sistemde kayıtlı yollar')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_dis_kapi', 'Dış Kapı No')}</span>
                <div className="adres-stat-icon-wrap"><Hash size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamDisKapiSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_diskapi_subtext', 'Bina / parsel kapı numaraları')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('toplam_ic_kapi', 'İç Kapı No')}</span>
                <div className="adres-stat-icon-wrap"><Key size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamIcKapiSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_ickapi_subtext', 'Bağımsız bölüm / daireler')}</div>
            </div>

            <div className="adres-stat-card">
              <div className="adres-stat-header">
                <span className="adres-stat-label">{t('kullanilan_adresler', 'Kullanılan Genel Adres')}</span>
                <div className="adres-stat-icon-wrap"><Database size={20} /></div>
              </div>
              <div className="adres-stat-value">{stats?.toplamGenelAdresSayisi ?? 0}</div>
              <div className="adres-stat-subtext">{t('stat_geneladres_subtext', 'Firma, cari ve şube adresleri')}</div>
            </div>
          </div>

          {/* Entegre Adres Sağlayıcıları (UAVT Telemetri & Canlı Sağlık) */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div>
                <h3 className="settings-section-title">
                  <Radio size={20} className="text-accent" />
                  <span>{t('entegre_adres_saglayicilari', 'Entegre Adres Sağlayıcıları (UAVT)')}</span>
                </h3>
                <p className="settings-section-desc">
                  {t('entegre_adres_saglayicilari_desc', 'Sistem genelinde (UI ve Admin) kullanılan resmi adres sağlayıcılarının canlı durumları, son sorgu zamanları ve performans telemetrisi tek bir merkezi uç noktadan yönetilir.')}
                </p>
              </div>
              <button
                type="button"
                onClick={loadProviders}
                disabled={providersLoading}
                className="btn btn-outline flex items-center gap-6 py-6 px-12 text-13"
                title={t('saglayicilari_yenile', 'Sağlayıcıları Yenile')}
              >
                <RefreshCw size={14} className={providersLoading ? 'spinning' : ''} />
                <span>{t('saglayicilari_yenile', 'Sağlayıcıları Yenile')}</span>
              </button>
            </div>

            <div className="provider-health-grid">
              {providersLoading && providers.length === 0 ? (
                <div className="flex items-center justify-center p-24 text-secondary col-span-full">
                  <RefreshCw size={20} className="spinning mr-8" />
                  <span>{t('yukleniyor', 'Yükleniyor...')}</span>
                </div>
              ) : providers.length === 0 ? (
                <div className="p-20 text-center text-secondary text-13 col-span-full">
                  {t('kayit_bulunamadi', 'Tanımlı sağlayıcı bulunamadı.')}
                </div>
              ) : (
                providers.map((p) => {
                  const isTesting = testingProvider === p.key;
                  return (
                    <div key={p.key} className="provider-health-card">
                      {/* Üst Bar */}
                      <div className="provider-health-header">
                        <div className="provider-health-title-wrap">
                          <div className="provider-health-icon">
                            {p.key === 'Hepiyi' || p.key === 'HepiyiSigorta' ? <Radio size={20} /> : <Shield size={20} />}
                          </div>
                          <div className="provider-health-info">
                            <div className="provider-health-title-row">
                              <h4 className="provider-health-title">{p.ad}</h4>
                              <span className="provider-role-badge">
                                {p.key === 'Hepiyi' || p.key === 'HepiyiSigorta' ? t('birincil_uavt_servisi', 'Birincil UAVT Servisi') : t('ikincil_yedek_servis', 'İkincil / Yedek Servis')}
                              </span>
                            </div>
                            <span className="provider-health-url" title={p.url}>
                              <Globe size={11} />
                              {p.url}
                            </span>
                          </div>
                        </div>

                        {/* Durum Rozeti */}
                        <div className={`provider-status-badge ${p.aktifMi ? 'is-active' : 'is-error'}`}>
                          <span className="provider-status-dot" />
                          <span>{p.aktifMi ? t('aktif_ve_hazir', 'Aktif') : t('servis_disi', 'Servis Dışı')}</span>
                        </div>
                      </div>

                      {/* Telemetri Metrikleri */}
                      <div className="provider-kpi-grid">
                        <div className="provider-kpi-item">
                          <div className="provider-kpi-header">
                            <Clock size={12} />
                            <span>{t('son_islem_zamani', 'Son İşlem')}</span>
                          </div>
                          <div className="provider-kpi-val">{formatDateTime(p.sonSorguTarihi)}</div>
                        </div>

                        <div className="provider-kpi-item">
                          <div className="provider-kpi-header">
                            <Zap size={12} />
                            <span>{t('ortalama_yanit', 'Yanıt Süresi')}</span>
                          </div>
                          <div className="provider-kpi-val">
                            {p.sonCevapSuresiMs != null ? `${p.sonCevapSuresiMs} ms` : '-'}
                          </div>
                        </div>

                        <div className="provider-kpi-item">
                          <div className="provider-kpi-header">
                            <CheckCircle2 size={12} className="text-success" />
                            <span>{t('basarili_istek', 'Başarılı İstek')}</span>
                          </div>
                          <div className="provider-kpi-val text-success">
                            {p.basariliIstekSayisi} / {p.toplamIstekSayisi}
                          </div>
                        </div>

                        <div className="provider-kpi-item">
                          <div className="provider-kpi-header">
                            <Activity size={12} />
                            <span>{t('basari_orani', 'Başarı Oranı')}</span>
                          </div>
                          <div className="provider-kpi-val">
                            {p.toplamIstekSayisi > 0
                              ? `%${Math.round((p.basariliIstekSayisi / p.toplamIstekSayisi) * 100)}`
                              : '%100'}
                          </div>
                        </div>
                      </div>

                      {/* Footer & Test Butonu */}
                      <div className="provider-health-footer">
                        <span className="provider-footer-msg" title={p.sonMesaj || ''}>
                          {p.sonMesaj || (p.sonIstekBasariliMi === false ? t('son_istek_hatali', 'Son istekte hata alındı') : t('sistem_operasyonel', 'Servis sağlıklı yanıt veriyor'))}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTestProvider(p.key)}
                          disabled={isTesting}
                          className="btn btn-outline flex items-center gap-6 py-4 px-10 text-12 font-medium"
                          title={t('canli_baglanti_testi', 'Sağlayıcıya anlık canlı ping/sorgu gönder')}
                        >
                          <Zap size={13} className={isTesting ? 'spinning' : 'text-accent'} />
                          <span>{isTesting ? t('test_ediliyor', 'Test...') : t('canli_test', 'Canlı Test')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Veri Bakım ve Standardizasyon */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div>
                <h3 className="settings-section-title">
                  <Sparkles size={20} className="text-accent" />
                  <span>{t('veri_standartlastirma_ve_bakim', 'Veri Standardizasyonu ve Bakım')}</span>
                </h3>
                <p className="settings-section-desc">
                  {t('veri_bakim_desc', 'Adres tablosundaki kayıtların görünür adlarını (Title Case formatında) yeniden hesaplar ve sistem genelindeki adres etiketlerini günceller.')}
                </p>
              </div>
            </div>

            <div className="adres-action-box">
              <div className="adres-action-info">
                <Sparkles size={24} className="text-accent flex-shrink-0 mt-2" />
                <div>
                  <h4 className="font-semibold text-14 mb-4">
                    {t('gorunur_ad_backfill', 'Görünür Ad (GorunurAd) Veri Onarımı')}
                  </h4>
                  <p className="text-secondary text-13 mb-0">
                    {t('gorunur_ad_backfill_desc', 'Büyük harfli (KADIKÖY, BEŞİKTAŞ) kayıtları resmi standartlara göre düzeltir (Kadıköy, Beşiktaş).')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackfillGorunurAd}
                disabled={backfilling}
                className="btn btn-secondary flex items-center gap-8 py-8 px-16 text-13"
              >
                <RefreshCw size={15} className={backfilling ? 'spinning' : ''} />
                <span>{backfilling ? t('isleniyor', 'İşleniyor...') : t('onarimi_baslat', 'Bakımı Başlat')}</span>
              </button>
            </div>
          </div>
        </div>
      )
    }
  ], [
    t,
    selectedIl,
    selectedIlce,
    selectedKoy,
    selectedMahalle,
    selectedCadde,
    selectedDisKapi,
    selectedIcKapi,
    activeStepIndex,
    filteredIller,
    filteredIlceler,
    filteredKoyler,
    filteredMahalleler,
    filteredCaddeSokaklar,
    filteredDisKapilar,
    filteredIcKapilar,
    illerLoading,
    ilcelerLoading,
    koylerLoading,
    mahallelerLoading,
    caddeLoading,
    disKapiLoading,
    icKapiLoading,
    syncingIl,
    syncingIlce,
    syncingKoy,
    syncingMahalle,
    syncingCadde,
    syncingDisKapi,
    syncingIcKapi,
    ilSearch,
    ilceSearch,
    koySearch,
    mahalleSearch,
    caddeSearch,
    disKapiSearch,
    icKapiSearch,
    formattedAddress,
    stats,
    statsLoading,
    backfilling,
    providers,
    providersLoading,
    testingProvider
  ]);

  return (
    <BaseSystemPage
      title={t('adres_yonetimi', 'Adres Yönetimi')}
      description={t('adres_yonetimi_desc', 'Türkiye ulusal adres standartları, UAVT senkronizasyonu ve veri sağlığı yönetimi')}
      icon={<MapPin size={24} />}
      breadcrumb={[
        { label: t('sistem_ve_ayarlar', 'Sistem & Ayarlar'), path: '/ayarlar' },
        { label: t('genel_ayarlar', 'Genel Ayarlar'), path: '/ayarlar' },
        { label: t('adres_yonetimi', 'Adres Yönetimi') }
      ]}
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={(id) => setActiveTab(String(id))}
    >
      <AdresKayitBilgiPopup
        isOpen={infoPopup.isOpen}
        onClose={handleCloseInfo}
        seviye={infoPopup.seviye}
        recordId={infoPopup.recordId}
        onSync={infoPopup.onSync}
      />
    </BaseSystemPage>
  );
};

export default AdresYonetimiPage;
