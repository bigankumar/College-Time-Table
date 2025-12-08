/* =====================================================
   GLOBAL VARIABLES
===================================================== */
let classes = [];
let tasks = [];
let currentFilter = "all";

/* =====================================================
   LOGIN SCREEN HELPERS
===================================================== */
function show(id) {
    document.querySelectorAll(".center-box").forEach(box => box.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function hideLoginScreens() {
    document.querySelectorAll(".center-box").forEach(box => box.classList.add("hidden"));
}

/* =====================================================
   STUDENT REGISTRATION + LOGIN
===================================================== */
function openStudentReg() { show("studentReg"); }
function openStudentLogin() { show("studentLogin"); }

function registerStudent() {
    let name = stuName.value.trim();
    let email = stuEmail.value.trim();

    if (!name || !email) return alert("Fill all fields");
    localStorage.setItem("student", JSON.stringify({ name, email }));
    alert("Registration successful!");
    show("studentLogin");
}

function studentLoginNow() {
    let email = stuEmailLogin.value.trim();
    let student = JSON.parse(localStorage.getItem("student") || "{}");

    if (student.email === email) {
        loadApp("student", student.email);
    } else alert("Invalid student login!");
}

/* =====================================================
   TEACHER REGISTRATION + LOGIN
===================================================== */
function openTeacherReg() { show("teacherReg"); }
function openTeacherLogin() { show("teacherLogin"); }

function registerTeacher() {
    let name = teachName.value.trim();
    let email = teachEmail.value.trim();

    if (!name || !email) return alert("Fill all fields");
    localStorage.setItem("teacher", JSON.stringify({ name, email }));
    alert("Teacher Registered!");
    show("teacherLogin");
}

function teacherLoginNow() {
    let email = teachEmailLogin.value.trim();
    let teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    if (teacher.email === email) {
        loadApp("teacher", teacher.email);
    } else alert("Invalid teacher login!");
}

/* =====================================================
   ADMIN LOGIN
===================================================== */
function adminDirectLogin() { show("adminLogin"); }

function adminLoginNow() {
    let email = adminEmail.value.trim();
    let pass = adminPass.value.trim();

    if (email === "admin@gmail.com" && pass === "admin123") {
        loadApp("admin", email);
    } else alert("Wrong admin credentials!");
}

/* =====================================================
   LOAD DASHBOARD
===================================================== */
function loadApp(role, email) {
    hideLoginScreens();
    document.getElementById("app").style.display = "block";

    // Show email under time
    document.getElementById("loggedUser").innerText = "Logged in as: " + email;

    localStorage.setItem("userRole", role);

    applyRoleRestrictions(role);
    init();
}

/* LOGOUT */
function logout() {
    localStorage.removeItem("userRole");
    location.reload();
}

/* =====================================================
   APPLY ROLE-BASED VIEW
===================================================== */
function applyRoleRestrictions(role) {
    const fullDashboard = document.getElementById("fullDashboard");
    const studentStatsArea = document.getElementById("studentStatsArea");
    const studentDisplayArea = document.getElementById("studentDisplayArea");
    const tabsArea = document.getElementById("tabsArea");
    const addClassCard = document.getElementById("addClassCard");
    const adminButtons = document.getElementById("adminButtons");
    const adminTeacherStats = document.getElementById("adminTeacherStats");

    if (role === "student") {
        fullDashboard.style.display = "none";

        studentStatsArea.style.display = "grid";
        studentDisplayArea.style.display = "block";

        tabsArea.style.display = "none";
        adminButtons.style.display = "none";
        addClassCard.style.display = "none";
        adminTeacherStats.style.display = "none";

        return;
    }

    if (role === "teacher") {
        addClassCard.style.display = "none";
        adminButtons.style.display = "none";
    }

    if (role === "admin") {
        addClassCard.style.display = "block";
        adminButtons.style.display = "flex";
    }
}

/* =====================================================
   SAMPLE DATA LOAD (FIRST TIME)
===================================================== */
if (!localStorage.getItem("sampleDataLoaded")) {

    // Default sample classes
    classes = [
        {
            id: 1,
            name: "Data Structures",
            day: "Monday",
            startTime: "10:00",
            endTime: "11:00",
            teacher: "Dr. Smith",
            room: "Lab 301",
            type: "Lecture"
        },
        {
            id: 2,
            name: "DBMS",
            day: "Tuesday",
            startTime: "11:00",
            endTime: "12:00",
            teacher: "Prof. Sharma",
            room: "Room 204",
            type: "Lecture"
        },
        {
            id: 3,
            name: "Computer Networks",
            day: "Wednesday",
            startTime: "09:00",
            endTime: "10:00",
            teacher: "Dr. Rao",
            room: "Room 110",
            type: "Lecture"
        }
    ];

    // Sample tasks
    tasks = [
        {
            id: 1,
            title: "DS Assignment",
            subject: "Data Structures",
            date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            priority: "High",
            completed: false
        },
        {
            id: 2,
            title: "CN Notes",
            subject: "Computer Networks",
            date: new Date().toISOString().split("T")[0],
            priority: "Medium",
            completed: false
        }
    ];

    localStorage.setItem("timetableClasses", JSON.stringify(classes));
    localStorage.setItem("timetableTasks", JSON.stringify(tasks));
    localStorage.setItem("sampleDataLoaded", "true");
}

/* =====================================================
   LOAD DATA
===================================================== */
function loadData() {
    const savedClasses = localStorage.getItem("timetableClasses");
    const savedTasks = localStorage.getItem("timetableTasks");

    if (savedClasses) classes = JSON.parse(savedClasses);
    if (savedTasks) tasks = JSON.parse(savedTasks);
}

/* SAVE DATA */
function saveData() {
    localStorage.setItem("timetableClasses", JSON.stringify(classes));
    localStorage.setItem("timetableTasks", JSON.stringify(tasks));
}

/* =====================================================
   INIT DASHBOARD
===================================================== */
function init() {
    loadData();
    updateCurrentTime();

    setInterval(updateCurrentTime, 1000);
    setInterval(checkUpcomingClasses, 30000);

    updateStats();
    renderCalendar();
    renderAnalytics();
    displayClasses();
    displayTasks();
    loadNotes();

    checkRoleRestrictions();
}

/* =====================================================
   STUDENT SPECIFIC UI
===================================================== */
function checkRoleRestrictions() {
    const role = localStorage.getItem("userRole");

    if (role === "student") {
        showTodayClasses(); // Default view
    }
}

/* === Show Today Classes === */
function showTodayClasses() {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const todayClasses = classes.filter(c => c.day === today);

    document.getElementById("studentDisplayTitle").innerText = "Today's Classes";
    document.getElementById("studentDisplayContent").innerHTML =
        todayClasses.length === 0
            ? `<p>No classes today.</p>`
            : todayClasses.map(c => `
                <div class="class-item today">
                    <div class="class-time">${c.startTime} - ${c.endTime}</div>
                    <div class="class-name">${c.name}</div>
                    <div class="class-details">${c.teacher} | ${c.room}</div>
                </div>
            `).join("");

    document.getElementById("todayClasses").innerText = todayClasses.length;
}

/* === Show Weekly Summary (Fixed Week Mon–Fri) === */
function showWeeklySummary() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let output = `
        <table class="week-table">
            <tr>
                <th>Day</th>
                <th>Classes</th>
            </tr>
    `;

    let total = 0;

    days.forEach(day => {
        let count = classes.filter(c => c.day === day).length;
        total += count;

        output += `
            <tr>
                <td>${day}</td>
                <td>${count}</td>
            </tr>
        `;
    });

    output += "</table>";

    document.getElementById("studentDisplayTitle").innerText = "Weekly Class Summary";
    document.getElementById("studentDisplayContent").innerHTML = output;

    document.getElementById("weeklySummaryCount").innerText = total;
}

/* =====================================================
   CLOCK
===================================================== */
function updateCurrentTime() {
    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    };

    document.getElementById("currentTime").innerText =
        now.toLocaleDateString("en-US", options);
}

/* =====================================================
   TABS (ADMIN + TEACHER ONLY)
===================================================== */
function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(tabName + "Tab").classList.add("active");

    if (tabName === "calendar") renderCalendar();
    if (tabName === "analytics") renderAnalytics();
}

/* =====================================================
   CLASS MANAGEMENT
===================================================== */
function addClass(data) {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") return alert("Only admin can add classes!");

    classes.push({ id: Date.now(), ...data });

    saveData();
    displayClasses();
    updateStats();
    renderCalendar();
    renderAnalytics();
}

function deleteClass(id) {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") return alert("Only admin can delete!");

    classes = classes.filter(c => c.id !== id);
    saveData();
    displayClasses();
    updateStats();
}

function editClass(id) {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") return alert("Only admin can edit!");

    const cls = classes.find(c => c.id === id);

    className.value = cls.name;
    classDay.value = cls.day;
    startTime.value = cls.startTime;
    endTime.value = cls.endTime;
    teacherName.value = cls.teacher || "";
    roomNumber.value = cls.room || "";
    classType.value = cls.type;

    deleteClass(id);
}

/* DISPLAY CLASSES */
function displayClasses() {
    const role = localStorage.getItem("userRole");
    const container = document.getElementById("classList");

    let filtered =
        currentFilter === "all"
            ? classes
            : classes.filter(c => c.day === currentFilter);

    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));

    container.innerHTML =
        filtered.length === 0
            ? `<p>No classes.</p>`
            : filtered.map(c => `
                <div class="class-item">
                    <div class="class-actions">
                        ${role === "admin" ?
                        `<button class="btn-small btn-edit" onclick="editClass(${c.id})">Edit</button>
                         <button class="btn-small btn-delete" onclick="deleteClass(${c.id})">Delete</button>`
                        : ``}
                    </div>
                    <div class="class-time">${c.startTime} - ${c.endTime}</div>
                    <div class="class-name">${c.name}</div>
                    <div class="class-details">${c.teacher} | ${c.room}</div>
                </div>
            `).join("");
}

function filterClasses(day) {
    currentFilter = day;
    displayClasses();
}

/* =====================================================
   UPCOMING CLASS ALERT
===================================================== */
function checkUpcomingClasses() {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const now = new Date();

    const upcoming = classes.find(c => {
        if (c.day !== today) return false;

        const [h, m] = c.startTime.split(":");
        const classTime = new Date();
        classTime.setHours(h, m, 0);

        const diff = classTime - now;
        return diff > 0 && diff <= 15 * 60 * 1000;
    });

    if (upcoming) {
        alertBox.classList.add("show");
        alertMessage.innerText = `${upcoming.name} starts at ${upcoming.startTime}`;
    } else {
        alertBox.classList.remove("show");
    }
}

/* =====================================================
   STATS
===================================================== */
function updateStats() {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    document.getElementById("totalClasses").innerText = classes.length;

    const todayCount = classes.filter(c => c.day === today).length;
    document.getElementById("todayClasses").innerText = todayCount;

    const next = classes.filter(c => c.day === today).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
    )[0];

    document.getElementById("nextClass").innerText = next ? next.startTime : "--";

    const totalHours = classes.reduce((sum, c) => {
        const [sh, sm] = c.startTime.split(":").map(Number);
        const [eh, em] = c.endTime.split(":").map(Number);
        return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);

    document.getElementById("weeklyHours").innerText = totalHours.toFixed(1);

    document.getElementById("completedTasks").innerText =
        tasks.filter(t => t.completed).length;
}

/* =====================================================
   CALENDAR
===================================================== */
function renderCalendar() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    calendarGrid.innerHTML = days.map(day => {
        const count = classes.filter(c => c.day === day).length;
        return `
            <div class="calendar-day">
                <div class="calendar-day-name">${day}</div>
                <div class="calendar-class-count">${count}</div>
            </div>
        `;
    }).join("");
}

/* =====================================================
   ANALYTICS
===================================================== */
function renderAnalytics() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts = days.map(d => classes.filter(c => c.day === d).length);
    const max = Math.max(...counts, 1);

    barChart.innerHTML = counts.map((count, i) => `
        <div class="bar" style="height:${(count / max) * 100}%;">
            <div class="bar-value">${count}</div>
            <div class="bar-label">${days[i].slice(0,3)}</div>
        </div>
    `).join("");

    const types = {};
    classes.forEach(c => types[c.type] = (types[c.type] || 0) + 1);

    studyStats.innerHTML = Object.entries(types)
        .map(([type, count]) => `<p>${type}: ${count}</p>`)
        .join("");
}

/* =====================================================
   TASKS
===================================================== */
function addTask(data) {
    tasks.push({ id: Date.now(), completed: false, ...data });
    saveData();
    displayTasks();
    updateStats();
}

function toggleTask(id) {
    let t = tasks.find(t => t.id === id);
    t.completed = !t.completed;
    saveData();
    displayTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    displayTasks();
}

function displayTasks() {
    tasksList.innerHTML =
        tasks.length === 0
            ? `<p>No tasks.</p>`
            : tasks.map(t => `
                <div class="task-item ${t.completed ? "completed" : ""}">
                    <input type="checkbox" ${t.completed ? "checked" : ""} onclick="toggleTask(${t.id})">
                    <div style="flex:1;">
                        <b>${t.title}</b><br>
                        <small>${t.subject} | Due: ${t.date}</small>
                    </div>
                    <button class="btn-small btn-delete" onclick="deleteTask(${t.id})">Delete</button>
                </div>
            `).join("");
}

/* =====================================================
   NOTES
===================================================== */
function saveNotes() {
    localStorage.setItem("timetableNotes", notesArea.value);
}

function loadNotes() {
    notesArea.value = localStorage.getItem("timetableNotes") || "";
}

/* =====================================================
   EXPORT / IMPORT
===================================================== */
function exportData() {
    const data = { classes, tasks, notes: notesArea.value };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "timetable_backup.json";
    a.click();
}

function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const data = JSON.parse(evt.target.result);
                classes = data.classes || [];
                tasks = data.tasks || [];
                notesArea.value = data.notes || "";
                saveData();
                init();
            } catch {
                alert("Invalid file!");
            }
        };
        reader.readAsText(e.target.files[0]);
    };

    input.click();
}

/* =====================================================
   CLEAR EVERYTHING
===================================================== */
function clearAllData() {
    if (confirm("Delete ALL data? This cannot be undone!")) {
        localStorage.clear();
        location.reload();
    }
}

/* =====================================================
   FORM HANDLERS
===================================================== */
document.getElementById("classForm").addEventListener("submit", e => {
    e.preventDefault();
    addClass({
        name: className.value,
        day: classDay.value,
        startTime: startTime.value,
        endTime: endTime.value,
        teacher: teacherName.value,
        room: roomNumber.value,
        type: classType.value
    });
    e.target.reset();
});

document.getElementById("taskForm").addEventListener("submit", e => {
    e.preventDefault();
    addTask({
        title: taskTitle.value,
        subject: taskSubject.value,
        date: taskDate.value,
        priority: taskPriority.value
    });
    e.target.reset();
});
