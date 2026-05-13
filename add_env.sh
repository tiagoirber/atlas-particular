#!/bin/bash
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production < <(echo "atlas-particular")
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production < <(echo "AIzaSyALm1hc4e61BPKo2jRtAEt1e8VwDsr0XS4")
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production < <(echo "atlas-particular.firebaseapp.com")
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production < <(echo "atlas-particular.firebasestorage.app")
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production < <(echo "985023410918")
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production < <(echo "1:985023410918:web:133aa1ac53facf24f38127")
