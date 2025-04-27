// script.js

const currentDay = document.getElementById('currentDay');
currentDay.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// ตัวแปรหลัก
const planner = document.getElementById('planner');
let timeBlocks = JSON.parse(localStorage.getItem('timeBlocks')) || [];
let plans = JSON.parse(localStorage.getItem('plans')) || {};

// Modal elements
const modal = document.getElementById('timeModal');
const addTimeBlockBtn = document.getElementById('addTimeBlockBtn');

// ฟังก์ชันแปลงเวลา
function timeToDecimal(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + (minutes / 60);
}

function decimalToTime(decimal) {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// สร้าง Time Block
function createTimeBlock(start, end) {
    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    const timeKey = `${start}-${end}`;
    timeBlock.dataset.time = timeKey;

    const currentTime = new Date().getHours() + (new Date().getMinutes() / 60);

    if (end <= currentTime) {
        timeBlock.classList.add('past');
    } else if (start <= currentTime && end > currentTime) {
        timeBlock.classList.add('present');
    } else {
        timeBlock.classList.add('future');
    }

    const hourDiv = document.createElement('div');
    hourDiv.className = 'hour';
    hourDiv.textContent = `${decimalToTime(start)} - ${decimalToTime(end)}`;

    const form = document.createElement('form');
    form.className = 'add-plan-form';

    const input = document.createElement('input');
    input.className = 'plan-input';
    input.placeholder = 'Add new plan...';

    const addButton = document.createElement('button');
    addButton.className = 'add-btn';
    addButton.type = 'submit';
    addButton.textContent = 'Add';

    const planList = document.createElement('ul');
    planList.className = 'plan-list';

    const renderPlans = () => {
        planList.innerHTML = '';
        (plans[timeKey] || []).forEach((plan, index) => {
            const li = document.createElement('li');
            li.className = 'plan-item';

            const span = document.createElement('span');
            span.className = 'plan-text';
            span.textContent = plan;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-plan-btn';
            deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

            deleteBtn.onclick = () => {
                plans[timeKey] = plans[timeKey].filter((_, i) => i !== index);
                localStorage.setItem('plans', JSON.stringify(plans));
                renderPlans();
            };

            li.appendChild(span);
            li.appendChild(deleteBtn);
            planList.appendChild(li);
        });
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        if (input.value.trim()) {
            if (!plans[timeKey]) plans[timeKey] = [];
            plans[timeKey].push(input.value.trim());
            localStorage.setItem('plans', JSON.stringify(plans));
            input.value = '';
            renderPlans();
        }
    };

    form.appendChild(input);
    form.appendChild(addButton);

    timeBlock.appendChild(hourDiv);
    timeBlock.appendChild(planList);
    timeBlock.appendChild(form);
    planner.appendChild(timeBlock);

    renderPlans();
}

// Render ทั้งหมด
function renderAllTimeBlocks() {
    planner.innerHTML = '';
    timeBlocks.forEach(block => {
        createTimeBlock(block.start, block.end);
    });
}

// Event Listeners
addTimeBlockBtn.addEventListener('click', () => modal.style.display = 'flex');
document.querySelector('.cancel-btn').addEventListener('click', () => modal.style.display = 'none');

document.getElementById('customTimeForm').onsubmit = (e) => {
    e.preventDefault();
    const start = timeToDecimal(document.getElementById('startTime').value);
    const end = timeToDecimal(document.getElementById('endTime').value);

    if (end <= start) {
        alert('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
        return;
    }

    // ตรวจสอบเวลาซ้ำ
    const isDuplicate = timeBlocks.some(block =>
        block.start === start && block.end === end
    );

    if (isDuplicate) {
        alert('มีช่วงเวลานี้อยู่แล้วในระบบ');
        return;
    }

    timeBlocks.push({ start, end });
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    modal.style.display = 'none';
    renderAllTimeBlocks();
};

// ปุ่มล้างทั้งหมด
const clearAllBtn = document.createElement('button');
clearAllBtn.className = 'fab clear-all';
clearAllBtn.textContent = '×';
clearAllBtn.style.right = '100px';
clearAllBtn.addEventListener('click', () => {
    if (confirm('ต้องการล้างช่วงเวลาทั้งหมดใช่ไหม?')) {
        timeBlocks = [];
        plans = {};
        localStorage.removeItem('timeBlocks');
        localStorage.removeItem('plans');
        renderAllTimeBlocks();
    }
});
document.body.appendChild(clearAllBtn);

// เรนเดอร์ครั้งแรก
renderAllTimeBlocks();
// บันทึกข้อมูล
async function saveData() {
    try {
        await firebase.setDoc(firebase.doc(db, "plans/user123"), {
            timeBlocks: timeBlocks,
            plans: plans
        });
        alert("เซฟข้อมูลสำเร็จ!");
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
}

// โหลดข้อมูล
async function loadData() {
    try {
        const docSnap = await firebase.getDoc(firebase.doc(db, "plans/user123"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            timeBlocks = data.timeBlocks;
            plans = data.plans;
            renderAllTimeBlocks();
            alert("โหลดข้อมูลสำเร็จ!");
        } else {
            alert("ไม่พบข้อมูล!");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
}
firebase.onSnapshot(firebase.doc(db, "plans/user123"), (doc) => {
    const data = doc.data();
    timeBlocks = data.timeBlocks;
    plans = data.plans;
    renderAllTimeBlocks();
});