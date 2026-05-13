[English](README.md)

# no-consent

Çerez onay panelleri "Tümünü reddet" seçeneğini genellikle sonsuz bir tedarikçi listesinin arkasına saklar. **no-consent**, gözlerinizin önünde her geçişi kapatan - amaç onayı, meşru menfaat, özel özellikler, tedarikçiler dahil - bir **Tümünü kapat** düğmesi ekler. Sonucu kendiniz görürsünüz, ardından sitenin kendi Kaydet düğmesine tıklarsınız.

Eklenti panelleri asla açmaz, başlıkları kapatmaz veya sizin adınıza hiçbir şeyi kaydetmez.

---

## Özellikler

- Tüm onay geçişlerini kapatır: amaç onayı, meşru menfaat, özel özellikler, tedarikçiler
- Görünür, tek tıklamalı işlem - her geçişin kapandığını gerçek zamanlı olarak izlersiniz
- Hiçbir şeyi göndermez, otomatik kaydetmez veya oturumunuza dokunmaz
- Alt görünümleri destekler (Tedarikçi tercihleri sayfasına gider, hepsini kapatır, başladığınız yere döner)
- Hafif: bağımlılık yok, derleme adımı yok, ~260 satır saf JavaScript
- İstemiyorsanız × düğmesiyle o sayfa yüklemesi için gizleyebilirsiniz

## Kurulum

Chrome, Edge, Brave ve Chromium tabanlı tüm tarayıcılarda çalışır.

### 1. Adım - Dosyaları indirin

**Git kullanmıyorsanız:** Bu sayfanın üstündeki yeşil **Code** düğmesine tıklayın, **Download ZIP** seçeneğini seçin ve zip dosyasını bilgisayarınızda istediğiniz bir yere çıkartın.

**Git ile:**
```
git clone https://github.com/mucahityilmaz/no-consent.git
```

### 2. Adım - Tarayıcıya yükleyin

1. Yeni bir sekme açın ve adres çubuğuna **chrome://extensions** yazın
2. Sağ üst köşedeki **Geliştirici modu** düğmesini açın
   *(Bu ayar sadece kendi bilgisayarınızdaki eklentileri yüklemenizi sağlar - güvenlidir)*
3. **Paketlenmemişi yükle** düğmesine tıklayın
4. Az önce zip'ten çıkarttığınız veya klonladığınız klasörü seçin - içinde `manifest.json` dosyası olan klasör

Tamam. Eklenti artık aktif. Bir web sitesinde çerez onay paneli açana kadar herhangi bir şey görmezsiniz.

## Nasıl Çalışır

1. Bir siteyi ziyaret edin ve onay tercihler panelini açın (*Seçenekleri yönet* / *Özelleştir* / *Tercihler* - geçişlerin göründüğü ekran ne ise).
2. Geçişler ekranda algılandığında, sayfanın üst kısmında bir kayan düğme belirir:

   > **[ Tümünü kapat (48) ]** &nbsp; ×

3. Tıklayın. Her "açık" geçiş gerçek zamanlı olarak kapanır. Panelin ayrı bir *Tedarikçi tercihleri* alt görünümü varsa eklenti oraya geçer, hepsini kapatır ve başladığınız yere döner.
4. Düğme onaylar: `✓ 80 geçiş kapatıldı`
5. Sitenin kendi *Kaydet* / *Seçimleri onayla* / *Tamam* düğmesine tıklayın.

Görünümler arasında geçiş yaptığınızda sayım ~½ saniye içinde güncellenir.

## Test Edilen CMP'ler

| CMP | İşlenen Geçişler |
|---|---|
| Google Funding Choices | `input[class*="fc-preference"]` - amaç onayı, amaç meşru menfaat, özel özellikler, tedarikçi onayı, tedarikçi meşru menfaat |

Daha fazla CMP desteği için katkıda bulunabilirsiniz - bkz. [Katkıda Bulunma](#katkıda-bulunma).

## Gizlilik ve Güvenlik

- **Ağ isteği yok** - eklenti hiçbir zaman hiçbir sunucuyla iletişim kurmaz
- **Depolama yok** - `chrome.storage`, `localStorage` veya çerezlere hiçbir şey yazılmaz
- **Eval yok** - tüm kod statiktir, bu depodan yüklenir
- Herhangi bir sitede onay panellerini algılayabilmek için `<all_urls>` host iznine ihtiyaç duyar; yalnızca o anda bulunduğunuz sayfanın DOM'unu okur

Ayrıntılar için [SECURITY.md](SECURITY.md) sayfasına bakın.

## Katkıda Bulunma

Yeni bir onay yönetim platformu (CMP) desteği eklemek, katkıda bulunmanın temel yoludur - derleme araçları gerektirmez. Adım adım kılavuz için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

Hata raporları ve CMP istekleri [GitHub Issues](../../issues) üzerinden memnuniyetle karşılanır.

## Lisans

[MIT](LICENSE)
