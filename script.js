// البيانات المحلية
let currentUser = null;
let currentUserType = null;
let trainers = JSON.parse(localStorage.getItem('trainers')) || [];
let registrationRequests = JSON.parse(localStorage.getItem('registrationRequests')) || [];
let questions = JSON.parse(localStorage.getItem('questions')) || [];
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let surveys = JSON.parse(localStorage.getItem('surveys')) || [];
let clientAnswers = JSON.parse(localStorage.getItem('clientAnswers')) || {};
let trainerLogos = JSON.parse(localStorage.getItem('trainerLogos')) || {};

// كود المدير الافتراضي
const ADMIN_CODE = 'admin2025';

// تهيئة الموقع
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  loadTrainerOptions();
  showScreen('loginScreen');
});

// إعداد مستمعي الأحداث
function initializeEventListeners() {
  // نموذج تسجيل الدخول
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // زر التسجيل
  document.getElementById('registerBtn').addEventListener('click', function() {
    showScreen('registerScreen');
  });
  
  // نموذج التسجيل
  document.getElementById('registerForm').addEventListener('submit', handleRegistration);
  
  // نماذج المدير
  document.getElementById('trainerForm').addEventListener('submit', handleTrainerActivation);
  document.getElementById('questionForm').addEventListener('submit', handleQuestionSubmission);
  document.getElementById('logoForm').addEventListener('submit', handleLogoUpload);
  
  // زر الاستبيان
  document.getElementById('surveyBtn').addEventListener('click', function() {
    showModal('surveyModal');
  });
  
  // نموذج الاستبيان
  document.getElementById('surveyForm').addEventListener('submit', handleSurveySubmission);
  
  // زر إرسال الإجابة
  document.getElementById('submitAnswerBtn').addEventListener('click', handleAnswerSubmission);
}

// عرض الشاشات
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// تسجيل الدخول
function handleLogin(e) {
  e.preventDefault();
  const code = document.getElementById('loginCode').value.trim();
  
  if (code === ADMIN_CODE) {
    currentUser = { name: 'المدير', code: ADMIN_CODE };
    currentUserType = 'admin';
    showScreen('adminScreen');
    loadAdminData();
  } else {
    // البحث في المدربين
    const trainer = trainers.find(t => t.code === code);
    if (trainer) {
      currentUser = trainer;
      currentUserType = 'trainer';
      showScreen('trainerScreen');
      loadTrainerData();
      return;
    }
    
    // البحث في العملاء
    const client = clients.find(c => c.code === code);
    if (client) {
      currentUser = client;
      currentUserType = 'client';
      document.getElementById('clientName').textContent = client.name;
      showScreen('clientScreen');
      loadClientData();
      return;
    }
    
    alert('كود الدخول غير صحيح');
  }
}

// التسجيل الجديد
function handleRegistration(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('regName').value,
    phone: document.getElementById('regPhone').value,
    governorate: document.getElementById('regGovernorate').value,
    trainer: document.getElementById('regTrainer').value,
    source: document.getElementById('regSource').value,
    timestamp: new Date().toISOString()
  };
  
  registrationRequests.push(formData);
  localStorage.setItem('registrationRequests', JSON.stringify(registrationRequests));
  
  alert('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته من قبل الإدارة.');
  showScreen('loginScreen');
  document.getElementById('registerForm').reset();
}

// تحميل خيارات المدربين
function loadTrainerOptions() {
  const trainerSelect = document.getElementById('regTrainer');
  const logoTrainerSelect = document.getElementById('logoTrainer');
  
  trainerSelect.innerHTML = '<option value="">اختر المدرب</option>';
  logoTrainerSelect.innerHTML = '<option value="">اختر المدرب</option>';
  
  trainers.forEach(trainer => {
    const option1 = new Option(trainer.name, trainer.name);
    const option2 = new Option(trainer.name, trainer.code);
    trainerSelect.appendChild(option1);
    logoTrainerSelect.appendChild(option2);
  });
}

// تفعيل المدرب
function handleTrainerActivation(e) {
  e.preventDefault();
  
  const trainerData = {
    name: document.getElementById('trainerName').value,
    phone: document.getElementById('trainerPhone').value,
    amount: document.getElementById('trainerAmount').value,
    code: document.getElementById('trainerCode').value,
    allowEdit: document.getElementById('allowEdit').checked,
    timestamp: new Date().toISOString()
  };
  
  trainers.push(trainerData);
  localStorage.setItem('trainers', JSON.stringify(trainers));
  
  loadTrainerOptions();
  loadTrainersTable();
  document.getElementById('trainerForm').reset();
  
  alert('تم تفعيل المدرب بنجاح!');
}

// تحميل جدول المدربين
function loadTrainersTable() {
  const tbody = document.querySelector('#trainersTable tbody');
  tbody.innerHTML = '';
  
  trainers.forEach((trainer, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${trainer.name}</td>
      <td>${trainer.phone}</td>
      <td>${trainer.amount}</td>
      <td>${trainer.code}</td>
      <td>${trainer.allowEdit ? 'مسموح' : 'غير مسموح'}</td>
      <td>
        <button class="action-btn copy-btn" onclick="copyCode('${trainer.code}')">
          <i class="fas fa-copy"></i> نسخ
        </button>
      </td>
    `;
  });
}

// نسخ الكود
function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert('تم نسخ الكود بنجاح!');
  });
}

// تحميل طلبات التسجيل
function loadRegistrationRequests() {
  const tbody = document.querySelector('#requestsTable tbody');
  tbody.innerHTML = '';
  
  registrationRequests.forEach((request, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${request.name}</td>
      <td>${request.phone}</td>
      <td>${request.governorate}</td>
      <td>${request.trainer}</td>
      <td>${request.source}</td>
      <td>
        <button class="action-btn approve-btn" onclick="approveRequest(${index})">
          <i class="fas fa-check"></i> قبول
        </button>
        <button class="action-btn reject-btn" onclick="rejectRequest(${index})">
          <i class="fas fa-times"></i> رفض
        </button>
      </td>
    `;
  });
}

// قبول طلب التسجيل
function approveRequest(index) {
  const request = registrationRequests[index];
  const clientCode = generateClientCode();
  
  const client = {
    ...request,
    code: clientCode,
    approved: true,
    approvedAt: new Date().toISOString()
  };
  
  clients.push(client);
  localStorage.setItem('clients', JSON.stringify(clients));
  
  registrationRequests.splice(index, 1);
  localStorage.setItem('registrationRequests', JSON.stringify(registrationRequests));
  
  loadRegistrationRequests();
  alert(`تم قبول الطلب! كود العميل: ${clientCode}`);
}

// رفض طلب التسجيل
function rejectRequest(index) {
  registrationRequests.splice(index, 1);
  localStorage.setItem('registrationRequests', JSON.stringify(registrationRequests));
  loadRegistrationRequests();
  alert('تم رفض الطلب');
}

// توليد كود العميل
function generateClientCode() {
  return 'CLIENT_' + Date.now().toString(36).toUpperCase();
}

// إضافة سؤال جديد
function handleQuestionSubmission(e) {
  e.preventDefault();
  
  const questionData = {
    day: parseInt(document.getElementById('questionDay').value),
    openDate: document.getElementById('questionOpenDate').value,
    closeDate: document.getElementById('questionCloseDate').value,
    text: document.getElementById('questionText').value,
    answers: [
      document.getElementById('answer1').value,
      document.getElementById('answer2').value,
      document.getElementById('answer3').value || null,
      document.getElementById('answer4').value || null
    ].filter(answer => answer !== null && answer !== ''),
    correctAnswer: parseInt(document.querySelector('input[name="correctAnswer"]:checked').value) - 1,
    image: null, // سيتم إضافة دعم الصور لاحقاً
    timestamp: new Date().toISOString()
  };
  
  // التحقق من عدم وجود سؤال لنفس اليوم
  const existingQuestion = questions.find(q => q.day === questionData.day);
  if (existingQuestion) {
    if (confirm('يوجد سؤال لهذا اليوم بالفعل. هل تريد استبداله؟')) {
      const index = questions.findIndex(q => q.day === questionData.day);
      questions[index] = questionData;
    } else {
      return;
    }
  } else {
    questions.push(questionData);
  }
  
  localStorage.setItem('questions', JSON.stringify(questions));
  loadQuestionsList();
  document.getElementById('questionForm').reset();
  
  alert('تم حفظ السؤال بنجاح!');
}

// تحميل قائمة الأسئلة
function loadQuestionsList() {
  const container = document.getElementById('questionsList');
  container.innerHTML = '';
  
  questions.sort((a, b) => a.day - b.day).forEach(question => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    questionDiv.innerHTML = `
      <div class="question-header">
        <span class="question-day">اليوم ${question.day}</span>
        <small>من ${new Date(question.openDate).toLocaleString('ar-EG')} إلى ${new Date(question.closeDate).toLocaleString('ar-EG')}</small>
      </div>
      <div class="question-text">${question.text}</div>
      <div class="question-answers">
        ${question.answers.map((answer, index) => `
          <div class="answer-option ${index === question.correctAnswer ? 'correct' : ''}">
            ${answer} ${index === question.correctAnswer ? '✓' : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(questionDiv);
  });
}

// رفع الشعار
function handleLogoUpload(e) {
  e.preventDefault();
  
  const trainerCode = document.getElementById('logoTrainer').value;
  const fileInput = document.getElementById('logoFile');
  
  if (fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      trainerLogos[trainerCode] = e.target.result;
      localStorage.setItem('trainerLogos', JSON.stringify(trainerLogos));
      loadLogosGallery();
      document.getElementById('logoForm').reset();
      alert('تم رفع الشعار بنجاح!');
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

// تحميل معرض الشعارات
function loadLogosGallery() {
  const gallery = document.getElementById('logosGallery');
  gallery.innerHTML = '';
  
  Object.entries(trainerLogos).forEach(([trainerCode, logoData]) => {
    const trainer = trainers.find(t => t.code === trainerCode);
    if (trainer) {
      const logoDiv = document.createElement('div');
      logoDiv.className = 'logo-item';
      logoDiv.innerHTML = `
        <div>
          <img src="${logoData}" alt="${trainer.name}" class="logo-preview">
          <span>${trainer.name}</span>
        </div>
        <button class="action-btn reject-btn" onclick="deleteLogo('${trainerCode}')">
          <i class="fas fa-trash"></i> حذف
        </button>
      `;
      gallery.appendChild(logoDiv);
    }
  });
}

// حذف الشعار
function deleteLogo(trainerCode) {
  if (confirm('هل أنت متأكد من حذف هذا الشعار؟')) {
    delete trainerLogos[trainerCode];
    localStorage.setItem('trainerLogos', JSON.stringify(trainerLogos));
    loadLogosGallery();
  }
}

// تحميل بيانات المدير
function loadAdminData() {
  loadTrainersTable();
  loadRegistrationRequests();
  loadQuestionsList();
  loadLogosGallery();
}

// تحميل بيانات المدرب
function loadTrainerData() {
  // عرض شعار المدرب إن وجد
  const trainerLogo = document.getElementById('trainerLogo');
  if (trainerLogos[currentUser.code]) {
    trainerLogo.innerHTML = `<img src="${trainerLogos[currentUser.code]}" alt="${currentUser.name}">`;
  }
  
  loadTrainerQuestions();
  loadTrainerReports();
}

// تحميل أسئلة المدرب
function loadTrainerQuestions() {
  const container = document.getElementById('trainerQuestions');
  container.innerHTML = '';
  
  questions.sort((a, b) => a.day - b.day).forEach(question => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    const now = new Date();
    const openDate = new Date(question.openDate);
    const closeDate = new Date(question.closeDate);
    const isActive = now >= openDate && now <= closeDate;
    const isPast = now > closeDate;
    
    questionDiv.innerHTML = `
      <div class="question-header">
        <span class="question-day">اليوم ${question.day}</span>
        <span class="question-status ${isActive ? 'active' : isPast ? 'past' : 'future'}">
          ${isActive ? 'نشط' : isPast ? 'منتهي' : 'قادم'}
        </span>
      </div>
      <div class="question-text">${question.text}</div>
      <div class="question-answers">
        ${question.answers.map((answer, index) => `
          <div class="answer-option ${index === question.correctAnswer ? 'correct' : ''}">
            ${answer} ${index === question.correctAnswer ? '✓' : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(questionDiv);
  });
}

// تحميل تقارير المدرب
function loadTrainerReports() {
  const tbody = document.querySelector('#reportsTable tbody');
  tbody.innerHTML = '';
  
  const trainerClients = clients.filter(client => client.trainer === currentUser.name);
  
  trainerClients.forEach((client, index) => {
    const clientStats = calculateClientStats(client.code);
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${client.name}</td>
      <td>${client.governorate}</td>
      <td>${client.phone}</td>
      <td>${clientStats.correct}</td>
      <td>${clientStats.wrong}</td>
      <td>${clientStats.percentage}%</td>
    `;
  });
}

// حساب إحصائيات العميل
function calculateClientStats(clientCode) {
  const answers = clientAnswers[clientCode] || {};
  let correct = 0;
  let wrong = 0;
  
  Object.values(answers).forEach(answer => {
    if (answer.isCorrect) {
      correct++;
    } else {
      wrong++;
    }
  });
  
  const total = correct + wrong;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return { correct, wrong, percentage };
}

// تحميل بيانات العميل
function loadClientData() {
  loadClientChallenges();
}

// تحميل تحديات العميل
function loadClientChallenges() {
  const grid = document.getElementById('challengesGrid');
  grid.innerHTML = '';
  
  for (let day = 1; day <= 30; day++) {
    const question = questions.find(q => q.day === day);
    const challengeBox = document.createElement('div');
    challengeBox.className = 'challenge-box';
    
    const now = new Date();
    let isLocked = true;
    
    if (question) {
      const openDate = new Date(question.openDate);
      const closeDate = new Date(question.closeDate);
      isLocked = now < openDate || now > closeDate;
    }
    
    if (isLocked) {
      challengeBox.classList.add('locked');
    }
    
    challengeBox.innerHTML = `
      <div class="challenge-number">${day}</div>
      ${isLocked ? '<i class="fas fa-lock lock-icon"></i>' : ''}
    `;
    
    if (!isLocked && question) {
      challengeBox.addEventListener('click', () => openQuestion(question));
    }
    
    grid.appendChild(challengeBox);
  }
}

// فتح السؤال
function openQuestion(question) {
  document.getElementById('modalQuestionTitle').textContent = `سؤال اليوم ${question.day}`;
  document.getElementById('modalQuestionText').textContent = question.text;
  
  const answersContainer = document.getElementById('modalAnswers');
  answersContainer.innerHTML = '';
  
  question.answers.forEach((answer, index) => {
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-option-modal';
    answerDiv.innerHTML = `
      <input type="radio" name="questionAnswer" value="${index}" id="answer_${index}">
      <label for="answer_${index}">${answer}</label>
    `;
    
    answerDiv.addEventListener('click', () => {
      document.querySelectorAll('.answer-option-modal').forEach(opt => opt.classList.remove('selected'));
      answerDiv.classList.add('selected');
      document.getElementById(`answer_${index}`).checked = true;
    });
    
    answersContainer.appendChild(answerDiv);
  });
  
  // حفظ السؤال الحالي
  window.currentQuestion = question;
  showModal('questionModal');
}

// إرسال الإجابة
function handleAnswerSubmission() {
  const selectedAnswer = document.querySelector('input[name="questionAnswer"]:checked');
  
  if (!selectedAnswer) {
    alert('يرجى اختيار إجابة');
    return;
  }
  
  const answerIndex = parseInt(selectedAnswer.value);
  const isCorrect = answerIndex === window.currentQuestion.correctAnswer;
  
  // حفظ الإجابة
  if (!clientAnswers[currentUser.code]) {
    clientAnswers[currentUser.code] = {};
  }
  
  clientAnswers[currentUser.code][window.currentQuestion.day] = {
    answer: answerIndex,
    isCorrect: isCorrect,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('clientAnswers', JSON.stringify(clientAnswers));
  
  // عرض النتيجة
  alert(isCorrect ? 'إجابة صحيحة! أحسنت' : 'إجابة خاطئة، حاول مرة أخرى غداً');
  
  closeModal('questionModal');
  loadClientChallenges();
}

// إرسال الاستبيان
function handleSurveySubmission(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const surveyData = {
    clientCode: currentUser.code,
    clientName: currentUser.name,
    experience: formData.get('experience'),
    difficulty: formData.get('difficulty'),
    designFeedback: formData.get('design_feedback'),
    recommend: formData.get('recommend'),
    timestamp: new Date().toISOString()
  };
  
  surveys.push(surveyData);
  localStorage.setItem('surveys', JSON.stringify(surveys));
  
  alert('تم إرسال الاستبيان بنجاح! شكراً لك');
  closeModal('surveyModal');
  e.target.reset();
}

// عرض تبويبات المدير
function showAdminTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

// عرض تبويبات المدرب
function showTrainerTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

// عرض النوافذ المنبثقة
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

// إغلاق النوافذ المنبثقة
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// تسجيل الخروج
function logout() {
  currentUser = null;
  currentUserType = null;
  showScreen('loginScreen');
  document.getElementById('loginForm').reset();
}

// تصدير التقرير
function exportReport() {
  const trainerClients = clients.filter(client => client.trainer === currentUser.name);
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "الرقم,اسم العميل,المحافظة,رقم الهاتف,الإجابات الصحيحة,الإجابات الخاطئة,النسبة المئوية\n";
  
  trainerClients.forEach((client, index) => {
    const stats = calculateClientStats(client.code);
    csvContent += `${index + 1},${client.name},${client.governorate},${client.phone},${stats.correct},${stats.wrong},${stats.percentage}%\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `تقرير_${currentUser.name}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('تم تصدير التقرير بنجاح!');
}

// إغلاق النوافذ المنبثقة عند النقر خارجها
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// منع إغلاق النافذة عند النقر على المحتوى
document.querySelectorAll('.modal-content').forEach(content => {
  content.addEventListener('click', function(e) {
    e.stopPropagation();
  });
});

// حفظ البيانات تلقائياً كل 30 ثانية
setInterval(() => {
  localStorage.setItem('trainers', JSON.stringify(trainers));
  localStorage.setItem('registrationRequests', JSON.stringify(registrationRequests));
  localStorage.setItem('questions', JSON.stringify(questions));
  localStorage.setItem('clients', JSON.stringify(clients));
  localStorage.setItem('surveys', JSON.stringify(surveys));
  localStorage.setItem('clientAnswers', JSON.stringify(clientAnswers));
  localStorage.setItem('trainerLogos', JSON.stringify(trainerLogos));
}, 30000);

// إضافة بيانات تجريبية للاختبار (يمكن حذفها في الإنتاج)
if (trainers.length === 0) {
  trainers.push({
    name: 'أحمد محمد',
    phone: '01234567890',
    amount: '500',
    code: 'TRAINER001',
    allowEdit: true,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('trainers', JSON.stringify(trainers));
}

if (questions.length === 0) {
  const sampleQuestion = {
    day: 1,
    openDate: new Date().toISOString(),
    closeDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    text: 'ما هو أول شهر في السنة الهجرية؟',
    answers: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني'],
    correctAnswer: 0,
    image: null,
    timestamp: new Date().toISOString()
  };
  questions.push(sampleQuestion);
  localStorage.setItem('questions', JSON.stringify(questions));
}
