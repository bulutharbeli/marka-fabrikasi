# BrandForge Free — Limitsiz AI Logo Üretici

`juxxbrand.ai.studio` benzeri bir AI marka kimliği / logo üretim sistemi — ama **ücretsiz sağlayıcı zinciri**,
**devre kesici (circuit breaker)** ve **otomatik failover** ile tasarlanmış. Kullanıcı hiçbir zaman
"rate limit" hatası görmez.

> **Tek cümlelik fark:** Orijinal site tek bir sağlayıcıya (Gemini API) bağlıydı ve anahtarın kotası bitince
> duruyordu. Burada 8+ rota sırayla denenir; hata alan rota kısa süre devre dışı bırakılır ve istek
> bir sonraki sağlayıcıya kayar. Hiçbir şey yanıt vermezse **yerel prosedürel vektör motoru** anında devreye girer.

---

## 🚀 Online çalıştırmak için (3 adım, 5 dakika)

Uygulamanın **lokal kurulumu yok** — aşağıdaki adımlarla dünyaya açılır ve `https://marka-xxx.vercel.app`
adresinden herkes erişir. Ücretsiz sağlayıcıları çağıran `/api/proxy` sunucusu da aynı deploy'da çalışır,
kullanıcı **hiçbir limit görmez**.

### Adım 1 — Projeyi GitHub'a koyun (tarayıcıdan, terminal gerekmez)

1. <https://github.com/new> → repo adı (ör. `marka-fabrikasi`) → **Create repository** (Public veya Private olur)
2. Repo sayfasında **"uploading an existing file"** bağlantısına tıklayın
3. `brandforge-free.zip` içindeki **tüm klasör ve dosyaları** (iç içe klasör yapısını koruyarak) sürükleyip bırakın
   — `src/`, `server/`, `api/`, `worker/`, `netlify/`, `package.json`, `vite.config.ts`, `index.html` vb.
   ⚠️ `node_modules` ve `dist` klasörlerini **yükleme** (zaten yok).
4. **Commit changes** → tamam.

### Adım 2 — Vercel'e bağlayın

1. <https://vercel.com/signup> → GitHub ile ücretsiz hesap açın
2. <https://vercel.com/new> → **Add New… → Project** → `marka-fabrikasi` reposunu seçin → **Import**
3. Framework **Vite** olarak otomatik algılanır → **Deploy** (1-2 dk)

### Adım 3 — (Önerilen) Hızlı ücretsiz anahtarı ekleyin

1. <https://enter.pollinations.ai/keys> → ücretsiz hesap → **API key** al (`sk_…`)
2. Vercel → projeniz → **Settings → Environment Variables**
   - Name: `POLLINATIONS_API_KEY` · Value: `sk_…` → **Save**
3. **Deployments → ⋮ → Redeploy** (yeniden dağıt)

**Sonuç:** `https://marka-fabrikasi.vercel.app` — uygulama internette, kimsenin kurulum yapmasına gerek yok.
Bu anahtarla logo üretimi **~2 saniye** (anahtarsız ~45 sn; o durumda da uygulama anında yerel vektör
taslaklarını gösterip AI logosu gelince yükseltir).

> **Alternatif (2 dakika, terminal):** proje klasöründe `npx vercel --prod` yazın — Vercel soruları
> yanıtlayın, site otomatik yayınlanır. Anahtar eklemek için: `npx vercel env add POLLINATIONS_API_KEY production`

### Site adını değiştirmek (isteğe bağlı)

Vercel → **Settings → Environments → Production → Environment Variables**:

| Name | Value | Etki |
|------|-------|------|
| `VITE_APP_NAME` | `Logo Designer` | Üst bar adı + tarayıcı sekme başlığı |
| `VITE_APP_TAGLINE` | `Limitsiz AI logo üretimi` | Üst bar alt başlığı |

Sonra **Redeploy** yap. (Proje adı `logodesigner` ise adres `https://logodesigner.vercel.app` olur —
site adı ile uygulama adı birbirinden bağımsızdır.)


---

## 1. Sağlayıcı zinciri

| # | Rota | Model | Koşul | Not |
|---|------|-------|-------|-----|
| 1 | `own-gemini-pro` | `gemini-3-pro-image` (Nano Banana Pro) | Kendi API anahtarınız | Google'da ücretli → kendi krediniz |
| 2 | `own-gemini-nano21` | `gemini-nano-banana-2.1` | Kendi API anahtarınız | ücretli |
| 3 | `own-gemini-flash` | `gemini-3.1-flash-image` | Kendi API anahtarınız | ücretli |
| 4 | `puter-nano21` | `gemini-nano-banana-2.1` | Puter oturumu | **ücretsiz**, "User-Pays" |
| 5 | `puter-gemini-pro` | `gemini-3-pro-image` | Puter oturumu | **ücretsiz** |
| 6 | `puter-gemini-flash` | `gemini-3.1-flash-image` | Puter oturumu | **ücretsiz** |
| 7 | `puter-gemini-lite` | `gemini-3.1-flash-lite-image` | Puter oturumu | **ücretsiz** |
| 8 | `puter-openai-flare` | `gpt-image-2.5-flare` | Puter oturumu | **ücretsiz** |
| 9 | `puter-openai-2` | `gpt-image-2` | Puter oturumu | **ücretsiz** |
| 10 | `puter-flux-pro` | `black-forest-labs/flux-2-pro` | Puter oturumu | **ücretsiz** |
| 11 | `puter-flux-schnell` | `black-forest-labs/flux-schnell` | Puter oturumu | **ücretsiz** |
| 12 | `puter-cf-schnell` | `@cf/black-forest-labs/flux-1-schnell` | Puter oturumu | **ücretsiz** |
| 13 | `puter-xai` | `grok-imagine-image` | Puter oturumu | **ücretsiz** |
| 14 | `hf-flux` | `black-forest-labs/FLUX.1-schnell` | HF token | CORS destekli, ücretsiz kredi |
| 15 | `hf-sd-turbo` | `stabilityai/sd-turbo` | HF token | CORS destekli |
| 16 | `pollinations-unified` | `flux` | Pollinations `sk_` | CORS destekli, ücretsiz pollen |
| 17 | `pollinations-proxy` | `flux` / `z-image-turbo` (klasik) | `/api/proxy` sunucusu | **Sunucu tarafı** — sağlayıcı limiti kullanıcıya görünmez |
| 18 | `pollinations` | `flux` (klasik) | opt-in | Tarayıcıda Turnstile ile engellenir |
| 19 | `local-vector` | Prosedürel SVG | — | **Her zaman açık**, offline, anında |

**Neden Nano Banana "öncelikli" ama yine de ücretsiz?**
Google, Ekim 2026 itibarıyla *tüm* Nano Banana modellerinin ücretsiz API katmanını kaldırdı — hepsi ücretli.
Bu yüzden Nano Banana modelleri **Puter.js'in "User-Pays" katmanı** üzerinden sunulur: kullanıcı kendi ücretsiz
Puter hesabıyla giriş yapar, geliştirici hiçbir ödeme yapmaz, anahtar yönetimi yoktur, geliştirici tarafında
kota/rate-limit yoktur.

### Metin (beyin fırtınası / prompt zenginleştirme) zinciri
1. Kendi Gemini anahtarınız (`gemini-3.1-flash-lite`)
2. Puter sohbet (`gemini-3.1-flash-lite` → `gpt-5.4-nano`)
3. Pollinations unified sohbet (`sk_` anahtarı ile)
4. Pollinations klasik metin uç noktası (bir kez 403 alırsa oturum boyunca atlanır)
5. **Yerel şablon motoru** — şirket adı, sektör, stil ve palet üzerinden kapsamlı bir konsept üretir (her zaman çalışır)

---

## 2. Özellikler

- **3 adımlı akış:** Beyin fırtınası → Görsel açıklama (AI Enhance + referans görsel) → Logo üretimi
- **Otomatik failover + devre kesici:** hata alan rota `25 sn – 10 dk` askıya alınır, sonraki isteklerde atlanır
- **Zaman aşımı koruması:** hiçbir istek sonsuza kadar asılı kalamaz (görsel 150 sn, metin 35 sn)
- **Yerel prosedürel vektör motoru:** 10 farklı arketip (monogram, yörünge, bauhaus, dalga, petal, chevron,
  ufuk, blok, arma, maskot) × 8 palet × 6 stil → anında, ölçeklenebilir SVG
- **Vektörleştirme:** `imagetracerjs` ile PNG → gerçek SVG yolu (istemci tarafında, sunucu yok)
- **Anında mockup:** kartvizit, tişört, tabela, sosyal post, paketleme, app ikonu — hepsi tarayıcıda SVG olarak
  üretilir, **API çağrısı yok**
- **AI mockup:** referans görseliyle gerçekçi fotoğraf mockupı (görsel üretim destekleyen rotalar)
- **Brand Kit (ZIP):** `logo.png` + `logo.svg` + `mockups/` + `brand-guide.md` (renk paleti, tipografi) +
  `concept.md` + `README.txt`
- **Referans logo yükleme** (görselden görsele üretim)
- **Düzenle & İyileştir:** hazır hızlı düzenleme komutları
- **Standart / Pro kademeleri** (1K/2K/4K çözünürlük ve model kalitesi)
- **Ayarlar paneli:** canlı sağlayıcı sağlık durumu, hata sayacı, bekleme süresi

---

## 3. Kurulum

### En kolay yol — tek tık

| Sistem | Dosya | Yapılacak |
|--------|-------|-----------|
| **Windows** | `run.bat` | Çift tıkla → kurar, sunucuyu başlatır, tarayıcıyı açar |
| **macOS / Linux** | `run.sh` | `bash run.sh` (veya çift tık) |

`run.bat` / `run.sh` şunları kendisi yapar:
1. Node.js var mı ve sürümü uygun mu kontrol eder (20.19+ / 22.12+)
2. Boş port bulur (5173–5190 arası)
3. `npm install` ile bağımlılıkları kurar
4. Sunucuyu başlatır ve tarayıcıyı `http://localhost:<port>` adresinde açar

Menüden **2) Üretim modu** seçersen `dist/` klasörünü hazırlar (dağıtım için).

### Manuel kurulum

```bash
cd brandforge-free
npm install      # bağımlılıklar (~1 dk)
npm run dev      # http://localhost:5173
```

Başka port için: `npm run dev -- --port 3000`

### Hızlı Başlangıç (2 dakika)

| # | Yapılacak | Neden |
|---|-----------|-------|
| 1 | `npm install` | bağımlılıklar |
| 2 | `npm run dev` → `http://localhost:5173` | uygulama açılır |
| 3 | Üstteki sarı banddan **“Ücretsiz giriş yap”** → Puter hesabı (ücretsiz) aç | Nano Banana/GPT-Image/FLUX **ücretsiz** çalışsın diye |
| 4 | Şirket adı + sektör yaz → **Beyin Fırtınası** | marka konsepti |
| 5 | **Görsel yönü prompta uygula** → **AI Enhance** → **Yeni Logo Seçenekleri Üret** | logolar |

> 3. adımı atlayabilirsin — uygulama yerel vektör motoruyla çalışmaya devam eder (anında, ama AI değil).

### Komutlar

| Komut | Ne yapar |
|-------|----------|
| `npm run dev` | geliştirme sunucusu (hot reload) |
| `npm run build` | üretim derlemesi → `dist/` (statik) |
| `npm run preview` | üretim derlemesini yerelde çalıştırır |
| `npm start` | `vite --host 0.0.0.0` (ağdan erişim için) |

### Dağıtım
Statik bir sitektir; `npm run build` çıktısını (`dist/`) herhangi bir statik hosting'e atabilirsiniz.
**Ücretsiz sağlayıcıların limitlerini gizlemek ve web üzerinden çalıştırmak için** projeyi
[3.5 · Online Dağıtım](#35--online-dağıtım-web-üzerinden-çalıştırma) bölümündeki adımları kullanın —
`/api/proxy` sunucu fonksiyonu Vercel / Netlify / Cloudflare Worker'da otomatik çalışır.

---

## 3.5 · Online Dağıtım (web üzerinden çalıştırma)

Bu sürüm **lokal kurulum gerektirmiyor**: proje doğrudan Vercel / Netlify / Cloudflare'a deploy edilir ve
kullanıcı `https://marka-xxx.vercel.app` gibi bir adresten açar. `dist/` statik olarak kurulur; ücretsiz
sağlayıcıları çağıran `/api/proxy` uç noktası aynı projede **sunucu tarafında** çalışır — böylece sağlayıcı
limitleri **kullanıcıya hiç görünmez**.

### A · Vercel (1 dakika, tarayıcıdan)

1. Bu klasörü GitHub'a gönderin (veya `vercel` CLI kullanın, aşağıda).
2. <https://vercel.com/new> → **Add New… → Project** → repo'yu seçin → **Deploy**.
3. Proje → **Settings → Environment Variables** → aşağıdaki anahtarlardan istediğinizi ekleyin → **Save** → yeniden Deploy.
4. Bitti. `https://<proje-adiniz>.vercel.app` adresi hazır.

CLI ile (proje klasöründe):

```bash
npm i -g vercel
vercel                # geliştirme dağıtımı + yönlendirme sorularını onaylayın
vercel --prod         # üretim
vercel env add POLLINATIONS_API_KEY production   # isteğe bağlı anahtarlar
```

`vercel.json` hazır olduğu için `/api/proxy` isteği otomatik olarak `api/proxy.js` sunucu fonksiyonuna gider.

### B · Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
netlify env:set POLLINATIONS_API_KEY sk_xxx     # isteğe bağlı
```

`netlify.toml` içinde `/api/proxy` → `/.netlify/functions/proxy` yönlendirmesi hazırdır.

### C · Cloudflare (Pages + Worker)

```bash
npm i -g wrangler
wrangler pages deploy dist --project-name brandforge-free
wrangler deploy        # worker/index.js  -> /api/proxy
wrangler secret put POLLINATIONS_API_KEY
```

`wrangler.toml` Worker'ı `env.ASSETS` ile statik siteye bağlar.

### Sunucu ortam değişkenleri (hepsi isteğe bağlı)

| Değişken | Nereden alınır | Ne kazandırır | Hız |
|---------|-----------------|---------------|-----|
| `POLLINATIONS_API_KEY` | <https://enter.pollinations.ai/keys> (`sk_…`) | Pollinations unified API — 72 model, ücretsiz pollen | ~2 sn / logo |
| `VITE_APP_NAME` | serbest metin (ör. `Logo Designer`) | Uygulama adı (üst bar + sekme başlığı) | — |
| `VITE_APP_TAGLINE` | serbest metin | Alt başlık (ör. `Limitsiz AI logo üretimi`) | — |
| `HF_TOKEN` | <https://huggingface.co/settings/tokens> (`hf_…`) | FLUX.1 Schnell, SD Turbo | ~3 sn / logo |
| `GEMINI_API_KEY` | <https://aistudio.google.com/apikey> | **Nano Banana** (Google'da ücretli → kendi krediniz) | ~5 sn / logo |

**Hiçbir anahtar olmadan da çalışır:** proxy, anahtarsız Pollinations klasik uç noktasını kullanır
(~45 sn'de 1 görsel). Kullanıcı bu sırada beklemez — uygulama **anında yerel vektör taslakları** gösterir ve
AI logosu hazır oldukça taslağın yerine geçer. Yani **hiçbir koşulda "rate limit" hatası görünmez.**

### Proxy sözleşmesi (kendi proxy'nizi yazarsanız)

| Uç nokta | İstek | Yanıt |
|-----------|-------|-------|
| `GET {proxy}/image?prompt=&model=&w=&h=&seed=` | görsel üretimi | `image/*` + `x-brandforge-backend`, `x-brandforge-min-gap` |
| `POST {proxy}/image` | `{prompt, model, editDataUrl}` (düzenleme) | `image/*` |
| `GET {proxy}/text?prompt=` | metin üretimi | `text/plain` |
| `GET {proxy}?url=` | ham proxy (sadece izinli host'lar) | upstream yanıtı |

Kota oluşursa proxy `429` + `retry-after` döner; istemci sessizce bekleyip yeniden dener (kullanıcı hiçbir
şey görmez). Anahtarlar **hiçbir zaman tarayıcıya sızmaz**.

Ayarlar panelindeki **“Sunucu proxy adresi”** alanına başka bir proxy adresi yazabilirsiniz
(ör. `https://marka-proxy.vercel.app/api/proxy`).


---

## 4. Anahtarlar (hepsi isteğe bağlı)

| Anahtar | Nereden | Ne sağlar |
|---------|---------|-----------|
| Puter oturumu | Uygulamadaki **“Puter ile giriş”** butonu (ücretsiz hesap) | Nano Banana 2.1/Pro, GPT-Image 2.5, FLUX.2, Grok Imagine — **ücretsiz** |
| Google AI Studio | <https://aistudio.google.com/apikey> | Doğrudan Nano Banana (Google'da ücretli → kendi krediniz) |
| Hugging Face | <https://huggingface.co/settings/tokens> | FLUX.1 Schnell / SD Turbo (aylık ücretsiz kredi) |
| Pollinations | <https://enter.pollinations.ai/keys> | FLUX / Z-Image (ücretsiz pollen) |

---

## 5. Mimari

```
src/
  App.tsx                    · orkestrasyon (state, akış, modallar)
  types.ts                   · paylaşılan tipler
  lib/
    catalog.ts               · stiller, paletler, logo tipleri, prompt şablonları
    engine/
      types.ts               · GenRequest/GenOutput, hata sınıflandırma, withTimeout
      puter.ts               · Puter.js (görsel + sohbet + oturum)
      pollinations.ts        · klasik + unified API
      extra.ts               · Hugging Face + Pollinations unified
      gemini.ts              · kendi anahtarınızla doğrudan Gemini REST
      imageEngine.ts         · ROTA SIRASI, failover, devre kesici
      textEngine.ts          · metin zinciri + yerel şablon üretimi
      localLogo.ts           · prosedürel SVG logo motoru
    vectorize.ts             · PNG → SVG (imagetracerjs)
    mockups.ts               · anında SVG mockup sahneleri
    brandkit.ts              · JSZip ile marka kiti
    storage.ts               · localStorage ayarları
  components/                · TopBar, BriefPanel, ResultsPanel, Refine/Showcase/Settings modal, Toast
```

### Failover mantığı
```ts
for (const route of routes) {
  if (cooldown(route)) continue;          // devre dışı rota atlanır
  try { return await runRoute(route); }   // başarılı → cooldown sıfırlanır
  catch (e) { trip(route, e); }           // hata → cooldown uzatılır, sıradaki denenir
}
// hiçbiri çalışmadı → yerel vektör motoru
```

---

## 6. Bilinen sınırlamalar

- **Google'ın Nano Banana modellerinde ücretsiz API katmanı yok.** Ücretsiz erişim Puter'in kullanıcı-ölter
  (User-Pays) katmanı üzerinden sağlanır; bu, her kullanıcının kendi ücretsiz hesabıyla giriş yapmasını gerektirir.
- **Pollinations klasik uç noktası** tarayıcıdan Cloudflare Turnstile ile engellenir (403). Bu yüzden tarayıcı
  yerine **sunucu tarafı proxy** (`/api/proxy`) kullanılır; proxy olmayan kurulumlarda klasik yol varsayılan
  kapalıdır. Anahtarsız klasik erişim ~45 sn'de 1 görsel üretir (kullanıcı beklemez, taslaklar anında görünür).
- **Cloudflare Workers AI** tarayıcıya CORS başlığı vermediği için bu sürümde zincine alınmadı
  (sunucu tarafı bir proxy ile eklenebilir).
- AI mockup'lar görsel üretim destekleyen rotaları gerektirir (Puter oturumu veya kendi Gemini anahtarınız).

---

## 7. Lisans

MIT
