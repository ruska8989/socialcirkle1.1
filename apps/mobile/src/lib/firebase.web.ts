// src/lib/firebase.web.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged as webOnAuthChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile,
  setPersistence, browserLocalPersistence
} from "firebase/auth";
import {
    getFirestore, serverTimestamp,
    collection as fsCollection, doc as fsDoc,
    setDoc, addDoc, onSnapshot, query as fsQuery, where as fsWhere,
  } from "firebase/firestore";
  
  

// ⬇️ Put your Web App config here
const firebaseConfig = {
    apiKey: "AIzaSyCcxMTIxstJ_6kkSNnrWHxig_39K-ngZ-4",
    authDomain: "socialcirkle1.firebaseapp.com",
    projectId: "socialcirkle1",
    storageBucket: "socialcirkle1.firebasestorage.app",
    messagingSenderId: "491404041626",
    appId: "1:491404041626:web:204707c4b8e9f2b84d6e23"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((e) => {
    // optional: log but don't crash
    console.warn("Auth persistence error", e);
  });
const _db = getFirestore(app);

// --- Adapter so web code can call RNFirebase-style APIs like db.collection(...).doc(...).set(...)
// Supported: .collection(name).add(data), .doc(id).set(data, options), .onSnapshot(cb), .where(...).onSnapshot(cb)
function adaptQuerySnapshot(qs: any) {
  return {
    docs: qs.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data(),
    })),
  };
}
function adaptDocSnapshot(ds: any) {
  return {
    id: ds.id,
    data: () => ds.data(),
  };
}

export const db: any = {
  collection: (name: string) => {
    const cref = fsCollection(_db, name);
    return {
      add: (data: any) => addDoc(cref, data),
      doc: (id: string) => {
        const dref = fsDoc(_db, name, id);
        return {
          set: (data: any, options?: any) => setDoc(dref, data, options),
          onSnapshot: (cb: any) => onSnapshot(dref, (snap) => cb(adaptDocSnapshot(snap))),
        };
      },
      where: (field: string, op: any, value: any) => {
        const qref = fsQuery(cref, fsWhere(field as any, op as any, value));
        return {
          onSnapshot: (cb: any) => onSnapshot(qref, (qs) => cb(adaptQuerySnapshot(qs))),
        };
      },
      onSnapshot: (cb: any) => onSnapshot(cref, (qs) => cb(adaptQuerySnapshot(qs))),
    };
  },
};

// Shim to match native FieldValue usage
export const firestore = { FieldValue: { serverTimestamp } };

// Type parity so the rest of your code compiles on web
export type FirebaseAuthTypes = { User: import("firebase/auth").User };

// Cross-platform helpers (same signatures as native)
export function onAuthChanged(cb: (u: FirebaseAuthTypes["User"] | null) => void) {
  return webOnAuthChanged(auth, cb);
}
export async function signUpEmail(email: string, password: string, displayName?: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred.user;
}
export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}
export function signOutUser() {
  return signOut(auth);
}
