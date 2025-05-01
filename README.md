# 📱 Neighbourhood Alert App

> A mobile panic button and neighborhood safety reporting app built with **React Native + Expo** and integrated with **Firebase**. Designed for real-time emergency alerts, community reports, and GPS-based response coordination.

---

## 🚀 Features

- 🔐 OTP-based phone number authentication (Firebase)
- 💇 Personal information capture (Name, ID)
- 🚨 Panic Button to request help
- 🧽 GPS location tracking for emergencies
- 👮 List of nearby security services and neighbors
- 📝 Incident reporting (Break-in, suspicious activity, etc.)
- ☁️ Firebase Firestore integration for data persistence
- 📡 Push-ready architecture (for future real-time alerts)

---

## 🛠️ Tech Stack

| Tool/Service      | Purpose                          |
|-------------------|----------------------------------|
| Expo SDK (React Native) | Cross-platform mobile UI      |
| Firebase Auth      | Phone OTP login                  |
| Firestore DB       | Cloud-based data storage         |
| Expo Location      | GPS access                       |
| Expo Dev Client    | Custom dev builds with Firebase  |

---

## 📦 Folder Structure

```
Neighbourhood_alert/
│
├— assets/              # Images and static assets
├— components/          # Reusable UI components
├— screens/             # App screens (Login, OTP, Home, etc.)
├— firebase.js          # Firebase config
├— App.js               # App entry and navigation
└— package.json         # Project config
```

---

## ✅ Getting Started

### 1. 📥 Clone the repo

```bash
git clone https://github.com/your-username/Neighbourhood_alert.git
cd Neighbourhood_alert
```

### 2. 📦 Install dependencies

```bash
npm install
```

### 3. 📱 Start the project

```bash
npx expo start
```

Use **Expo Go app** to scan the QR code or run on emulator.

---

## 🔐 Firebase Setup

> Make sure you or your team creates a Firebase project at https://console.firebase.google.com.

### Firebase Services Used:
- Authentication (Phone)
- Firestore Database

### 1. Create a file `firebase.js`:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-BUCKET",
  messagingSenderId: "SENDER-ID",
  appId: "APP-ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2. Enable phone auth:
- Go to Firebase Console → Authentication → Sign-in method → Enable **Phone**

### 3. Enable Firestore:
- Firebase Console → Firestore → Create Database (Start in test mode)

---

## 🧪 Running on Device with OTP Support

### 1. Eject from Expo Go to Native Build

```bash
npx expo prebuild
```

### 2. Install dev client

```bash
npx expo install expo-dev-client
```

### 3. Run on device/emulator

```bash
npx expo run:android
# or
npx expo run:ios
```

---

## 👥 Collaboration Guide

### 🔀 Branching Strategy

- `main` — stable production version
- `dev` — active development version
- `feature/<name>` — for new features

### ✅ Git Workflow

```bash
# Create feature branch
git checkout -b feature/otp-auth

# Make changes
git add .
git commit -m "Added OTP auth screen"

# Push and create pull request
git push origin feature/otp-auth
```

### 📝 Contributions

- Follow consistent naming conventions (camelCase for variables, PascalCase for components)
- Use comments for complex logic
- Keep components modular (1 screen/component per file)

---

## 📌 Team Tasks & Ideas

| Feature                     | Status     |
|-----------------------------|------------|
| Phone OTP Auth              | ✅ Done     |
| Personal Info Screen        | ✅ Done     |
| Panic Button                | ✅ Done     |
| GPS Location Tracking       | ✅ Done     |
| Incident Reporting          | ✅ Done     |
| Firebase Firestore Logging  | ✅ Done     |
| Push Notifications          | 🖒 Planned  |
| Admin Dashboard (web)       | 🖒 Optional |

---

## 📄 License

This project is open-source and free to use for community safety initiatives.

---

### 🧠 Made with ❤️ by [Your Team Name Here]

