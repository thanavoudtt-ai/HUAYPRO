const BACKEND_API_URL = "https://script.google.com/macros/s/AKfycbwry_rMPLXIG5_p0u12_piZrCa44LiRO4qTbCG-oJYukzlA03Vyj8GVbMRgVRIjTEJ0dQ/exec";

let currentUser = {};
let currentBillItems = [];
let currentHuayType = 'ลาว';
let currentHuayPosition = 'บน';
let currentPaymentMethod = 'เงินสด';
let lastFocusedInput = null;
let winnersGlobalDataCache = [];

const tamraHuay = {
    "01": "ປານ້ອຍ", "41": "ປານ້ອຍ", "81": "ປານ້ອຍ", "02": "ຫອย", "42": "ຫອย", "82": "ຫອย",
    "03": "ຫ່ານ", "43": "ຫ່ານ", "83": "ຫ່ານ", "04": "ນົກຍຸງ", "44": "ນົກຍຸງ", "84": "ນົກຍຸງ",
    "05": "ສິງ", "45": "ສິງ", "85": "ສິງ", "06": "ເສືອ", "46": "ເສືອ", "86": "ເສືອ",
    "07": "ໝູ", "47": "ໝູ", "87": "ໝູ", "08": "ກະຕ່າຍ", "48": "ກະຕ່າຍ", "88": "ກະຕ່າຍ",
    "09": "ควาย", "49": "ควาย", "89": "ควาย", "10": "ນາກນ້ຳ", "50": "ນາກນ້ຳ", "90": "ນາກນ້ຳ",
    "11": "ໝາ", "51": "ໝາ", "91": "ໝາ", "12": "ມ້າ", "52": "ມ້າ", "92": "ມ້າ",
    "13": "ຊ້າງ", "53": "ຊ້າງ", "93": "ຊ້າງ", "14": "ແມວບ້ານ", "54": "ແມວບ້ານ", "94": "ແມວບ້ານ",
    "15": "ໜູ", "55": "ໜູ", "95": "ໜູ", "16": "ເຜິງ", "56": "ເຜິງ", "96": "ເຜິງ",
    "17": "ນົກຍາງ", "57": "ນົກຍາງ", "98": "ນົກຍາງ", "18": "ແມວປ่า", "58": "ແມວປ່າ", "98": "ແມວປ່າ",
    "19": "ແມງກະເບື້ອ", "59": "ແມງກະເບື້ອ", "99": "ແມງກະເບື້ອ", "00": "ขี้เข็บ", "20": "ขี้เข็บ", "60": "ขี้เข็บ",
    "21": "ນົກແອ່ນ", "61": "ນົກແອ່ນ", "22": "ນົກກາງແກ", "62": "ນົກກາງແກ", "23": "ລິງ", "63": "ລິງ",
    "24": "ກົບ", "64": "ກົບ", "25": "ແຫຼວ", "65": "ແຫຼວ", "26": "ນາກບິນ", "66": "ນາກບິນ",
    "27": "ເຕົ່າ", "67": "ເຕົ່າ", "28": "ໄກ່", "68": "ໄກ່", "29": "ອ່ຽນ", "69": "ອ່ຽນ",
    "30": "ປ່າໃຫຍ່", "70": "ປ່າໃຫຍ່", "31": "ກຸ້ງ", "71": "ກຸ້ງ", "32": "ງູ", "72": "ງູ",
    "33": "ແມງມຸມ", "73": "ແມງມຸມ", "34": "ກວາງ", "74": "ກວาง", "35": "ແບ້", "75": "ແບ້",
    "36": "ເຫງັນ", "76": "ເຫงັນ", "37": "ຫຼິ່ນ", "77": "ຫຼິ່ນ", "38": "ເໝັ່ນ", "78": "ເໝັ່ນ",
    "39": "ກະປູ", "79": "ກະປູ", "40": "ນົກອິນຊີ", "80": "ນົກອິນຊີ"
};

window.addEventListener('DOMContentLoaded', function() {
    const numInput = document.getElementById('huayNum');
    if (numInput) {
        numInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 3) this.value = this.value.slice(0, 3);
            checkLengthAndToggleFields(this.value);
        });
    }
    const inputs = ['huayAmt', 'huayAmtTop', 'huayAmtBot', 'huayAmtTop2', 'huayAmtBot2'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('focus', function() { lastFocusedInput = this; });
    });

    let today = new Date();
    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('winnerTargetDateInput');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;

    loadUserDropdown();
    checkSavedLoginSession();
});

function checkDailyWinners() {
    const winNum = document.getElementById('winNumberInput').value.trim();
    const rawDateValue = document.getElementById('winnerTargetDateInput').value; 
    if (!rawDateValue) { alert("กรุณาเลือกวันที่ต้องการตรวจสอบก่อนค่ะ"); return; }
    if (!winNum) { alert("กรุณากรอกเลขผลหวยก่อนตรวจสอบรางวัลค่ะ"); return; }
    
    const dateParts = rawDateValue.split('-');
    const formattedFilterDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    const btn = document.getElementById('btnCheckWin');
    const resultsArea = document.getElementById('winnerResultsArea');
    
    btn.disabled = true; btn.innerText = "⏳ กำลังเช็ค...";
    resultsArea.innerHTML = `<p style="text-align: center; font-size: 14px; color: #cbd5e1; padding: 10px;">⏳ กำลังสแกนบิลชีตของวันที่ ${formattedFilterDate}...</p>`;
    
    winnersGlobalDataCache = [];

    fetch(BACKEND_API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "checkWinners", winningNum: winNum, targetDate: formattedFilterDate })
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false; btn.innerText = "🔍 ค้นหา";
        if (data && data.success) {
            if (!data.winners || data.winners.length === 0) {
                resultsArea.innerHTML = `<p style="text-align: center; font-size: 14px; color: var(--text-muted); padding: 10px;">❌ วันที่เลือกไม่มีลูกค้าคนไหนถูกรางวัลค่ะ</p>`;
            } else {
                winnersGlobalDataCache = data.winners;
                let html = '';
                winnersGlobalDataCache.forEach((winner, idx) => {
                    html += `<div class="winner-row-box">
                        <span style="font-size:16px; font-weight:700; color:#00df89;">🎉 ยอดถูกหวย: ${winner.customer}</span>
                        <button class="glass-modal-btn success" onclick="triggerWinnerSlipModal(${idx})" style="padding: 6px 14px; font-size: 13px; border-radius: 10px;">📋 ดูบิลภาพสลิป</button>
                    </div>`;
                });
                resultsArea.innerHTML = html;
            }
        } else { resultsArea.innerHTML = `<p style="text-align: center; font-size: 14px; color: var(--ios-pink); padding: 10px;">เกิดข้อผิดพลาดจากฐานข้อมูล</p>`; }
    }).catch(err => {
        btn.disabled = false; btn.innerText = "🔍 ค้นหา";
        resultsArea.innerHTML = `<p style="text-align: center; font-size: 14px; color: var(--ios-pink); padding: 10px;">เชื่อมต่อล้มเหลว</p>`;
    });
}

function buildTripleColumnsLayout(itemsArray) {
    const LIMIT_PER_COLUMN = 15; 
    let col1Html = ""; let col2Html = ""; let col3Html = "";

    itemsArray.forEach((itemText, index) => {
        let isWon = itemText.includes("ถูกหวย!!");
        let cleanedText = itemText.replace(/🎉.*/g, "").trim();
        let extraClass = isWon ? "won-strike" : "";
        let itemBlock = `<div class="slip-item-row-super-nano ${extraClass}">${cleanedText}</div>`;
        
        if (index < LIMIT_PER_COLUMN) { col1Html += itemBlock; } 
        else if (index < (LIMIT_PER_COLUMN * 2)) { col2Html += itemBlock; } 
        else { col3Html += itemBlock; }
    });

    return `
        <div class="slip-column-block-nano">${col1Html}</div>
        <div class="slip-column-block-nano">${col2Html}</div>
        <div class="slip-column-block-nano">${col3Html}</div>
    `;
}

// ฟังก์ชันแปลง HTML สลิปขาวให้กลายเป็นภาพจริง เพื่อให้ iPhone กดเซฟค้างลงคลังรูปภาพได้ชัวร์ 100%
function convertSlipToRealImageElement() {
    const captureArea = document.getElementById('digitalSlipCaptureArea');
    
    // รีเซ็ตการซ่อนรูปภาพเก่าออกก่อน (ถ้ามี)
    const oldImg = document.getElementById('realSlipImgView');
    if (oldImg) oldImg.remove();
    captureArea.style.display = 'block';

    setTimeout(() => {
        html2canvas(captureArea, { backgroundColor: "#ffffff", scale: 2, logging: false, useCORS: true }).then(canvas => {
            const dataUrl = canvas.toDataURL("image/png");
            
            // สร้างแท็กภาพ <img> จริงๆ มาวางซ้อนทับพื้นที่บิลเพื่อเปิดช่องทางกดค้างเซฟบน iPhone
            const img = document.createElement('img');
            img.id = 'realSlipImgView';
            img.src = dataUrl;
            img.style.width = '100%';
            img.style.display = 'block';
            img.style.borderRadius = '16px';
            img.style.webkitUserSelect = 'auto'; 
            img.style.userSelect = 'auto';

            // ซ่อนตัวโครง HTML ดั้งเดิม แล้วแสดงผลรูปภาพจริงนี้แทน
            captureArea.style.display = 'none';
            captureArea.parentElement.appendChild(img);
        });
    }, 400);
}

function triggerWinnerSlipModal(index) {
    if (winnersGlobalDataCache[index]) {
        const rawBillStr = winnersGlobalDataCache[index].billText;
        const lines = rawBillStr.split('\n');
        let customer = winnersGlobalDataCache[index].customer;
        let timeBuy = "ไม่ระบุ"; let payment = "เงินสด"; let seller = "แอดมิน"; let totalAmt = "0";
        let itemsList = [];

        lines.forEach(line => {
            if(line.includes("เวลาซื้อ:")) timeBuy = line.replace("เวลาซื้อ:", "").trim();
            if(line.includes("ชำระโดย:")) payment = line.replace("ชำระโดย:", "").trim();
            if(line.includes("ผู้ขาย:")) seller = line.replace("ผู้ขาย:", "").trim();
            if(line.includes("ยอดรวม:")) totalAmt = line.replace("ยอดรวม:", "").trim();
            if(/^\d+\./.test(line.trim())) { itemsList.push(line.trim()); }
        });

        document.getElementById('modalBillTitle').innerText = "🎉 ใบเสร็จผู้โชคดีถูกหวย!!";
        document.getElementById('slipCustName').innerText = customer;
        document.getElementById('slipTimeBuy').innerText = timeBuy;
        document.getElementById('slipPayment').innerText = payment;
        document.getElementById('slipSeller').innerText = seller;
        document.getElementById('slipTotalAmt').innerText = totalAmt;
        
        document.getElementById('slipItemsContainer').innerHTML = buildTripleColumnsLayout(itemsList);

        document.getElementById('downloadImgBtn').className = "btn btn-primary"; 
        document.getElementById('downloadImgBtn').innerText = "📥 บันทึกรูปภาพ";
        
        document.getElementById('copyBillModal').style.display = 'block';
        document.querySelector('.slip-scroll-wrapper').scrollTop = 0;
        
        // เรียกตัวแปลงไฟล์ภาพทันทีที่เปิดโมดอลคนถูกรางวัล
        convertSlipToRealImageElement();
    }
}

function downloadSlipToGallery() {
    const imgView = document.getElementById('realSlipImgView');
    if (imgView) {
        const link = document.createElement('a');
        link.download = `HuayReceipt_${Date.now()}.png`;
        link.href = imgView.src;
        link.click();
        
        const dlBtn = document.getElementById('downloadImgBtn');
        dlBtn.style.background = "linear-gradient(180deg, #34c759 0%, #28a745 100%)";
        dlBtn.innerText = "✅ บันทึกแล้ว! หรือแตะค้างที่รูปภาพเพื่อเซฟลงคลัง";
        setTimeout(() => {
            dlBtn.style.background = "linear-gradient(180deg, #007aff 0%, #0056b3 100%)";
            dlBtn.innerText = "📥 บันทึกรูปภาพ";
        }, 3000);
    } else {
        alert("กรุณารอรูปภาพประมวลผลสักครู่ค่ะ");
    }
}

function generateAndShareSlipPhoto() {
    const imgView = document.getElementById('realSlipImgView');
    if (!imgView) { alert("รูปภาพยังประมวลผลไม่เสร็จค่ะ"); return; }
    
    const shareBtn = document.getElementById('shareImgBtn');
    shareBtn.disabled = true; shareBtn.innerText = "⏳ กำลังเตรียมส่งรูป...";

    fetch(imgView.src).then(res => res.blob()).then(blob => {
        const file = new File([blob], "SmartHuay_Receipt.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'บิลสลิปหวยนำโชค' }).then(() => {
                shareBtn.disabled = false; shareBtn.innerText = "แชร์รูปภาพ";
            }).catch(() => { shareBtn.disabled = false; shareBtn.innerText = "แชร์รูปภาพ"; });
        } else {
            const link = document.createElement('a');
            link.download = `HuaySlip_${Date.now()}.png`; link.href = imgView.src; link.click();
            shareBtn.disabled = false; shareBtn.innerText = "✅ ดาวน์โหลดสำเร็จ!";
            setTimeout(() => { shareBtn.innerText = "แชร์รูปภาพ"; }, 2000);
        }
    }).catch(() => { shareBtn.disabled = false; shareBtn.innerText = "แชร์รูปภาพ"; });
}

function checkSavedLoginSession() {
    const savedUser = localStorage.getItem('smartHuayUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('currentUserName').innerText = currentUser.name;
            showMenu();
        } catch (e) { localStorage.removeItem('smartHuayUser'); }
    }
}

function loadUserDropdown() {
    fetch(BACKEND_API_URL, { method: "POST", body: JSON.stringify({ action: "getUsernames" }) })
    .then(res => res.json())
    .then(data => {
        const selectElement = document.getElementById('loginUser');
        if (selectElement && data.users && data.users.length > 0) {
            let html = '';
            data.users.forEach(u => { html += `<option value="${u.username}">${u.name}</option>`; });
            selectElement.innerHTML = html;
        }
    }).catch(err => console.error("โหลดพนักงานพลาด:", err));
}

function handleLogin() {
    const selectedUser = document.getElementById('loginUser').value;
    const pin = document.getElementById('loginPin').value;
    if(!selectedUser || !pin) { alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }
    fetch(BACKEND_API_URL, { method: "POST", body: JSON.stringify({ action: "login", username: selectedUser, pin: pin }) })
    .then(res => res.json())
    .then(res => {
        if(res.success) {
            currentUser = res; localStorage.setItem('smartHuayUser', JSON.stringify(res));
            document.getElementById('loginContainer').style.display = 'none'; document.getElementById('mainApp').style.display = 'block';
            document.getElementById('currentUserName').innerText = res.name; document.getElementById('loginPin').value = '';
            showMenu();
        } else { alert(res.message); }
    }).catch(err => alert('เชื่อมต่อระบบหลังบ้านล้มเหลว'));
}

function checkLengthAndToggleFields(value) {
    const positionSection = document.getElementById('huayPositionSection');
    const laoAmtSection = document.getElementById('laoAmtSection');
    const thaiAmtSection = document.getElementById('thaiAmtSection');
    const namSatText = document.getElementById('namSatText');
    if (value.length === 2 && tamraHuay[value]) { namSatText.innerHTML = `🐾 ນາມສັດ: <span style="color:#fff; font-weight:bold;">${tamraHuay[value]}</span>`; } else { namSatText.innerText = ''; }
    if (currentHuayType === 'ไทย' && value.length === 2) {
        positionSection.style.display = 'block'; laoAmtSection.style.display = 'none'; thaiAmtSection.style.display = 'block';
        setHuayPosition(currentHuayPosition, document.querySelector(`.btn-position[data-position="${currentHuayPosition}"]`));
    } else { positionSection.style.display = 'none'; laoAmtSection.style.display = 'block'; thaiAmtSection.style.display = 'none'; }
}

function setHuayType(type, btn) { currentHuayType = type; document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active')); btn.classList.add('active'); checkLengthAndToggleFields(document.getElementById('huayNum').value); }

function setHuayPosition(position, btn) {
    currentHuayPosition = position; document.querySelectorAll('.btn-position').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active');
    const amtTopOnly = document.getElementById('amtTopOnly'), amtBotOnly = document.getElementById('amtBotOnly'), amtBothSection = document.getElementById('amtBothSection');
    amtTopOnly.style.display = 'none'; amtBotOnly.style.display = 'none'; amtBothSection.style.display = 'grid';
    if (position === 'บน') amtTopOnly.style.display = 'block'; else if (position === 'ล่าง') amtBotOnly.style.display = 'block'; else if (position === 'บน/ล่าง') amtBothSection.style.display = 'grid';
}

function setPaymentMethod(method, btn) { currentPaymentMethod = method; document.querySelectorAll('.btn-payment').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

function setQuickAmount(amount) {
    if (lastFocusedInput && document.body.contains(lastFocusedInput) && lastFocusedInput.offsetParent !== null) {
        const currentAmt = parseFloat(lastFocusedInput.value) || 0; lastFocusedInput.value = currentAmt + amount; lastFocusedInput.focus(); return;
    }
    const num = document.getElementById('huayNum').value;
    if (currentHuayType === 'ไทย' && num.length === 2) {
        if (currentHuayPosition === 'บน') { const el = document.getElementById('huayAmtTop'); el.value = (parseFloat(el.value) || 0) + amount; el.focus(); } 
        else if (currentHuayPosition === 'ล่าง') { const el = document.getElementById('huayAmtBot'); el.value = (parseFloat(el.value) || 0) + amount; el.focus(); } 
        else if (currentHuayPosition === 'บน/ล่าง') { const el = document.getElementById('huayAmtTop2'); el.value = (parseFloat(el.value) || 0) + amount; el.focus(); }
    } else { const el = document.getElementById('huayAmt'); el.value = (parseFloat(el.value) || 0) + amount; el.focus(); }
}

function addItem() {
    const num = document.getElementById('huayNum').value; if (!num) { alert('กรุณาระบุเลขหวยก่อน'); return; }
    let now = new Date(); let timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (currentHuayType === 'ไทย' && num.length === 2) {
        if (currentHuayPosition === 'บน') {
            const amt = parseFloat(document.getElementById('huayAmtTop').value) || 0; if (amt <= 0) { alert('กรุณาระบุจำนวนเงิน'); return; }
            currentBillItems.unshift({ num, type: currentHuayType, position: 'บน', amt, timeAdded: timeStr }); document.getElementById('huayAmtTop').value = '';
        } else if (currentHuayPosition === 'ล่าง') {
            const amt = parseFloat(document.getElementById('huayAmtBot').value) || 0; if (amt <= 0) { alert('กรุณาระบุจำนวนเงิน'); return; }
            currentBillItems.unshift({ num, type: currentHuayType, position: 'ล่าง', amt, timeAdded: timeStr }); document.getElementById('huayAmtBot').value = '';
        } else if (currentHuayPosition === 'บน/ล่าง') {
            const amtTop = parseFloat(document.getElementById('huayAmtTop2').value) || 0, amtBot = parseFloat(document.getElementById('huayAmtBot2').value) || 0;
            if (amtTop <= 0 && amtBot <= 0) { alert('กรุณาใส่จำนวนเงินบนหรือล่างอย่างน้อย 1 ช่อง'); return; }
            if (amtBot > 0) currentBillItems.unshift({ num, type: currentHuayType, position: 'ล่าง', amt: amtBot, timeAdded: timeStr });
            if (amtTop > 0) currentBillItems.unshift({ num, type: currentHuayType, position: 'บน', amt: amtTop, timeAdded: timeStr });
            document.getElementById('huayAmtTop2').value = ''; document.getElementById('huayAmtBot2').value = '';
        }
    } else {
        const amt = parseFloat(document.getElementById('huayAmt').value) || 0; if (amt <= 0) { alert('กรุณาระบุจำนวนเงิน'); return; }
        currentBillItems.unshift({ num, type: currentHuayType, amt, timeAdded: timeStr }); document.getElementById('huayAmt').value = '';
    }
    renderBillTable(); document.getElementById('huayNum').value = ''; checkLengthAndToggleFields(''); document.getElementById('huayNum').focus();
}

function renderBillTable() {
    const tbody = document.getElementById('billTableBody'); let total = 0;
    if(currentBillItems.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); font-size: 15px;">ยังไม่มีรายการถูกเพิ่มเข้าบิล</td></tr>`; document.getElementById('billTotalText').innerText = "0 ₭"; return; }
    let html = '';
    currentBillItems.forEach((item, idx) => {
        total += item.amt; let numDisplay = item.num;
        let animalLabel = (item.num.length === 2 && tamraHuay[item.num]) ? ` <span style="color:#ffb703; font-size:14px; font-weight:600;">(${tamraHuay[item.num]})</span>` : '';
        if (item.position) numDisplay = `${item.num}${animalLabel} <small style="font-size: 13px; color: #ff9500; font-weight:bold;">[${item.position}]</small>`; else numDisplay = `${item.num}${animalLabel}`;
        let staffName = (currentUser && currentUser.name) ? currentUser.name : "แอดมิน";
        let now = new Date(); let options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }; let dateStr = now.toLocaleDateString('en-US', options).replace(/,/g, '');
        let showDetails = item.timeAdded ? `<br><small style="color: #cbd5e1; font-size: 13px; font-weight: normal; display:inline-block; margin-top:4px;">เมื่อ: ${dateStr} เวลา ${item.timeAdded} | โดย: ${staffName}</small>` : '';
        html += `<tr><td><strong style="font-size:18px; color:#fff;">${numDisplay}</strong> <span style="font-size: 13px; color: #cbd5e1; margin-left: 6px;">${item.type}</span>${showDetails}</td><td><span class="badge ${item.type === 'ไทย' ? 'badge-th' : 'badge-lao'}\">${item.type}</span></td><td style="font-weight: 700; color:#00df89; font-size:16px;">${item.amt.toLocaleString()} ₭</td><td><button class="btn-remove" onclick="removeItem(${idx})">❌</button></td></tr>`;
    });
    tbody.innerHTML = html; document.getElementById('billTotalText').innerText = total.toLocaleString() + " ₭";
}

function removeAllItems() { currentBillItems = []; renderBillTable(); }
function removeItem(idx) { currentBillItems.splice(idx, 1); renderBillTable(); }

function submitBill() {
    if (currentBillItems.length === 0) { alert("กรุณาเพิ่มรายการหวยก่อน"); return; }
    const custName = document.getElementById('custName').value.trim() || "ลูกค้าทั่วไป";
    const btn = document.getElementById('btnSubmit'); btn.disabled = true; btn.innerText = `⏳ กำลังบันทึกข้อมูล...`;
    
    const payload = { customer: custName, payment: currentPaymentMethod, items: currentBillItems, user: currentUser ? currentUser.username : "admin" };
    
    fetch(BACKEND_API_URL, { method: "POST", body: JSON.stringify({ action: "saveOrder", payload: payload }) })
    .then(res => res.json())
    .then(response => {
        btn.disabled = false; btn.innerText = `✅ ยืนยันปิดบิลและส่งเข้า Telegram`;
        if (response.status === "success") {
            showStatusPopup("🚀 บันทึกบิลสำเร็จ!", "ระบบส่งข้อมูลเข้า Telegram เรียบร้อยแล้วค่ะ", true, function() {
                
                document.getElementById('modalBillTitle').innerText = "🧾 ใบเสร็จรับเงินอิเล็กทรอนิกส์";
                let now = new Date();
                let dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
                let staffName = (currentUser && currentUser.name) ? currentUser.name : "แอดมิน";
                
                document.getElementById('slipCustName').innerText = custName;
                document.getElementById('slipTimeBuy').innerText = dateStr;
                document.getElementById('slipPayment').innerText = currentPaymentMethod;
                document.getElementById('slipSeller').innerText = staffName;
                
                let itemsList = []; let total = 0;
                currentBillItems.forEach((item, idx) => {
                    total += item.amt; 
                    let flag = item.type === 'ลาว' ? '🇱🇦' : '🇹🇭';
                    let pos = item.position ? `[${item.position}]` : '[--]';
                    itemsList.push(`${idx+1}.${flag}${item.num}${pos}-${item.amt.toLocaleString()}`);
                });
                document.getElementById('slipTotalAmt').innerText = total.toLocaleString() + " ₭";
                
                document.getElementById('slipItemsContainer').innerHTML = buildTripleColumnsLayout(itemsList);
                
                document.getElementById('downloadImgBtn').className = "btn btn-primary";
                document.getElementById('downloadImgBtn').innerText = "📥 บันทึกรูปภาพ";
                
                document.getElementById('copyBillModal').style.display = 'block';
                document.querySelector('.slip-scroll-wrapper').scrollTop = 0;
                
                // เรียกตัวแปลงไฟล์ภาพอัตโนมัติเมื่อแอดมินกดปิดบิลสำเร็จคีย์สด
                convertSlipToRealImageElement();
                
                currentBillItems = []; renderBillTable(); document.getElementById('custName').value = '';
            });
        } else { showStatusPopup("❌ เกิดข้อผิดพลาด", response.message, false); }
    }).catch(err => { btn.disabled = false; btn.innerText = `✅ ยืนยันปิดบิลและส่งเข้า Telegram`; showStatusPopup("❌ ล้มเหลว", "เกิดข้อผิดพลาดจากเครือข่ายหลังบ้าน", false); });
}

let statusModalCallback = null, statusModalTimer = null;
function showStatusPopup(title, message, isSuccess, callback = null) { if (statusModalTimer) clearTimeout(statusModalTimer); document.getElementById('statusTitle').innerText = title; document.getElementById('statusMessage').innerText = message; document.getElementById('statusIcon').innerText = isSuccess ? "💎" : "💥"; statusModalCallback = callback; document.getElementById('statusModal').style.display = 'block'; statusModalTimer = setTimeout(function() { closeStatusModal(); }, 1500); }
function closeStatusModal() { if (statusModalTimer) clearTimeout(statusModalTimer); document.getElementById('statusModal').style.display = 'none'; if(statusModalCallback && typeof statusModalCallback === 'function') { statusModalCallback(); statusModalCallback = null; } }

function closeCopyModal() { document.getElementById('copyBillModal').style.display = 'none'; }

function closeCopyModal() {
    document.getElementById('copyBillModal').style.display = 'none';
    // ล้างตัววิวภาพออกเมื่อปิดหน้าต่าง เพื่อให้บิลใบถัดไปคำนวณใหม่ได้ถูกต้อง
    const img = document.getElementById('realSlipImgView');
    if (img) img.remove();
}

function loadDashboardData() {
    fetch(BACKEND_API_URL, { method: "POST", body: JSON.stringify({ action: "getStats" }) })
    .then(res => res.json())
    .then(data => {
        if(data && data.success) {
            document.getElementById('statToday').innerText = data.today.toLocaleString() + " ₭"; document.getElementById('statWeek').innerText = data.week.toLocaleString() + " ₭"; document.getElementById('statMonth').innerText = data.month.toLocaleString() + " ₭";
            let html = '';
            if (!data.history || data.history.length === 0) { html = `<p style="text-align: center; color: var(--text-muted); font-size: 15px; padding: 20px;">ไม่มีข้อมูลประวัติบิล</p>`; } 
            else {
                let billsMap = {};
                data.history.forEach(item => {
                    let displaySellerName = item.seller || "แอดมิน"; let displayTimeStr = item.time ? String(item.time) : "Fri May 15 2026 เวลา: --:--"; let billKey = `${displayTimeStr}_${item.customer || 'ลูกค้าทั่วไป'}`;
                    if (!billsMap[billKey]) { billsMap[billKey] = { customer: item.customer || 'ลูกค้าทั่วไป', timeStr: displayTimeStr, seller: displaySellerName, totalAmt: 0 }; }
                    billsMap[billKey].totalAmt += Number(item.amt || 0);
                });
                let sortedBills = Object.values(billsMap).slice(0, 5);
                sortedBills.forEach(bill => {
                    html += `<div class="history-item" style="padding:16px;"><div style="flex: 1;"><span style="font-size: 18px; font-weight: 700; color: #ffffff;">👤 ลูกค้า: ${bill.customer}</span><br><small style="color: #cbd5e1; font-size: 13px; display: inline-block; margin-top: 6px;">เมื่อ: ${bill.timeStr} | ผู้ขาย: ${bill.seller}</small></div><div style="text-align: right; min-width: 120px;"><span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 2px;">รวมยอดบิล</span><strong style="font-size: 18px; color: #00df89; font-weight:700;">${bill.totalAmt.toLocaleString()} ₭</strong></div></div>`;
                });
            }
            document.getElementById('historyContainer').innerHTML = html;
        }
    }).catch(err => console.error('Dashboard error:', err));
}

function logout() { localStorage.removeItem('smartHuayUser'); currentUser = {}; document.getElementById('mainApp').style.display = 'none'; document.getElementById('loginContainer').style.display = 'block'; hideAllPages(); }
function hideAllPages() { document.getElementById('menuPage').classList.add('hidden'); document.getElementById('recorderPage').classList.add('hidden'); document.getElementById('dashboardPage').classList.add('hidden'); }
function showMenu() { hideAllPages(); document.getElementById('menuPage').classList.remove('hidden'); }
function goToRecorder() { hideAllPages(); document.getElementById('recorderPage').classList.remove('hidden'); document.getElementById('huayNum').focus(); }
function goToDashboard() { hideAllPages(); document.getElementById('dashboardPage').classList.remove('hidden'); loadDashboardData(); }
function backToMenu() { showMenu(); }