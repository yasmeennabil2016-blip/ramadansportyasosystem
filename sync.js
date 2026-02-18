// ==================== إعداد Firebase ====================
const firebaseConfig = {
  apiKey: "AIzaSyAAFKSdUPEa7U1zpFxc3ZQjqwj9Pji768Q",
  authDomain: "yasosystem.firebaseapp.com",
  databaseURL: "https://yasosystem-default-rtdb.firebaseio.com",
  projectId: "yasosystem",
  storageBucket: "yasosystem.firebasestorage.app",
  messagingSenderId: "250096554890",
  appId: "1:250096554890:web:fac52f0d5912db08b7ee73",
  measurementId: "G-6EH9VH5CKV"
};


// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("🔥 Firebase connected (silent mode)");

// ==================== مزامنة بسيطة جداً بدون رسائل ====================
setInterval(async () => {
    const collections = ['trainers', 'registrationRequests', 'questions', 'clients'];
    for (let col of collections) {
        try {
            let doc = await db.collection(col).doc('main').get();
            if (doc.exists) {
                localStorage.setItem(col, JSON.stringify(doc.data().data));
            }
        } catch (e) {}
    }
}, 30000);

// حفظ التغييرات
window.onload = function() {
    // مش هنعمل حاجة
};