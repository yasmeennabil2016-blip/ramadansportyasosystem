
// ==================== نظام المزامنة القوي =======================
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

// ==================== المصدر الرئيسي للبيانات ====================
// هذه هي النقطة الأهم - نجعل Firebase هو المصدر الوحيد
const GlobalData = {
    // تحميل البيانات من Firebase وإجبار localStorage على التحديث
    async refreshFromFirebase() {
        console.log('🔄 جاري تحديث البيانات من Firebase...');
        
        const collections = [
            'trainers',
            'registrationRequests',
            'questions',
            'clients',
            'surveys',
            'clientAnswers',
            'trainerLogos'
        ];
        
        let changed = false;
        
        for (const collection of collections) {
            try {
                const doc = await db.collection(collection).doc('main').get();
                if (doc.exists) {
                    const firebaseData = doc.data().data;
                    const localData = localStorage.getItem(collection);
                    
                    // قارن بين البيانات
                    if (JSON.stringify(firebaseData) !== localData) {
                        console.log(`🔄 تحديث ${collection} من Firebase`);
                        localStorage.setItem(collection, JSON.stringify(firebaseData));
                        changed = true;
                    }
                }
            } catch (error) {
                console.error(`خطأ في تحديث ${collection}:`, error);
            }
        }
        
        if (changed) {
            this.showMessage('✅ تم تحديث البيانات من السحابة', 'success');
            // إعادة تحميل الصفحة بعد ثانيتين
            setTimeout(() => {
                if (confirm('تم تحديث البيانات. هل تريد إعادة تحميل الصفحة الآن؟')) {
                    location.reload();
                }
            }, 2000);
        }
        
        return changed;
    },
    
    // حفظ البيانات في Firebase
    async saveToFirebase(collection, data) {
        try {
            await db.collection(collection).doc('main').set({
                data: data,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: navigator.userAgent
            });
            console.log(`✅ تم حفظ ${collection} في Firebase`);
            this.showMessage(`✅ تم حفظ ${collection} في السحابة`, 'success');
            return true;
        } catch (error) {
            console.error(`خطأ في حفظ ${collection}:`, error);
            this.showMessage(`❌ خطأ في حفظ ${collection}`, 'error');
            return false;
        }
    },
    
    // حفظ كل البيانات الحالية
    async saveAllToFirebase() {
        const collections = [
            'trainers',
            'registrationRequests',
            'questions',
            'clients',
            'surveys',
            'clientAnswers',
            'trainerLogos'
        ];
        
        for (const collection of collections) {
            const data = localStorage.getItem(collection);
            if (data) {
                await this.saveToFirebase(collection, JSON.parse(data));
            }
        }
        
        this.showMessage('✅ تم حفظ كل البيانات في السحابة', 'success');
    },
    
    showMessage(text, type = 'info') {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#ff9800'
        };
        
        const msg = document.createElement('div');
        msg.style.cssText = `
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
        `;
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
};

// ==================== الاستماع للتغييرات في Firebase ====================
// هذه الدالة最重要 - تستمع لأي تغيير في Firebase وتحدث الصفحة فوراً
function listenToFirebaseChanges() {
    const collections = [
        'trainers',
        'registrationRequests',
        'questions',
        'clients',
        'surveys',
        'clientAnswers',
        'trainerLogos'
    ];
    
    collections.forEach(collection => {
        db.collection(collection).doc('main')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const firebaseData = doc.data().data;
                    const localData = localStorage.getItem(collection);
                    
                    // إذا كانت البيانات مختلفة عن المحلي
                    if (JSON.stringify(firebaseData) !== localData) {
                        console.log(`🔄 تغيير في ${collection} من جهاز آخر`);
                        
                        // تحديث localStorage
                        localStorage.setItem(collection, JSON.stringify(firebaseData));
                        
                        // إظهار إشعار
                        GlobalData.showMessage(`📱 تم تحديث ${collection} من جهاز آخر`, 'info');
                        
                        // إذا كانت الصفحة مفتوحة حالياً، نعرض خيار إعادة التحميل
                        if (confirm(`تغيرت بيانات ${collection} من جهاز آخر. هل تريد تحديث الصفحة الآن؟`)) {
                            location.reload();
                        }
                    }
                }
            }, (error) => {
                console.error(`خطأ في الاستماع لـ ${collection}:`, error);
            });
    });
    
    console.log('👂 جاري الاستماع للتغييرات من الأجهزة الأخرى...');
}

// ==================== مراقبة التغييرات المحلية ====================
function watchLocalChanges() {
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
    
    // مراقبة كل ثانيتين
    setInterval(() => {
        collections.forEach(async (collection) => {
            const currentValue = localStorage.getItem(collection);
            if (currentValue !== oldValues[collection]) {
                console.log(`📝 تغيير محلي في ${collection}`);
                oldValues[collection] = currentValue;
                
                if (currentValue) {
                    // حفظ في Firebase
                    await GlobalData.saveToFirebase(collection, JSON.parse(currentValue));
                }
            }
        });
    }, 2000);
}

// ==================== تعديل الدوال الأصلية ====================
// نعدل كل دالة عشان تنادي حفظ في Firebase

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
    
    // تنفيذ الدالة الأصلية
    if (originalFunctions.handleRegistration) {
        originalFunctions.handleRegistration(e);
    }
    
    // حفظ في Firebase بعد ثانية
    setTimeout(async () => {
        const data = localStorage.getItem('registrationRequests');
        if (data) {
            await GlobalData.saveToFirebase('registrationRequests', JSON.parse(data));
        }
    }, 1000);
};

// تعديل دالة إضافة إجابة
window.handleAnswerSubmission = async function() {
    // تنفيذ الدالة الأصلية
    if (originalFunctions.handleAnswerSubmission) {
        originalFunctions.handleAnswerSubmission();
    }
    
    // حفظ في Firebase
    setTimeout(async () => {
        const data = localStorage.getItem('clientAnswers');
        if (data) {
            await GlobalData.saveToFirebase('clientAnswers', JSON.parse(data));
        }
    }, 1000);
};

// تعديل دالة إضافة سؤال
window.handleQuestionSubmission = async function(e) {
    if (e) e.preventDefault();
    
    // تنفيذ الدالة الأصلية
    if (originalFunctions.handleQuestionSubmission) {
        originalFunctions.handleQuestionSubmission(e);
    }
    
    // حفظ في Firebase
    setTimeout(async () => {
        const data = localStorage.getItem('questions');
        if (data) {
            await GlobalData.saveToFirebase('questions', JSON.parse(data));
        }
    }, 1000);
};

// تعديل دالة تفعيل مدرب
window.handleTrainerActivation = async function(e) {
    if (e) e.preventDefault();
    
    // تنفيذ الدالة الأصلية
    if (originalFunctions.handleTrainerActivation) {
        originalFunctions.handleTrainerActivation(e);
    }
    
    // حفظ في Firebase
    setTimeout(async () => {
        const data = localStorage.getItem('trainers');
        if (data) {
            await GlobalData.saveToFirebase('trainers', JSON.parse(data));
        }
    }, 1000);
};

// تعديل دالة قبول طلب
window.approveRequest = async function(index) {
    // تنفيذ الدالة الأصلية
    if (originalFunctions.approveRequest) {
        originalFunctions.approveRequest(index);
    }
    
    // حفظ في Firebase
    setTimeout(async () => {
        const clientsData = localStorage.getItem('clients');
        const requestsData = localStorage.getItem('registrationRequests');
        
        if (clientsData) {
            await GlobalData.saveToFirebase('clients', JSON.parse(clientsData));
        }
        if (requestsData) {
            await GlobalData.saveToFirebase('registrationRequests', JSON.parse(requestsData));
        }
    }, 1000);
};

// ==================== إنشاء واجهة المستخدم ====================
function createUI() {
    // شريط الحالة السفلي
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 12px 20px;
        border-radius: 50px;
        z-index: 10000;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        max-width: 600px;
        margin: 0 auto;
    `;
    
    bar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
            <span>🌍 المزامنة العالمية نشطة</span>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="GlobalData.saveAllToFirebase()" style="background: white; color: #667eea; border: none; padding: 6px 15px; border-radius: 25px; cursor: pointer; font-family: 'Cairo'; font-size: 13px;">
                💾 حفظ في السحابة
            </button>
            <button onclick="GlobalData.refreshFromFirebase()" style="background: white; color: #764ba2; border: none; padding: 6px 15px; border-radius: 25px; cursor: pointer; font-family: 'Cairo'; font-size: 13px;">
                🔄 تحديث من السحابة
            </button>
        </div>
    `;
    
    document.body.appendChild(bar);
    
    // إضافة مسافة للـ body
    document.body.style.paddingBottom = '80px';
    
    // إضافة animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// ==================== بدء التشغيل ====================
window.onload = async function() {
    // إضافة Font Awesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }
    
    // إنشاء واجهة المستخدم
    createUI();
    
    // تحميل أحدث البيانات من Firebase
    await GlobalData.refreshFromFirebase();
    
    // بدء الاستماع للتغييرات من الأجهزة الأخرى
    listenToFirebaseChanges();
    
    // بدء مراقبة التغييرات المحلية
    watchLocalChanges();
    
    console.log('🚀 نظام المزامنة الفورية شغال');
};