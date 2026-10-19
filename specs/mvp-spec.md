# HazırPlan TR — MVP Product Spec

Version 0.2 (draft) · 2026-10-18 · Owner: Buğra · Status: for review
Source material: `research/readyplan-app-teardown.md` + `research/readyplan-premium-addendum.md` (live ReadyPlan teardown incl. Premium pass), `research/competitors-tr.md`, master plan `.hermes/plans/2026-10-18_readyplan-tr-pe-process-plan.md`.

---

## 1. Product definition

**HazırPlan** is a free, offline-first family emergency plan builder for Turkey. A household completes a guided wizard in under an hour; every member carries the same plan on their phone (shared via Aile Kodu, no accounts); the plan stays alive through drill reminders and expiry tracking.

**Non-negotiable principles (from venture decisions):**
1. **Free + offline is the product.** No feature ships that requires connectivity at the moment of use.
2. **No accounts in MVP.** Sharing = Aile Kodu (encrypted plan export / QR import).
3. **No AI, no alerts.** Deterministic wizard; earthquake alerts are AFAD/Kandilli's job.
4. **Data stays on device** (IndexedDB). No server, no KVKK burden in MVP.
5. Turkish-first copy, plain civil-defense language (AFAD-compatible), not military jargon.

## 2. Data model (v1 schemas)

Core insight from ReadyPlan: **Plan = ordered Steps, each Step links to typed Sheets.** We adopt this wholesale.

### 2.1 Plan
```json
{
  "id": "uuid", "locale": "tr", "version": 1, "createdAt": "", "updatedAt": "",
  "hazard": "earthquake | wildfire | fire | flood | landslide | power_outage | other",
  "title": "Deprem Planı",
  "household": { "size": 4, "home": "apartment|house", "members": [
    {"name": "", "role": "yetişkin|çocuk|yaşlı|engelli", "notes": "", "phone": ""} ] },
  "circumstances": ["mobility", "medical_equipment", "critical_meds", "no_vehicle", "pets", "remote"],
  "steps": [ { "order": 1, "title": "", "detail": "", "sheetRefs": ["sheet-uuid"], "done": false } ],
  "sheetIds": [], "notes": ""
}
```

### 2.2 Sheets (TR taxonomy — 6 MVP types, mapped from ReadyPlan's 11)
| HazırPlan type | ReadyPlan analog | Purpose |
|---|---|---|
| **İletişim Planı (PACE)** | PACE Plan + Auth Tables | Ana/Yedek/Yedek2/Acil iletişim yöntemleri + buluşma çağrı kelimeleri |
| **Tahliye Rotası** | EXFIL Plan | Ev → buluşma noktası → toplanma alanı rota adımları |
| **Deprem Çantası** | Go Bag | Kişi bazlı çanta kontrol listesi + son kullanma tarihleri |
| **Envanter** | Inventory List | Ev stokları (su, ilaç, gıda) + adet + tarihler |
| **Kontrol Listesi** | Checklist | Genel (ev hazırlık, araç kontrolü) |
| **Acil Kişiler** | Reference Sheets | Aile dışı kontaklar (komşu, akraba, doktor) + kurumlar (112, AFAD, Kızılay) |

Deferred to later phases: Card of the Day / One Time Pad (tactical niche, not TR-mainstream).

### 2.3 Family & Locations
```json
{ "family": {"code": "AILE-KODU-8char", "members": [...] },
  "locations": [ {"id":"","name":"Buluşma Noktası","type":"rally|assembly|home|other","lat":0,"lng":0,"notes":""} ],
  "drillLog": [ {"planId":"", "date":"", "kind":"full|comms|evac"} ] }
```
Free-tier cap: **5 konum** (matches ReadyPlan's free cap). `drillLog` feeds the Hazırlık Skoru's drill checks (§5) — we *know* if they drilled; ReadyPlan has to ask.

## 3. Wizard flow (replaces ReadyPlan's 6 steps, TR-adapted)

Progress shown as "Adım n/5". Every step skippable. Back/Continue on all. Live "Plan Özeti" before save.

1. **"Neyeye karşı planlıyorsunuz?"** — 🌍 **Deprem (varsayılan)**, 🌲 **Orman Yangını (varsayılan)**, 🔥 Ev Yangını, 🌊 Sel, ⛰️ Heyelan, ⚡ Elektrik Kesintisi, ✍️ Diğer (0/50)
   *Deprem ve Orman Yangını üstte birlikte öne çıkarılır: Türkiye'nin en yüksek kayıplı iki afet tipi (deprem — yıl boyu; orman yangını — yaz ayları, Muğla/Antalya/Ege hattı).*
2. **"Hanenizde kaç kişi yaşıyor?"** — 1–5+, **apartman mü / müstakil mi** (TR-specific), optional il/posta kodu ("İl bazlı rehberlik için")
3. **"Kim var evde?"** — multi-select: Çocuk (0-18), Yaşlı (65+), Evcil hayvan, Özel bakım ihtiyacı olan
4. **"Özel durumlar?"** — Hareket kısıtlılığı, Medikal cihaz (oksijen/diyaliz), Kritik ilaçlar, Araç yok, Bakıma muhtaç aile ferdi
5. **"Başka eklemek istediğiniz?"** — free text (0/500) + **Plan Özeti** (Tehlike / Hane) → **"Planımı Oluştur"**

**"Planımı Oluştur" is deterministic template assembly** (not AI): hazard + household answers select and pre-fill the TR content-pack plan template (steps + suggested sheets), which the user then edits. This is our "guided, no blank page" moment at zero cost. Presentation borrows ReadyPlan's streaming excitement: steps appear one by one ("Adım ekleniyor…") while assembly runs — same theater, zero API cost.

**Save path rule (from their observed bug):** the wizard ends with an explicit, visible save confirmation ("Plan kaydedildi: [isim]" toast + plan appears in Planlarım). The ReadyPlan wizard's "Apply to My Plan" failed to save 3/3 times in our live test — onboarding drop-off is death for a plan app; our e2e tests must assert the plan lands in the list.

## 4. TR Content Pack (`/content/tr.json`)

Structure per plan template (steps + linked sheet skeletons):
- **Deprem Planı (default template, the flagship):**
  1. Sarsıntı anında: "Drop-Cover-Hold" pozisyonu (→ Notes: güvenli köşe tanımı)
  2. Sarsıntı durunca: Gaz/elektrik/su kapama kontrolü (→ Kontrol Listesi: Ev Güvenlik)
  3. Çanta ve aileyi topla (→ Deprem Çantası per kişi)
  4. Binadan çık / toplanma alanına git (→ Tahliye Rotası + Konumlar)
  5. Aileyle iletişim kur (→ İletişim Planı PACE + Acil Kişiler)
  6. Durumu paylaş, yardım değerlendir (→ Notes)
- **Orman Yangını Planı (varsayılan #2):** TR-specific (not in the US default flow):
  1. Uyarı takibi: ORKAT/AFAD uyarı seviyesini kontrol (→ Notes: kaynak listesi)
  2. "Hazır" seviyesi: ev dışı yanıcı maddeleri uzaklaştır, çantayı kapıya koy (→ Kontrol Listesi: Yangın Hazırlık)
  3. "Bekle/Tahliye" seviyesi: aile buluşma noktasına hareket (→ Tahliye Rotası — rota alternatifleri: duman/yol kapanma senaryosu)
  4. Hayvanlar ve araç planı (→ Kontrol Listesi: Araç + Deprem Çantası reuse)
  5. İletişim: aile + mahalle whatsapp/muhtar hattı (→ İletişim Planı PACE + Acil Kişiler)
- **Ev Yangını / Sel / Heyelan / Elektrik Kesintisi templates:** same step-sheet skeleton, hazard-specific content.
- Sheet skeletons: e.g. Deprem Çantası items list from AFAD/Kızılay standard 12-item guidance (water 2L/person/3-day, first aid, whistle, dust mask, flashlight, power bank, copies of IDs, cash, meds list…), with quantity + expiry fields.
- Kurum referansı: 112 (tek acil numara), AFAD, Kızılay, ilçe toplanma alanı bilgilendirme metni.

## 5. Hazırlık Skoru (deterministic readiness rubric — free, offline, unlimited)

ReadyPlan's best Premium feature (Plan Audit: AI-graded, **5/month quota, paid**) ships in HazırPlan as a free, deterministic, always-current score. **No AI, no "run audit" button:** every check is a pure function of plan/sheet data + tatbikat log, recomputed on every save and displayed on the dashboard. Their 5-question self-assessment (drill? out-of-area contact? offline copy? shared? outsider knows?) becomes data we already hold — drill answer comes from `drillLog`, offline copy from the print/export log, sharing from Aile Kodu activity.

### 5.1 Rubric v1 (TR, adapted from "consumer-household-readiness v1.2.0")
| Kategori | Ağırlık | Kontroller |
|---|---|---|
| **İletişim** | 30% | PACE dolu (4/4 yöntem) · Bölge dışı kontak tanımlı · Kontaklar çevrimdışı erişilebilir (yazdırıldı/dışa aktarıldı) · 2 buluşma noktası tanımlı · İletişim tatbikatı yapıldı (drillLog) |
| **Tahliye** | 20% | 2 farklı yönde tahliye hedefi · Rota adımları girili · Alternatif rota var · Araçsız hane ise toplu taşıma planı |
| **Evde Sığınma** | 15% | Güvenli oda tanımlı · 72 saat su (kişi başı hesap, envanterden) · Envanter doluluk ≥ temel · İlaç/medikal ihtiyaçlar kayıtlı |
| **Evrak & Finans** | 15% | Kimlik belgeleri listesi · Sigorta bilgileri · Nakit buffer · Dijital/ fiziksel kopya yeri |
| **Bakıma Muhtaç Kişiler** | 10% | Koşullu: hanedde çocuk/yaşlı/engelli varsa aktifleşen özel ihtiyaç planı kontrolü (yoksa kategori "uygulanamaz" sayılır ve ağırlık dağıtımı yeniden normalize edilir) |
| **Paylaşım & Erişilebilirlik** | 10% | Aile Kodu ile ≥1 üyeye paylaşılmış · Yazdırılmış kopya var (yazdırma eylemi otomatik işaretler) · Aile dışı kişi haberdar (**paylaşım günlüğünden**: komşu/arkadaş/misafir/grup ile gerçek paylaşılmış) |

Score = Σ geçilen kontrol × kategori ağırlığı (uygulanamaz kategoriler normalize) → % → seviye:
**0–39 "Daha yeni başladınız" · 40–69 "Yoldasınız" · 70–100 "Hazır Aile"** — dashboard kartı + öneri sırası (⚠️/💡/ℹ️) bu skordan üretilir.

### 5.2 Check output format (their UX standard, our copy)
Her kontrol: **durum** (*"Planlanmadı"* = konu planda hiç geçmiyor / *"Başarısız"* = açıkça hayır kayıtlı) + **kanıt** (plandaki ilgili alan alıntısı) + **"Sıradaki adım:"** — tek cümle, somut. Kopya kalitesi hedefi (ReadyPlan'ınkilerden):
- *"Bir Cumartesi seçin. Planın iletişim kısmını baştan sona çalıştırın. Bozuk bir şey mutlaka bulacaksınız. Onu düzeltin."*
- *"Kişi listesini yazdırın. Bir kopyası çantaya, biri buzdolabına, biri de araca."*

### 5.4 Documented decisions (code-review-1)
- Drill attribution **per-plan** (`drillLog.planId`).
- Same-type sheet scoring: **first sheet in `plan.sheetIds` order**.
- Boolean settings false = **"Başarısız"** (explicit no); absent topic = "Planlanmadı".
- Water target: **9L/person/3-day** (2L içme + 1L hazırlık/gün) in envanter; çanta carries 2L içme.
- Dependent households get the **"Kim, kime yardım ediyor?"** step auto-injected by assembly; the bakım check matches injected step titles (passed to `scorePlan` as `ozelIhtiyacStepTitles`).

### 5.3 Why deterministic wins here
- Free + offline + **unlimited** vs their 5/month paid quota — the habit-forming feature becomes our top-of-funnel
- Instant, explicable, no hallucination (their AI audit invented "isolated location" details about a 1-step plan)
- Tatbikat log answers their weakest question ("Have you drilled?") with facts, not memory

## 6. Screens (MVP inventory)

1. **Karşılama / Dashboard** — Hazırlık Skoru kartı (seviye + %), kategori dökümü, öneriler (⚠️/💡/ℹ️, skor-sıralı), Hızlı Eylemler (Yeni Plan, Envanter Ekle, Kontrol Listesi), Planlarım (Mark Complete per step)
2. **Plan Sihirbazı** (5 steps, modal embedded on dashboard — ReadyPlan's zero-click pattern)
3. **Plan detay** — step listesi + bağlı sheet'ler (accordion), Mark Complete, yazdır butonu, PACE/Tahliye boş slotları ("İletişim Planı bağlı değil" empty state)
4. **Sheet editörleri** (6 tür) — checklist UI, quantity/expiry for çanta & envanter; PACE editöründe satır içi eğitim ("Primary: ana iletişim yönteminiz…")
5. **Konumlar** — Leaflet map, tap-to-pin, offline tiles (home city), 5 konum cap
6. **Aile Kodu** — generate QR / share code; import screen (QR scan or code entry); merge policy: latest write wins per sheet, version stamps
7. **Tatbihat** — reminder interval per plan (default: ayda 1), local notification, "tatbikatı yaptım" → drillLog + puan
8. **Başarımlar** — MVP set: 12 achievements (first plan, %100 çanta, ilk tatbihat, aileye kod gönder, envanter tam…), points, 3 levels (Hazırlık Çırağı → Hazırlık Ustası → Hazır Aile)
9. **Ayarlar** — dil (tr), yazdırma, veri dışa/içe aktar (JSON), Aile Kodu yönetimi
10. **Paylaş** (PlanDetail'den) — alıcı: 🏘️ Komşu / 🤝 Arkadaş / 🚪 Misafir / 👥 Grup (+isteğe bağlı isim); eylemler: Yazdır (misafir kopyası → printedCopy otomatik true), WhatsApp (özet metin), Uygulamayla gönder (Web Share/pano), Misafir görünümü; HER eylem shareLog'a yazılır → skor gerçek veriden okur
11. **Misafir Görünümü** (`/plan/[id]/misafir`) — salt-okunur plan sayfası (adımlar + acil kişiler + PACE), buzdolabı-posteri @media print CSS
12. **(Web) Bilgi/Yardım** — statik: 112, AFAD linkleri, SSS

**Deliberately NOT in MVP:** groups with roles, knowledge-check quizzes, AI assistant, route builder with turn-by-turn, online sync. (Hazırlık Skoru covers the audit use-case deterministically — §5.)

## 7. Technical architecture

- **PWA**: SvelteKit, static export; installable; service worker precaches app shell + content pack + map tiles for home city.
- **Storage**: Dexie (IndexedDB). Single `planStore` + `sheetStore` + `settingsStore`. Export/import = encrypted JSON (WebCrypto AES-GCM, key derived from Aile Kodu).
- **Scoring engine**: pure TS module `scorePlan(plan, sheets, drillLog) → {pct, categories[], checks[]}` — unit-tested, no I/O, reused by dashboard + plan detail.
- **Aile Kodu**: 8-char Crockford-base32 code = family ID + share token; QR = `hazirplan.app/a/[payload]` URL. Import merges by `updatedAt` per entity.
- **Print**: dedicated print stylesheet per plan (buzdolabı posteri formatı: steps + konumlar + iletişim).
- **i18n**: Paraglide; `tr.json` content pack; structure ready for `es-pe.json` (Phase PE).
- **Deploy**: GitHub Pages + custom domain; staticrypt only if paywall pages exist later (none in MVP).

## 8. Free tier rules (MVP = free, no payment at all)

| Feature | Free |
|---|---|
| Plan sayısı | **3** (ReadyPlan gives 2; we beat it) |
| Her sheet türü | 2 adet |
| Konum | 5 |
| **Hazırlık Skoru** | **Sınırsız** (ReadyPlan: 5/month, Premium-only) |
| Aile Kodu paylaşımı | Sınırsız (this is the product) |
| Tatbihat + başarımlar | Tam |
| Yazdırma | Tam |

No paywall in MVP. Monetization (Phase 2) deferred until waitlist + usage data justify it; likely shape: kurumsal/white-label first, consumer premium second.

## 9. Validation gates (from master plan)

- 20 beta families build a full plan in <60 min unaided (timed test)
- **Wizard save e2e test asserts the plan appears in Planlarım (their bug, our blocker)**
- **Scoring engine: 100% unit coverage; score is identical across reloads/devices (pure function)**
- Offline e2e: flight-mode walkthrough of full journey = release blocker
- Native-speaker copy sign-off (you review TR copy)
- Lighthouse PWA ≥90; cold-start interactive <2s on mid-range Android

## 10. Open items for review

1. Deprem Çantası item list: adopt AFAD's standard list verbatim vs. curated? (I lean curated + "AFAD uyumlu" claim avoided unless verified)
2. Map tiles offline strategy: city-level MapLibre + cached tiles vs. simple static map images in MVP
3. Print format: single-page buzdolabı poster vs. multi-page full plan (both? poster first)
4. App name check: "HazırPlan" trademark/domain availability in TR
5. Hazırlık Skoru "uygulanamaz" normalization: hide or show greyed-out category? (I lean show-as-greyed, keeps 6-category shape familiar)
