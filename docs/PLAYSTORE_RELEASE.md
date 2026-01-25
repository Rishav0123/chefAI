# Google Play Store Release Guide

**Goal**: Publish "Chef AI" (Kitchen Buddy) to the Google Play Store.

---

## 1. Prerequisites
- **Google Play Developer Account**: Requires a one-time $25 fee. [Sign up here](https://play.google.com/console/signup).
- **App Graphics**:
    - **App Icon**: 512x512 PNG.
    - **Feature Graphic**: 1024x500 PNG.
    - **Screenshots**: At least 2 for phone (1080x1920 recommended).

---

## 2. Generate Signed App Bundle (.aab)
You cannot upload `.apk` files to the Play Store anymore. You must upload an `.aab`.

1.  **Open Android Studio**:
    ```powershell
    cd frontend
    npx cap open android
    ```
2.  **Build Menu**:
    - Go to **Build** > **Generate Signed Bundle / APK**.
    - Select **Android App Bundle** -> Next.
3.  **Key Store (The "Signature")**:
    - *If you don't have one:* Click **Create new...**
    - **Path**: Save as `release-key.jks` (Keep this safe! If you lose it, you can't update your app).
    - **Password**: Set a strong password.
    - **Alias**: `key0` (default) or `chefai`.
    - Fill in "First and Last Name" (e.g., "Chef AI Team").
    - Click **OK**.
4.  **Build Variant**:
    - Select standard **Release** variant.
    - Click **Finish**.
5.  **Locate File**:
    - Android Studio will notify you. Click **locate**.
    - File path is usually: `frontend/android/app/release/app-release.aab`.

---

## 3. Google Play Console Setup

1.  **Create App**:
    - Click **Create App**.
    - Name: "Chef AI - Kitchen Assistant".
    - Language: English.
    - App/Game: App.
    - Free/Paid: Free.
2.  **Dashboard Setup**:
    - Follow the "Set up your app" checklist on the dashboard.
    - **Privacy Policy**: Use a free generator or link to your website's generic policy if you have one.
    - **App Access**: "All functionality is available without special access" (unless you have login, then provide test credentials: `demo@chefai.com` / `password`).
    - **Ads**: "No, my app does not contain ads" (unless you added AdMob, then Yes).
    - **Content Rating**: Fill out the questionnaire (it's safe for all).
    - **Target Audience**: 18+.
    - **News App**: No.
    - **Data Safety**:
        - Does app collect data? **Yes**.
        - Encryption? **Yes** (HTTPS).
        - Delete data? **Yes** (Supabase allows deletion).
        - Data types: Email, Photos (if using camera), App Info.

---

## 4. Upload & Release

1.  Go to **Testing** > **Internal testing** (Recommended first step).
2.  Click **Create new release**.
3.  **App Bundle**: Upload the `app-release.aab` file you generated in Step 2.
4.  **Release Name**: e.g., "1.0.0 - Initial Release".
5.  **Release Notes**: "Initial release of Chef AI. Manage your pantry and get AI recipes."
6.  **Review & Rollout**:
    - Fix any errors shown.
    - Click **Start rollout to Internal Testing**.

## 5. Moving to Production
Once you test it on your phone:
1.  Go to **Production** tab.
2.  Promote release from Internal Testing -> Production.
3.  Submit for Review.
4.  Wait 1-3 days for Google to approve.

---

## ⚠️ Important Note on "Web View" Apps
Since your app basically wraps a website (`chef-ai-beryl.vercel.app`), Google *might* ask for proof of ownership.
- If rejected for "Webview Spam": You verify domain ownership in Google Play Console using Google Search Console DNS verification.
