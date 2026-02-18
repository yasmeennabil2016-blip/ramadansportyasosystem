// ==================== إعداد Firebase ====================
const firebaseConfig = {
   apiKey: "AIzaSyAAFKSdUPEa7U1zpFxc3ZQjqwj9Pji768Q",
  authDomain: "yasosystem.firebaseapp.com",
  projectId: "yasosystem",
   storageBucket: "yasosystem.firebasestorage.app",
   messagingSenderId: "250096554890",
  appId: "1:250096554890:web:fac52f0d5912db08b7ee73",
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== نظام المزامنة القوي ====================
const FirebaseSync = {
    // حفظ أي تغيير فوراً في Firebase
    async saveNow(collectionName, data) {
        try {
            await db.collection(collectionName).doc('main').set({
                data: data,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ تم حفظ ${collectionName}`);
            return true;
        } catch (error) {
            console.error(`❌ خطأ في حفظ ${collectionName}:`, error);
            return false;
        }
    },
    
    // تحميل أحدث البيانات من Firebase
    async loadNow(collectionName) {
        try {
            const doc = await db.collection(collectionName).doc('main').get();
            if (doc.exists) {
                const data = doc.data().data;
                localStorage.setItem(collectionName, JSON.stringify(data));
                console.log(`✅ تم تحميل ${collectionName}`);
                return data;
            }
            return null;
        } catch (error) {
            console.error(`❌ خطأ في تحميل ${collectionName}:`, error);
            return null;
        }
    },
    
    // مزامنة كل المجموعات
    async syncAll() {
        console.log('🔄 جاري المزامنة الكاملة...');
        
        const collections = [
            'trainers',
            'registrationRequests',
            'questions',
            'clients',
            'surveys',
            'clientAnswers',
            'trainerLogos'
        ];
        
        let success = true;
        
        // أولاً: تحميل أحدث البيانات من Firebase
        for (const collection of collections) {
            const result = await this.loadNow(collection);
            if (result === null) success = false;
        }
        
        // ثانياً: رفع البيانات المحلية إلى Firebase
        for (const collection of collections) {
            const localData = localStorage.getItem(collection);
            if (localData) {
                await this.saveNow(collection, JSON.parse(localData));
            }
        }
        
        console.log(success ? '✅ تمت المزامنة بنجاح' : '⚠️ المزامنة تمت مع بعض الأخطاء');
        return success;
    }
};

// ==================== مراقبة التغييرات ====================
// هذه الدالة تراقب أي تغيير في localStorage وتدفع فوراً إلى Firebase
function watchLocalStorage() {
    // المجموعات التي نريد مراقبتها
    const collections = [
        'trainers',
        'registrationRequests',
        'questions',
        'clients',
        'surveys',
        'clientAnswers',
        'trainerLogos'
    ];
    
    // حفظ القيم القديمة
    const oldValues = {};
    collections.forEach(col => {
        oldValues[col] = localStorage.getItem(col);
    });
    
    // مراقبة التغييرات كل ثانية
    setInterval(() => {
        collections.forEach(async (collection) => {
            const currentValue = localStorage.getItem(collection);
            if (currentValue !== oldValues[collection]) {
                console.log(`🔄 تغيير في ${collection} - جاري الحفظ في Firebase`);
                oldValues[collection] = currentValue;
                
                if (currentValue) {
                    await FirebaseSync.saveNow(collection, JSON.parse(currentValue));
                    
                    // إظهار إشعار للمستخدم
                    showNotification(`تم حفظ ${collection} في السحابة`);
                }
            }
        });
    }, 1000); // فحص كل ثانية
}

// ==================== تحميل البيانات عند فتح الصفحة ====================
async function loadInitialData() {
    showNotification('🔄 جاري تحميل البيانات من السحابة...', 'info');
    
    const collections = [
        'trainers',
        'registrationRequests',
        'questions',
        'clients',
        'surveys',
        'clientAnswers',
        'trainerLogos'
    ];
    
    let hasData = false;
    
    // تحميل كل مجموعة من Firebase
    for (const collection of collections) {
        const firebaseData = await FirebaseSync.loadNow(collection);
        if (firebaseData) {
            hasData = true;
        }
    }
    
    if (hasData) {
        showNotification('✅ تم تحميل البيانات من السحابة', 'success');
        
        // إعادة تحميل الصفحة لتطبيق البيانات الجديدة
        setTimeout(() => {
            if (confirm('تم تحديث البيانات. هل تريد إعادة تحميل الصفحة الآن؟')) {
                location.reload();
            }
        }, 1500);
    } else {
        showNotification('ℹ️ لا توجد بيانات سابقة في السحابة', 'info');
    }
}

// ==================== دوال مساعدة ====================
function showNotification(message, type = 'success') {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 10001;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: 14px;
        animation: slideDown 0.3s ease;
        pointer-events: none;
    `;
    
    // إضافة animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== إنشاء شريط الحالة ====================
function createStatusBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 8px 15px;
        border-radius: 30px;
        z-index: 10000;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        opacity: 0.9;
    `;
    
    bar.innerHTML = `
        <div style="width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
        <span>المزامنة التلقائية نشطة</span>
        <button onclick="FirebaseSync.syncAll()" style="background: #2196F3; color: white; border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; font-size: 12px; margin-right: 10px;">
            مزامنة الآن
        </button>
    `;
    
    // إضافة pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(bar);
    
    // إضافة مسافة للـ body
    document.body.style.paddingBottom = '70px';
}

// ==================== تعديل الدوال الأصلية ====================
// هذا الجزء مهم جداً - نعدل الدوال الأصلية لتنادي Firebase تلقائياً

// حفظ الدوال الأصلية
const originalFunctions = {
    handleRegistration: window.handleRegistration,
    handleAnswerSubmission: window.handleAnswerSubmission,
    handleQuestionSubmission: window.handleQuestionSubmission,
    handleTrainerActivation: window.handleTrainerActivation,
    approveRequest: window.approveRequest,
    rejectRequest: window.rejectRequest
};

// تعديل دالة التسجيل
window.handleRegistration = async function(e) {
    if (e) e.preventDefault();
    
    // تنفيذ الدالة الأصلية أولاً
    if (originalFunctions.handleRegistration) {
        originalFunctions.handleRegistration(e);
    }
    
    // ثم حفظ في Firebase
    setTimeout(async () => {
        await FirebaseSync.saveNow('registrationRequests', 
            JSON.parse(localStorage.getItem('registrationRequests') || '[]'));
        showNotification('✅ تم حفظ طلب التسجيل في السحابة');
    }, 500);
};

// تعديل دالة إضافة إجابة
window.handleAnswerSubmission = async function() {
    // تنفيذ الدالة الأصلية
    if (originalFunctions.handleAnswerSubmission) {
        originalFunctions.handleAnswerSubmission();
    }
    
    // حفظ في Firebase
    setTimeout(async () => {
        await FirebaseSync.saveNow('clientAnswers', 
            JSON.parse(localStorage.getItem('clientAnswers') || '{}'));
        showNotification('✅ تم حفظ الإجابة في السحابة');
    }, 500);
};

// تعديل دالة إضافة سؤال
window.handleQuestionSubmission = async function(e) {
    if (e) e.preventDefault();
    
    if (originalFunctions.handleQuestionSubmission) {
        originalFunctions.handleQuestionSubmission(e);
    }
    
    setTimeout(async () => {
        await FirebaseSync.saveNow('questions', 
            JSON.parse(localStorage.getItem('questions') || '[]'));
        showNotification('✅ تم حفظ السؤال في السحابة');
    }, 500);
};

// تعديل دالة تفعيل مدرب
window.handleTrainerActivation = async function(e) {
    if (e) e.preventDefault();
    
    if (originalFunctions.handleTrainerActivation) {
        originalFunctions.handleTrainerActivation(e);
    }
    
    setTimeout(async () => {
        await FirebaseSync.saveNow('trainers', 
            JSON.parse(localStorage.getItem('trainers') || '[]'));
        showNotification('✅ تم حفظ المدرب في السحابة');
    }, 500);
};

// ==================== بدء التشغيل ====================
window.onload = async function() {
    // إضافة Font Awesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }
    
    // إنشاء شريط الحالة
    createStatusBar();
    
    // تحميل البيانات الأولية
    await loadInitialData();
    
    // بدء مراقبة التغييرات
    watchLocalStorage();
    
    // مزامنة دورية كل 5 دقائق (احتياطي)
    setInterval(async () => {
        console.log('🔄 مزامنة دورية...');
        await FirebaseSync.syncAll();
    }, 5 * 60 * 1000);
    
    console.log('🚀 نظام المزامنة التلقائية شغال');
};