# Chef AI Monetization & Shopping List Implementation Guide

**Status**: Draft / Future Implementation
**Goal**: Transform "Chef AI" from a utility to a revenue-generating platform by integrating a Shopping List with Programmatic Ads (Google AdMob).

---

## 1. Feature Overview: The Shopping List
Before monetization, we need high-intent traffic. The **Shopping List** is the vehicle for this. Users listing items (e.g., "Milk", "Bread") are signaling immediate intent to purchase.

### 1.1 Database Design
We need a robust backend to store items.

**Table**: `shopping_items`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | String | Foreign Key to User |
| `item_name` | String | e.g. "Oats" |
| `is_checked` | Boolean | Default `false` |
| `created_at` | Timestamp | |

### 1.2 Backend API (`shopping.py`)
Create a new router `app/routers/shopping.py`.

- `GET /shopping/{user_id}`: Fetch list.
- `POST /shopping`: Add item (Body: `{ "user_id": "...", "item_name": "..." }`).
- `PUT /shopping/{item_id}`: Toggle `is_checked`.
- `DELETE /shopping/{item_id}`: Remove item.

### 1.3 Frontend Component (`ShoppingList.jsx`)
Replace the placeholder in `App.jsx` with a real component.
- **Input**: Text field with "Add" button.
- **List**: Map through items. Use a checkbox for `is_checked`.
- **Delete**: Trash icon per row.

---

## 2. Phase 1: Integration with Google AdMob (Programmatic)
This is the "Stage 2" strategy: Auto-filled ads via Google.

### 2.1 Prerequisites
1.  **AdMob Account**:
    - Sign up at [apps.admob.com](https://apps.admob.com).
    - Create a new App (Android).
    - Create an **Ad Unit** (Select "Banner" for simplicity, or "Interstitial" for high revenue).
    - **Copy your App ID** (`ca-app-pub-xxxxxxxx~yyyyyyyy`) and **Ad Unit ID**.
2.  **Capacitor Plugin**:
    - Since this is a PWA/Hybrid app, we use `@capacitor-community/admob`.

### 2.2 Installation
Run these commands in `frontend/`:
```bash
npm install @capacitor-community/admob
npx cap update
```

### 2.3 Android Configuration (`android/app/src/main/AndroidManifest.xml`)
Add your App ID to the manifest inside `<application>` tag:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_APP_ID_HERE"/>
```

### 2.4 Code Implementation (`AdMobController.jsx`)
Create a helper component to manage ads.

```javascript
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

export const initializeAdMob = async () => {
    await AdMob.initialize();
};

export const showBanner = async () => {
    await AdMob.showBanner({
        adId: 'YOUR_AD_UNIT_ID', // Use Test ID 'ca-app-pub-3940256099942544/6300978111' for dev
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
    });
};

export const hideBanner = async () => {
    await AdMob.hideBanner();
};
```

**Usage in `ShoppingList.jsx`**:
```javascript
useEffect(() => {
    // Show Ad when user opens list
    showBanner();
    return () => {
        // Hide Ad when user leaves list
        hideBanner();
    };
}, []);
```

---

## 3. Phase 2: "High Value" Direct Sponsorships (Future)
Once you have traction (>10k users), shift to direct brand deals.

### 3.1 The "Native" Ad Concept
Custom render ads to look like ingredients.
- **Frontend**: Instead of AdMob, fetch "Ads" from your own backend (`GET /ads`).
- **Backend Table**: `ad_campaigns`
    - `keyword`: "chips"
    - `brand`: "Lays"
    - `image_url`: "..."
    - `link`: "blinkit://..."
- **Matching Logic**: When rendering the list, if `item.name` == `ad.keyword`, inject the Ad Card immediately after it.

### 3.2 Deep Linking
Enable one-tap purchase by using App Schemes.
- **Swiggy**: `swiggy://instamart/search?query={keyword}`
- **Blinkit**: `blinkit://search?q={keyword}` (Note: Schemes change often, verify documentation).

---

## 4. Monetization Strategy Roadmap
1.  **Month 1-3**: Build Shopping List + turn on **AdMob Banners**. (Goal: Rs 1,000 - 5,000/mo active income).
2.  **Month 4-6**: Gather Data. "We have 5,000 searches for 'Milk'".
3.  **Month 6+**: Pitch to **Amul/Nestle agencies**. "Sponsor the 'Milk' keyword for Rs 50,000/month".
