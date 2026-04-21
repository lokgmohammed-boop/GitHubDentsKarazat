// 1. الإعدادات والبيانات
let debts = JSON.parse(localStorage.getItem("debts")) || [];
let currentIndex = null;
let attempts = 0; // عداد المحاولات
const MAX_ATTEMPTS = 3; // الحد الأقصى

const MY_PASSWORD = "1234";

// 2. وظيفة فحص كلمة السر
function checkPassword() {
    const input = document.getElementById("passwordInput").value;
    const loginOverlay = document.getElementById("login-overlay");
    const mainApp = document.getElementById("main-app");
    const errorMsg = document.getElementById("error-msg");

    // التحقق إذا كان المستخدم معاقباً حالياً
    const penaltyTime = localStorage.getItem("penaltyTime");
    if (penaltyTime && Date.now() < penaltyTime) {
        const remainingSeconds = Math.ceil((penaltyTime - Date.now()) / 1000);
        alert(`أنت معاقب! يرجى الانتظار ${remainingSeconds} ثانية قبل المحاولة مرة أخرى.`);
        return;
    }

    if (input === MY_PASSWORD) {
        loginOverlay.style.setProperty("display", "none", "important");
        mainApp.style.setProperty("display", "block", "important");
        sessionStorage.setItem("isLoggedIn", "true");
        attempts = 0; // إعادة تصفير المحاولات عند الدخول الناجح
        displayDebts(); 
    } else {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
            // تنفيذ العقاب: حظر لمدة دقيقتين (120000 مللي ثانية)
            const banUntil = Date.now() + 600000; 
            localStorage.setItem("penaltyTime", banUntil);
            attempts = 0; // تصفير المحاولات للبدء من جديد بعد العقاب
            alert("⚠️ تم استنفاد كافة المحاولات! تم قفل النظام لمدة عشر دقائق كعقاب لك.");
        } else {
            errorMsg.innerText = `⚠️ كلمة سر خاطئة! تبقى لك ${MAX_ATTEMPTS - attempts} محاولات.`;
            errorMsg.style.display = "block";
            const box = document.querySelector(".login-box");
            box.style.animation = "shake 0.3s";
            setTimeout(() => box.style.animation = "", 300);
        }
    }
}

// 3. إدارة البيانات والعرض
function saveData() {
    localStorage.setItem("debts", JSON.stringify(debts));
}

function displayDebts() {
    let search = document.getElementById("search").value.toLowerCase();
    let list = document.getElementById("list");
    let totalRemaining = 0;
    list.innerHTML = "";

    debts.forEach((d, i) => {
        if (d.name.toLowerCase().includes(search)) {
            let remaining = d.total - d.paid;
            totalRemaining += remaining;
            let div = document.createElement("div");
            div.className = "debt";
            div.innerHTML = `
                <div class="debt-info">
                    <b>${d.name}</b><br>
                    <small>الباقي: ${remaining} دينار</small>
                </div>
                <div class="debt-actions">
                    <button onclick="openModal(${i})" style="background:#b8860b; color:white; width:auto;">تعديل</button>
                    <button onclick="deleteDebt(${i})" style="background:#8b0000; color:white; width:auto;">حذف</button>
                </div>`;
            list.appendChild(div);
        }
    });
    document.getElementById("total").innerText = `💵 مجموع الباقي: ${totalRemaining} دينار`;
}

// 4. العمليات (إضافة، تعديل، حذف)
function addDebt() {
    let nameInput = document.getElementById("name");
    let amountInput = document.getElementById("amount");
    let name = nameInput.value.trim();
    let amount = parseFloat(amountInput.value);

    if (!name || isNaN(amount)) return alert("يرجى ملأ البيانات!");
    
    debts.push({ name, total: amount, paid: 0 });
    saveData();
    displayDebts();
    nameInput.value = ""; amountInput.value = "";
}

function handleTransaction(type) {
    let payInput = document.getElementById("payInput");
    let extraInput = document.getElementById("extraDebtInput");
    
    if (type === 'pay') {
        let value = parseFloat(payInput.value);
        if (isNaN(value)) return;
        debts[currentIndex].paid += value;
    } else {
        let value = parseFloat(extraInput.value);
        if (isNaN(value)) return;
        debts[currentIndex].total += value;
    }
    saveData();
    closeModal();
    displayDebts();
}

function openModal(index) {
    currentIndex = index;
    let d = debts[index];
    document.getElementById("modalInfo").innerHTML = `<b>${d.name}</b><br>الكلي: ${d.total} | الواصل: ${d.paid}<br>الباقي: ${d.total - d.paid}`;
    document.getElementById("modal").style.display = "flex";
}

function closeModal() { document.getElementById("modal").style.display = "none"; }

function deleteDebt(index) {
    if(confirm("هل أنت متأكد من الحذف؟")) { 
        debts.splice(index, 1); 
        saveData(); 
        displayDebts(); 
    }
}

// 5. التشغيل عند التحميل (الدالة الوحيدة)
window.onload = function() {
    displayDebts();
    // التحقق من الجلسة باستخدام setProperty لضمان تخطي CSS
    if (sessionStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("login-overlay").style.setProperty("display", "none", "important");
        document.getElementById("main-app").style.setProperty("display", "block", "important");
    }
};

// تشغيل الاوفلاين
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
    .then(() => console.log("Offline mode شغال 🔥"))
    .catch(err => console.log("خطأ:", err));
}
