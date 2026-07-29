# AlternativeHub — Automated Deploy System (हिंदी गाइड)

> **लक्ष्य:** जब भी आप कोड बदलकर GitHub पर push करें, साइट `alternativehub.in` अपने-आप update हो जाए — बिना किसी manual काम के।

---

## यह कैसे काम करता है (सिस्टम का नक़्शा)

```
आप कोड बदलते हैं
      │  git push
      ▼
   GitHub (main branch)
      │
      ├──► CI workflow      → typecheck + build चेक (गलत कोड रोकता है)
      │
      └──► Deploy workflow  → 1. Database migration production पर लगाता है
                              2. Search index sync करता है (optional)
                              3. Vercel पर deploy करता है → साइट live!
```

दो फ़ाइलें यह सब चलाती हैं:
- `.github/workflows/ci.yml` — हर push/PR पर कोड जाँचता है
- `.github/workflows/deploy.yml` — सिर्फ़ `main` branch पर auto-deploy करता है

---

## एक बार का Setup (सिर्फ़ पहली बार, ~15 मिनट)

### 1. मुफ़्त PostgreSQL database बनाएँ
- [neon.tech](https://neon.tech) पर जाएँ → project बनाएँ → **Connection string** copy करें
  (कुछ ऐसा दिखेगा: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`)

### 2. Vercel पर project बनाएँ
- [vercel.com](https://vercel.com) → GitHub से लॉगिन → **Add New Project** → `Alternativehub` repo चुनें
- **Environment Variables** डालें:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon वाली string |
| `AUTH_SECRET` | कोई लंबा random text (टर्मिनल: `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://alternativehub.in` |
| `AUTH_URL` | `https://alternativehub.in` |
| `ANTHROPIC_API_KEY` | (AI फ़ीचर्स के लिए — optional) |

- **Deploy** दबाएँ। पहली बार साइट `xyz.vercel.app` पर चलेगी।

### 3. पहली बार database में डेटा भरें
अपने कंप्यूटर पर, `.env` में वही Neon `DATABASE_URL` डालकर:
```bash
npx prisma migrate deploy   # टेबल बनाओ
npm run db:seed             # शुरुआती tools, categories, blog भरो
```

### 4. GitHub Secrets डालें (auto-deploy के लिए)
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | कहाँ से मिलेगा |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | नीचे "IDs कैसे पाएँ" देखें |
| `VERCEL_PROJECT_ID` | नीचे देखें |

**IDs कैसे पाएँ:** अपने कंप्यूटर पर project फ़ोल्डर में:
```bash
npm i -g vercel
vercel link      # repo को Vercel project से जोड़ो
cat .vercel/project.json   # यहाँ orgId और projectId दिखेंगे
```

### 5. Hostinger में domain जोड़ें (DNS)
- Vercel project → **Settings → Domains** → `alternativehub.in` add करें
- Hostinger hPanel → **Domains → alternativehub.in → DNS Records**:

| Type | Name | Value |
|---|---|---|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

(पुराने @ और www वाले A/CNAME records हटा दें)

---

## बस! अब सिस्टम automatic है

अब जब भी आप (या मैं) कोड बदलें:
```bash
git add -A
git commit -m "मेरा बदलाव"
git push
```
→ GitHub Actions अपने-आप चलेगा → migration लगेगा → Vercel पर deploy होगा → **कुछ मिनटों में `alternativehub.in` update हो जाएगी।** ✅

Progress देखने के लिए: GitHub repo → **Actions** tab।

---

## दो तरीक़े — कौनसा चुनें?

**तरीक़ा A — GitHub Actions (जो अभी बना है):** पूरा control, migration + search sync + deploy एक साथ। ऊपर के सारे secrets चाहिए।

**तरीक़ा B — सिर्फ़ Vercel native (सबसे आसान):** Vercel में repo connect करते ही वह हर push पर अपने-आप deploy करता है। `vercel.json` में build command पहले से migration चलाती है। इसमें GitHub secrets की ज़रूरत नहीं — बस Vercel में `DATABASE_URL` env var होना चाहिए।

> अगर तरीक़ा B इस्तेमाल कर रहे हैं तो `.github/workflows/deploy.yml` को हटा दें (वरना दो बार deploy होगा)। CI workflow (`ci.yml`) दोनों में रख सकते हैं।

**शुरुआत के लिए तरीक़ा B आसान है।** ज़्यादा control चाहिए तो तरीक़ा A।

---

## ⚠️ ज़रूरी: पहले Hostinger का पुराना deployment हटाएँ

अभी Hostinger के Cloud plan पर repo connect है — वह Next.js नहीं चला सकता। hPanel dashboard में **⋮ मेनू → GitHub disconnect** करें और `public_html` की repo files delete करें। Hostinger सिर्फ़ domain/DNS के लिए रखें।
