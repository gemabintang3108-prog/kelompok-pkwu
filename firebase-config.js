// ============================================================
// PENTAVA — Firebase Configuration
// Inisialisasi Firebase untuk ulasan & upload tugas
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCpT4bWPGwJJPUN_P0limoBjNAqU-Awu48",
  authDomain: "prensesi-sma12.firebaseapp.com",
  projectId: "prensesi-sma12",
  storageBucket: "prensesi-sma12.appspot.com",
  messagingSenderId: "553623533572",
  appId: "1:553623533572:web:ff5a4bb7a9eea258095d51"
};

// Initialize Firebase (compat SDK for CDN usage)
firebase.initializeApp(firebaseConfig);

// Export references for other scripts
window.db = firebase.firestore();
window.storage = firebase.storage();
