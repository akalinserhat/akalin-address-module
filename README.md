# @akalin/address_module

Türkiye Ulusal Adres Standartları (UAVT / NVİ), 7 Kademeli Hiyerarşik Gezgin (Miller Columns Layout: İl → İlçe → Köy → Mahalle → Cadde/Sokak → Dış Kapı → İç Kapı), Sağlayıcı Sağlık Monitörü & Telemetri ve Adres İstatistikleri Modülü.

## Özellikler
- **7 Kademeli Hiyerarşik Gezgin**: İl, İlçe, Köy, Mahalle, Cadde/Sokak, Dış Kapı ve İç Kapı seviyelerinde kademeli gezinme ve düzenleme.
- **Miller Columns Layout**: Hızlı yatay kaydırma ve anlık filtreleme.
- **UAVT & Çoklu Sağlayıcı Entegrasyonu**: Sabit Veritabanı, Hepiyi, AXA ve harici sigorta / UAVT servisleri senkronizasyonu.
- **Sağlayıcı Sağlık Durumu & Canlı Test**: Gecikme (ms), başarı oranı ve test talebi konsolu.
- **Detaylı Kayıt Müfettişi (AdresKayitBilgiPopup)**: Seçili kaydın UAVT kodunu, denetim tarihini ve üst hiyerarşi zincirini kopyalama ve inceleme.
- **Adapter Tabanlı Veri Mimarisi**: REST veya Mock/Memory ortamlarına kolay enjeksiyon.
- **@akalin/module_core Entegrasyonu**: `createAddressModule()` ile doğrudan `ModuleRegistry`'ye kayıt.
