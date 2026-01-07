
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    onSnapshot,
    getDoc,
    updateDoc
} from "firebase/firestore";
import { Lead, Deal, UserProfile } from "../types";

// --- CONFIGURATION ---
// TODO: PASTE YOUR FIREBASE CONFIGURATION HERE
const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection References
const USERS_COLLECTION = 'users'; // We'll store data under a generic 'default_user' or specific user ID
const USER_DOC_ID = 'default_vsd_user'; // For this single-user app version

// --- HELPERS ---

export const subscribeToProfile = (onUpdate: (data: UserProfile) => void) => {
    return onSnapshot(doc(db, USERS_COLLECTION, USER_DOC_ID), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure we only pass back the profile part if your structure is nested, 
            // or the whole doc if it is flat. Let's assume we store profile in a sub-field or flattened.
            // Based on typical nosql, let's store: { profile: ..., leads: ..., deals: ... } 
            // or separate collections. 
            // For simplicity and atomicity in this small app, one big doc is fine, 
            // BUT separate collections are better for scaling.
            // Let's stick to separate fields in one doc for now to minimize reads, 
            // or better: separate collections/docs if lists are long. 
            // Given the list size, let's keep it simple: 
            // /users/{userId}/data/profile
            // /users/{userId}/data/leads
            // /users/{userId}/data/deals
            // No, let's do:
            // /vsd_data/profile
            // /vsd_data/leads
            // /vsd_data/deals
        }
    });
};

// Actually, let's make it more robust.
// We will use a main collection 'vsd_app_data' and 3 documents: 'profile', 'leads', 'deals'.

const DATA_COLLECTION = 'vsd_app_data';

export const subscribeToDoc = <T>(docId: string, onUpdate: (data: T) => void, defaultValue: T) => {
    return onSnapshot(doc(db, DATA_COLLECTION, docId), (docSnap) => {
        if (docSnap.exists()) {
            onUpdate(docSnap.data() as T);
        } else {
            // Create defaults if not exists
            setDoc(doc(db, DATA_COLLECTION, docId), defaultValue as any, { merge: true });
            onUpdate(defaultValue);
        }
    });
};

export const saveData = async <T>(docId: string, data: T) => {
    try {
        await setDoc(doc(db, DATA_COLLECTION, docId), data as any);
    } catch (error) {
        console.error("Error writing document: ", error);
    }
};
