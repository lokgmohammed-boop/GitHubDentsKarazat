// 1. الإعدادات والبيانات
let debts = JSON.parse(localStorage.getItem("debts")) || [];
let currentIndex = null;
let attempts = 0;
const MAX_ATTEMPTS = 3;
const MY_PASSWORD = "201519952024";

// 2. وظيفة فحص كلمة السر
function checkPassword() {
    const inputEl = document.getElementById("passwordInput");
    const input = inputEl.value.trim();
    const loginOverlay = document.getElementById("login-overlay");
    const mainApp = document.getElementById("main-app");
    const errorMsg = document.getElementById("error-msg");

    // التحقق إذا كان المستخدم معاقباً حالياً
    const penaltyTime = parseInt(localStorage.getItem("penaltyTime"), 10);
    if (!isNaN(penaltyTime) && Date.now() < penaltyTime) {
        const remainingSeconds = Math.ceil((penaltyTime - Date.now()) / 1000);
        alert(`أنت معاقب! يرجى الانتظار ${remainingSeconds} ثانية قبل المحاولة مرة أخرى.`);
        return;
    }

    if (input === MY_PASSWORD) {
        loginOverlay.style.setProperty("display", "none", "important");
        mainApp.style.setProperty("display", "block", "important");

        attempts = 0;
        errorMsg.style.display = "none";
        inputEl.value = "";

        displayDebts();
    } else {
        attempts++;

        if (attempts >= MAX_ATTEMPTS) {
            const banUntil = Date.now() + 600000; // 10 دقائق
            localStorage.setItem("penaltyTime", String(banUntil));
            attempts = 0;
            alert("⚠️ تم استنفاد كافة المحاولات! تم قفل النظام لمدة عشر دقائق كعقاب لك.");
        } else {
            errorMsg.innerText = `⚠️ كلمة سر خاطئة! تبقى لك ${MAX_ATTEMPTS - attempts} محاولات.`;
            errorMsg.style.display = "block";

            const box = document.querySelector(".login-box");
            box.style.animation = "shake 0.3s";
            setTimeout(() => {
                box.style.animation = "";
            }, 300);
        }
    }
}

// 3. إدارة البيانات والعرض
function saveData() {
    localStorage.setItem("debts", JSON.stringify(debts));
}

function displayDebts() {
    const searchInput = document.getElementById("search");
    const list = document.getElementById("list");
    const totalRemainingEl = document.getElementById("total");

    const search = (searchInput?.value || "").toLowerCase();
    let totalRemaining = 0;

    list.innerHTML = "";

    debts.forEach((d, i) => {
        const debtName = (d.name || "").toLowerCase();
        if (debtName.includes(search)) {
            const remaining = (Number(d.total) || 0) - (Number(d.paid) || 0);
            totalRemaining += remaining;

            const div = document.createElement("div");
            div.className = "debt";
            div.innerHTML = `
                <div class="debt-info">
                    <b>${d.name}</b><br>
                    <small>الباقي: ${remaining} دينار</small>
                </div>
                <div class="debt-actions">
                    <button onclick="openModal(${i})" style="background:#b8860b; color:white; width:auto;">تعديل</button>
                    <button onclick="deleteDebt(${i})" style="background:#8b0000; color:white; width:auto;">حذف</button>
                </div>
            `;
            list.appendChild(div);
        }
    });

    totalRemainingEl.innerText = `💵 مجموع الباقي: ${totalRemaining} دينار`;
}

// 4. العمليات (إضافة، تعديل، حذف)
function addDebt() {
    const nameInput = document.getElementById("name");
    const amountInput = document.getElementById("amount");

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!name || isNaN(amount)) {
        alert("يرجى ملأ البيانات!");
        return;
    }

    debts.push({ name, total: amount, paid: 0 });
    saveData();
    displayDebts();

    nameInput.value = "";
    amountInput.value = "";
}

function handleTransaction(type) {
    const payInput = document.getElementById("payInput");
    const extraInput = document.getElementById("extraDebtInput");

    if (currentIndex === null || debts[currentIndex] == null) return;

    if (type === "pay") {
        const value = parseFloat(payInput.value);
        if (isNaN(value)) return alert("أدخل مبلغ صحيح");
        debts[currentIndex].paid += value;
        payInput.value = "";
    } else {
        const value = parseFloat(extraInput.value);
        if (isNaN(value)) return alert("أدخل مبلغ صحيح");
        debts[currentIndex].total += value;
        extraInput.value = "";
    }

    saveData();
    closeModal();
    displayDebts();
}

function openModal(index) {
    currentIndex = index;
    const d = debts[index];

    document.getElementById("modalInfo").innerHTML = `
        <b>${d.name}</b><br>
        الكلي: ${d.total} | الواصل: ${d.paid}<br>
        الباقي: ${d.total - d.paid}
    `;

    document.getElementById("modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    currentIndex = null;
}

function deleteDebt(index) {
    if (confirm("هل أنت متأكد من الحذف؟")) {
        debts.splice(index, 1);
        saveData();
        displayDebts();
    }
}

// 5. التشغيل عند التحميل
window.onload = function () {
    // نخلي الموقع يطلب كلمة السر كل مرة
    document.getElementById("login-overlay").style.setProperty("display", "flex", "important");
    document.getElementById("main-app").style.setProperty("display", "none", "important");

    displayDebts();

    // إذا كان المستخدم معاقباً، نعرض تنبيه فقط
    const penaltyTime = parseInt(localStorage.getItem("penaltyTime"), 10);
    if (!isNaN(penaltyTime) && Date.now() < penaltyTime) {
        const remainingSeconds = Math.ceil((penaltyTime - Date.now()) / 1000);
        document.getElementById("error-msg").innerText =
            `⚠️ أنت معاقب حالياً! بقي ${remainingSeconds} ثانية.`;
        document.getElementById("error-msg").style.display = "block";
    } else {
        localStorage.removeItem("penaltyTime");
    }
};

// تشغيل الأوفلاين
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then(() => console.log("Offline mode شغال 🔥"))
        .catch(err => console.log("خطأ:", err));
}