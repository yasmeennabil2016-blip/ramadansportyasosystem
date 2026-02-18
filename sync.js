// ==================== إعداد Firebase (الخاص بك) ====================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ Firebase متصل بنجاح - مشروع:', firebaseConfig.projectId);

// ==================== شريط التحكم ====================
function createSyncBar() {
    // التأكد من وجود Font Awesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }

    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(45deg, #2196F3, #1976D2);
        color: white;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10000;
        font-family: 'Cairo', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        direction: rtl;
    `;
    
    bar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-globe" style="font-size: 20px;"></i>
            <span style="font-weight: bold;">🌍 التخزين العالمي - ${firebaseConfig.projectId}</span>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="syncFromFirebase()" style="background: white; color: #1976D2; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-family: 'Cairo';">
                <i class="fas fa-download"></i> تحميل
            </button>
            <button onclick="syncToFirebase()" style="background: white; color: #1976D2; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-family: 'Cairo';">
                <i class="fas fa-upload"></i> رفع
            </button>
        </div>
        <div id="syncStatus" style="font-size: 14px;">
            <i class="fas fa-circle" style="color: #4CAF50;"></i> متصل
        </div>
    `;
    
    document.body.prepend(bar);
    document.body.style.paddingTop = '70px';
}

// ==================== دوال المزامنة ====================
window.syncToFirebase = async function() {
    const status = document.getElementById('syncStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
    
    try {
        // المجموعات المراد حفظها
        const collections = ['trainers', 'registrationRequests', 'questions', 'clients', 'surveys', 'clientAnswers', 'trainerLogos'];
        
        for (const collection of collections) {
            const data = localStorage.getItem(collection);
            if (data) {
                const parsed = JSON.parse(data);
                
                if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                        if (item.id) {
                            await db.collection(collection).doc(item.id).set(item);
                        } else {
                            const docRef = await db.collection(collection).add(item);
                            item.id = docRef.id;
                        }
                    }
                    localStorage.setItem(collection, JSON.stringify(parsed));
                } else if (typeof parsed === 'object') {
                    for (const [key, value] of Object.entries(parsed)) {
                        await db.collection(collection).doc(key).set(value);
                    }
                }
            }
        }
        
        status.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> تم الرفع';
        setTimeout(() => {
            status.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> متصل';
        }, 2000);
        
        alert('✅ تم رفع البيانات إلى Firebase بنجاح');
    } catch (error) {
        console.error(error);
        status.innerHTML = '<i class="fas fa-circle" style="color: #f44336;"></i> خطأ';
        alert('❌ حدث خطأ في الرفع: ' + error.message);
    }
};

window.syncFromFirebase = async function() {
    const status = document.getElementById('syncStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
    
    try {
        const collections = ['trainers', 'registrationRequests', 'questions', 'clients', 'surveys', 'trainerLogos'];
        
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(collection, JSON.stringify(data));
        }
        
        // تحميل clientAnswers بشكل منفصل
        const answersSnapshot = await db.collection('clientAnswers').get();
        const answers = {};
        answersSnapshot.docs.forEach(doc => {
            answers[doc.id] = doc.data();
        });
        localStorage.setItem('clientAnswers', JSON.stringify(answers));
        
        status.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> تم التحميل';
        setTimeout(() => {
            status.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> متصل';
        }, 2000);
        
        if (confirm('✅ تم تحميل البيانات. هل تريد إعادة تحميل الصفحة؟')) {
            location.reload();
        }
    } catch (error) {
        console.error(error);
        status.innerHTML = '<i class="fas fa-circle" style="color: #f44336;"></i> خطأ';
        alert('❌ حدث خطأ في التحميل: ' + error.message);
    }
};

// بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    createSyncBar();
    console.log('🚀 نظام المزامنة جاهز');

});
// مزامنة تلقائية كل 30 ثانية
setInterval(saveToFirebase, 30000);
