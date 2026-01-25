# 🔔 Notification Implementation Plan
**Objective:** Add Push Notification support to the ChefAI Android App.

## 🏗️ Architecture Overview
We will use **Firebase Cloud Messaging (FCM)** as the delivery service, **Supabase** has the backend/trigger, and **Capacitor** to receive messages on the device.

```mermaid
graph LR
    A[Supabase Edge Function] -- Sends --> B[Firebase (FCM)]
    B -- Pushes --> C[Android Device (ChefAI)]
    C -- Listens --> D[Capacitor Plugin]
```

---

## 📅 Phase 1: Firebase Console Setup (Prerequisite)
> **Action Required from User**
Before we write code, you need to set up Firebase.

1.  **Create Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a project named "ChefAI".
2.  **Add Android App**:
    *   Package Name: `com.rishav.chefai` (Important: Must match your new package name!)
    *   Download `google-services.json`.
3.  **Upload File**: Place `google-services.json` into `d:\kitchen-buddy\frontend\android\app\`.

---

## 🛠️ Phase 2: Install Dependencies
We need to install the Capacitor official push plugin.

1.  **Install Plugin**:
    ```bash
    npm install @capacitor/push-notifications
    npx cap update
    ```
2.  **Register Plugin** (Android):
    *   Usually automatic in Capacitor 6+, but sometimes requires `MainActivity` tweaks.

---

## 📱 Phase 3: Frontend Implementation
We will add a Listener in `App.jsx` or `Layout` to ask for permission and listen for incoming messages.

**Key Steps:**
1.  **Request Permission**: Ask user "Allow ChefAI to send notifications?".
2.  **Register Token**: Get the device's unique FCM Token.
3.  **Save Token**: Save `user_id` + `fcm_token` to a new Supabase table `user_devices`.
4.  **Listen**: Show an alert or badge when a message arrives while the app is open.

---

## ☁️ Phase 4: Backend (Sending Notifications)
How will notifications be triggered?

**Option A: Manual (Firebase Console)**
*   Good for marketing campaigns (e.g., "New Premium Features!").
*   Done via Firebase website -> specific FCM tokens or Topics.

**Option B: Programmatic (Supabase Edge Functions)**
*   Triggered when data changes (e.g., "Pantry Item Expiring Soon").
*   Requires a Supabase Edge Function to call FCM API.

---

## ✅ Step-by-Step Execution Plan
1.  [ ] **User**: Upload `google-services.json` to `android/app/`.
2.  [ ] **Dev**: Install `@capacitor/push-notifications`.
3.  [ ] **Dev**: Configure `AndroidManifest.xml` (Permissions).
4.  [ ] **Dev**: Create `user_devices` table in Supabase.
5.  [ ] **Dev**: Implement `useNotifications` hook in Frontend.
6.  [ ] **User**: Test by sending a test message from Firebase Console.
