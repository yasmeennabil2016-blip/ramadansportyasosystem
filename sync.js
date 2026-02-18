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

// ==================== نظام المزامنة البسيط ====================
// كل دقيقة نحمل البيانات من Firebase
setInterval(() => {
    const collections = ['trainers', 'registrationRequests', 'questions', 'clients'];
    
    collections.forEach(name => {
        db.collection(name).doc('main').get()
            .then(doc => {
                if (doc.exists) {
                    localStorage.setItem(name, JSON.stringify(doc.data().data));
                }
            })
            .catch(() => {});
    });
}, 60000);

// كلما يتغير localStorage، نحفظ في Firebase
['trainers', 'registrationRequests', 'questions', 'clients'].forEach(name => {
    const original = localStorage.getItem(name);
    let lastValue = original;
    
    setInterval(() => {
        const current = localStorage.getItem(name);
        if (current !== lastValue && current) {
            lastValue = current;
            try {
                db.collection(name).doc('main').set({
                    data: JSON.parse(current),
                    time: new Date().toISOString()
                }).catch(() => {});
            } catch (e) {}
        }
    }, 5000);
});

