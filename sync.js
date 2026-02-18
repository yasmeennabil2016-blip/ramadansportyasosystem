// ==================== إعداد Firebase ====================
const firebaseConfig = {
  apiKey: "AIzaSyAAFKSdUPEa7U1zpFxc3ZQjqwj9Pji768Q",
  authDomain: "yasosystem.firebaseapp.com",
  projectId: "yasosystem",
  storageBucket: "yasosystem.firebasestorage.app",
  messagingSenderId: "250096554890",
  appId: "1:250096554890:web:fac52f0d5912db08b7ee73"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== إيقاف كل الرسائل ====================
// نخلي console.log فاضي
console.log = function() {};

// نخلي alert يشتغل فقط للأخطاء الحقيقية
const originalAlert = window.alert;
window.alert = function(msg) {
    if (msg.includes('خطأ') || msg.includes('مشكلة')) {
        originalAlert(msg);
    }
};

// ==================== نظام المزامنة الصامت ====================
// تحميل البيانات عند بدء التشغيل
window.onload = async function() {
    try {
        // نجرب نحمل البيانات من Firebase
        const collections = ['trainers', 'registrationRequests', 'questions', 'clients', 'surveys', 'clientAnswers', 'trainerLogos'];
        
        for (let collection of collections) {
            const doc = await db.collection(collection).doc('main').get();
            if (doc.exists) {
                localStorage.setItem(collection, JSON.stringify(doc.data().data));
            }
        }
    } catch (e) {
        // صمت تام
    }
};

// حفظ أي تغيير في localStorage إلى Firebase
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // حفظ في Firebase (بصمت)
    try {
        const data = JSON.parse(value);
        db.collection(key).doc('main').set({
            data: data,
            lastUpdate: new Date().toISOString()
        }).catch(() => {});
    } catch (e) {}
};

// كل دقيقة نجيب آخر التحديثات
setInterval(async () => {
    try {
        const collections = ['trainers', 'registrationRequests', 'questions', 'clients', 'surveys', 'clientAnswers', 'trainerLogos'];
        
        for (let collection of collections) {
            const doc = await db.collection(collection).doc('main').get();
            if (doc.exists) {
                const firebaseData = doc.data().data;
                const localData = localStorage.getItem(collection);
                
                if (JSON.stringify(firebaseData) !== localData) {
                    localStorage.setItem(collection, JSON.stringify(firebaseData));
                }
            }
        }
    } catch (e) {}
}, 60000);