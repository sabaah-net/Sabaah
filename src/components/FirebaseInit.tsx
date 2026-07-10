'use client';
import { useEffect } from 'react';
import { configureFirebaseApi } from '../lib/firebase';

export default function FirebaseInit() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_FIREBASE_API_URL;
    if (apiUrl) {
      configureFirebaseApi(apiUrl, process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '');
    }
  }, []);
  return null;
}
