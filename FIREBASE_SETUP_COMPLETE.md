# Firebase Configuration Guide

## Overview

This project uses Firebase for backend services including:

- Firestore (cloud database)
- Firebase Authentication
- Firebase Analytics

## Configuration

### Environment Variables

Firebase credentials are configured via environment variables in `.env` files:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAqS_rWdY5yhXwBLXL48Nooc-xfHpi5f5c
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=beepvelozz.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=beepvelozz
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=beepvelozz.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=418888118827
EXPO_PUBLIC_FIREBASE_APP_ID=1:418888118827:web:155021bed2f6cf095c706e
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-PVB66RW3B7
```

These variables are used by:

- `.env` - Development environment
- `.env.production` - Production environment
- `.env.example` - Template for new developers

## Firebase Configuration Files

### `src/config/firebaseConfig.ts`

Central Firebase configuration file that:

- Loads credentials from environment variables
- Provides fallback values
- Validates configuration on load
- Exports `FIREBASE_CONFIG` object

### `src/services/firebase.ts`

Firebase initialization service that:

- Initializes the Firebase app instance
- Sets up Firestore database (`db`)
- Sets up Firebase Authentication (`auth`)
- Initializes Analytics
- Exports ready-to-use Firebase services

### `services/firestore.ts`

Main Firestore service with:

- Database and auth exports
- Network status management
- Retry logic for operations
- Domain-specific helpers and types
- Session and package management

## Usage

### Basic Firestore Operations

```typescript
import { db } from '@/services/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

// Add a new document
const docRef = await addDoc(collection(db, 'sessions'), {
  operatorName: 'John Doe',
  startTime: serverTimestamp(),
  status: 'active'
});

// Query documents
const q = query(collection(db, 'sessions'), where('status', '==', 'active'));
const snapshot = await getDocs(q);

snapshot.forEach((doc) => {
  console.log(doc.id, '=>', doc.data());
});
```

### Authentication

```typescript
import { auth } from '@/services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Sign out
await signOut(auth);
```

### Using the Firestore Service

```typescript
import { db, auth, fetchDriversWithCache } from '@/services/firestore';

// Use pre-built helpers
const drivers = await fetchDriversWithCache();
```

## Initialization Flow

1. **App Start**: Expo loads environment variables from `.env` (or `.env.production`)
2. **Firebase Init**: `src/services/firebase.ts` is loaded and initializes Firebase
3. **Services**: All services that need Firebase import from the centralized services
4. **Components**: Components use pre-initialized `db` and `auth` instances

## Best Practices

1. **Always import from centralized services**

   ```typescript
   // ✅ Good
   import { db } from '@/services/firebase';
   
   // ❌ Avoid - don't reinitialize
   import { initializeApp } from 'firebase/app';
   const app = initializeApp(config);
   ```

2. **Use environment variables for credentials**
   - Keep credentials out of source code
   - Use different values for development and production

3. **Validate configuration**
   - The `validateFirebaseConfig()` function checks all required fields
   - Errors will be thrown at startup if configuration is invalid

4. **Handle network errors**
   - Use the retry logic in `services/firestore.ts` for resilient operations
   - The service includes network status management

## Troubleshooting

### Missing Firebase Configuration

If you see: `Missing Firebase configuration: apiKey, ...`

- Ensure `.env` file exists in the project root
- Verify all `EXPO_PUBLIC_FIREBASE_*` variables are set
- Run `expo start --clear` to refresh environment

### Analytics Not Available

Analytics may not initialize in development. This is expected:

- Check console for warnings (not errors)
- Analytics will work in production builds

### Network Issues

- The service automatically detects network problems
- Failed operations are retried with exponential backoff
- Network can be disabled if too many failures occur

## Security Rules

Firebase Firestore is protected by security rules defined in `FIRESTORE_RULES_DEV.txt`.
Ensure proper rules are in place for production before deploying.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
