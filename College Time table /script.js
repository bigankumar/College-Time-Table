// GLOBAL DATA
        let classes = [];
        let currentUser = null;
        let currentRole = "student";
        let selectedRole = "student";
        let teacherSelectedBatch = null;
        let adminSelectedBatch = null;

        // 12-HOUR TIME FORMATTER
        function to12Hour(t) {
            let [h, m] = t.split(":").map(Number);
            let ampm = h >= 12 ? "PM" : "AM";
            h = h % 12;
            if (h === 0) h = 12;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
        }

        // INIT
        function init() {
            loadUsers();
            loadClasses();
            updateTime();
            setInterval(updateTime, 1000);
            setInterval(checkUpcomingClasses, 20000);
        }

        // USERS
        function loadUsers() {
            if (!localStorage.getItem("users_v3")) {
                localStorage.setItem("users_v3", JSON.stringify([]));
            }
        }

        // CLASSES STORAGE
        function loadClasses() {
            const saved = localStorage.getItem("classes_v3");
            if (saved) {
                let arr = JSON.parse(saved);
                classes = arr.filter(c => {
                    if (!c.batch) {
                        showNotification("⚠ Missing batch field — class skipped");
                        return false;
                    }
                    return true;
                });
            }
        }

        function saveClasses() {
            localStorage.setItem("classes_v3", JSON.stringify(classes));
        }

        // CLOCK
        function updateTime() {
            const now = new Date();
            document.getElementById("currentTime").textContent = now.toLocaleString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }

        // LOGIN / REGISTER
        function selectRole(r) {
            selectedRole = r;
            
            // Highlight active button
            document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
            event.target.classList.add("active");

            // Batch dropdown visibility
            if (r === "teacher" || r === "admin") {
                document.getElementById("batchSelectRegister").style.display = "none";  // Hide for teacher/admin
            } else {
                document.getElementById("batchSelectRegister").style.display = "block"; // Show only for student
            }

            // Admin cannot register
            if (r === "admin") {
                document.getElementById("registerForm").style.display = "none";
                document.getElementById("loginForm").style.display = "block";
            }
        }

        function toggleForms() {
            const L = document.getElementById("loginForm");
            const R = document.getElementById("registerForm");

            if (L.style.display === "none") {
                L.style.display = "block";
                R.style.display = "none";
            } else {
                if (selectedRole === "admin") {
                    showNotification("Admin cannot register");
                    return;
                }
                L.style.display = "none";
                R.style.display = "block";
            }
        }

        function handleRegister() {
            let name = document.getElementById("registerName").value;
            let email = document.getElementById("registerEmail").value;
            let pass = document.getElementById("registerPassword").value;
            let batch = document.getElementById("registerBatch").value;

            if (!name || !email || !pass) {
                showNotification("Fill all fields");
                return;
            }

            // Student must select batch
            if (selectedRole === "student" && !batch) {
                showNotification("Please select your batch");
                return;
            }

            // Teacher should NOT have batch
            if (selectedRole === "teacher") {
                batch = null;
            }

            let users = JSON.parse(localStorage.getItem("users_v3"));

            if (users.some(u => u.email === email)) {
                showNotification("Email already exists");
                return;
            }

            users.push({
                name,
                email,
                password: pass,
                role: selectedRole,
                batch: selectedRole === "student" ? batch : null
            });

            localStorage.setItem("users_v3", JSON.stringify(users));
            showNotification("Registered successfully!");
            toggleForms();
        }

        function handleLogin() {
            let email = document.getElementById("loginEmail").value;
            let pass = document.getElementById("loginPassword").value;

            if (!email || !pass) return showNotification("Enter email/password");

            if (selectedRole === "admin") {
                if (email === "admin@gmail.com" && pass === "admin123") {
                    currentUser = { name: "Admin", email, role: "admin" };
                    currentRole = "admin";
                    loadApp();
                    return;
                }
                return showNotification("Invalid admin login");
            }

            let users = JSON.parse(localStorage.getItem("users_v3"));
            let u = users.find(x => x.email === email && x.password === pass && x.role === selectedRole);

            if (!u) return showNotification("Invalid login");

            currentUser = u;
            currentRole = u.role;
            loadApp();
        }

        function handleLogout() {
            location.reload();
        }

        // APP LOADER
        function loadApp() {
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("appContainer").classList.add("show");
            document.getElementById("userName").textContent = currentUser.name;
            document.getElementById("userBadge").textContent = currentRole.toUpperCase();

            document.getElementById("studentUI").style.display = "none";
            document.getElementById("teacherUI").style.display = "none";
            document.getElementById("adminUI").style.display = "none";

            if (currentRole === "student") {
                document.getElementById("studentUI").style.display = "block";
                renderStudentToday();
                renderStudentWeek();
            }

            if (currentRole === "teacher") {
                document.getElementById("teacherUI").style.display = "block";
                document.getElementById("teacherBatchSelect").style.display = "grid";
                document.getElementById("teacherBatchHeader").style.display = "none";
                document.getElementById("changeBatchBtn").style.display = "none";
            }

            if (currentRole === "admin") {
                document.getElementById("adminUI").style.display = "block";
                renderAdminDashboard();
            }

            checkUpcomingClasses();
        }

        // STUDENT FUNCTIONS
        function switchStudentTab(tab) {
            document.querySelectorAll("#studentUI .tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll("#studentUI .tab-content").forEach(c => c.classList.remove("active"));
            event.target.classList.add("active");

            if (tab === "today") {
                document.getElementById("studentTodayTab").classList.add("active");
                renderStudentToday();
            } else {
                document.getElementById("studentWeekTab").classList.add("active");
                renderStudentWeek();
            }
        }

        function studentFiltered() {
            return classes.filter(c => c.batch === currentUser.batch);
        }

        function renderStudentToday() {
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            let arr = studentFiltered().filter(c => c.day === today).sort((a, b) => a.start.localeCompare(b.start));
            let box = document.getElementById("studentTodayList");

            if (arr.length === 0) {
                box.innerHTML = `<div class="empty-state">📭 No classes today</div>`;
                return;
            }

            box.innerHTML = arr.map(c => `
                <div class="class-item ${c.extra ? "extra" : ""}">
                    <div class="class-time">${to12Hour(c.start)} - ${to12Hour(c.end)}</div>
                    <div class="class-name">${c.name} ${c.extra ? "⭐ EXTRA" : ""}</div>
                    <div class="class-details">👨‍🏫 ${c.teacher} | 🚪 ${c.room} | 📚 ${c.type}</div>
                </div>
            `).join("");
        }

        function renderStudentWeek() {
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            days.forEach(day => {
                let count = studentFiltered().filter(c => c.day === day).length;
                let el = document.getElementById(day.substring(0, 3).toLowerCase() + "Count");
                if (el) el.textContent = `(${count})`;
            });
        }

        function showStudentDay(day) {
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const todayIndex = days.indexOf(today);
            const selectedIndex = days.indexOf(day);

            document.querySelectorAll("#studentWeekTab .day-btn").forEach(btn => btn.classList.remove("active"));
            event.target.classList.add("active");

            const container = document.getElementById("studentDayList");
            const dayClasses = studentFiltered().filter(c => c.day === day).sort((a, b) => a.start.localeCompare(b.start));

            if (selectedIndex < todayIndex) {
                container.innerHTML = '<div class="empty-state">⏰ All classes are over. Wait for next week.</div>';
                return;
            }

            if (dayClasses.length === 0) {
                container.innerHTML = '<div class="empty-state">📭 No classes scheduled on this day.</div>';
            } else {
                container.innerHTML = dayClasses.map(c => `
                    <div class="class-item ${c.extra ? 'extra' : ''}">
                        <div class="class-time">${to12Hour(c.start)} - ${to12Hour(c.end)}</div>
                        <div class="class-name">${c.name} ${c.extra ? '⭐ EXTRA' : ''}</div>
                        <div class="class-details">👨‍🏫 ${c.teacher} | 🚪 ${c.room} | 📚 ${c.type}</div>
                    </div>
                `).join('');
            }
        }

        // TEACHER FUNCTIONS
        function selectTeacherBatch(batch) {
            teacherSelectedBatch = batch;
            document.getElementById("teacherBatchSelect").style.display = "none";
            document.getElementById("teacherBatchHeader").style.display = "block";
            document.getElementById("teacherBatchHeader").textContent = "Batch - " + batch;
            document.getElementById("changeBatchBtn").style.display = "inline-block";
            renderTeacherToday();
        }

        function changeTeacherBatch() {
            teacherSelectedBatch = null;
            document.getElementById("teacherBatchSelect").style.display = "grid";
            document.getElementById("teacherBatchHeader").style.display = "none";
            document.getElementById("changeBatchBtn").style.display = "none";
            document.getElementById("teacherTodayList").innerHTML = "";
            document.getElementById("teacherDayList").innerHTML = "";
        }

        function teacherFiltered() {
            if (!teacherSelectedBatch) return [];
            return classes.filter(c => c.batch === teacherSelectedBatch);
        }

        function switchTeacherTab(tab) {
            if (!teacherSelectedBatch) {
                showNotification("⚠ Please select a batch first!");
                return;
            }

            document.querySelectorAll("#teacherUI .tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll("#teacherUI .tab-content").forEach(c => c.classList.remove("active"));
            event.target.classList.add("active");

            if (tab === "today") {
                document.getElementById("teacherTodayTab").classList.add("active");
                renderTeacherToday();
            } else if (tab === "week") {
                document.getElementById("teacherWeekTab").classList.add("active");
            } else {
                document.getElementById("teacherExtraTab").classList.add("active");
                populateExtraDays();
            }
        }

        function renderTeacherToday() {
            if (!teacherSelectedBatch) return;
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            let arr = teacherFiltered().filter(c => c.day === today).sort((a, b) => a.start.localeCompare(b.start));
            let box = document.getElementById("teacherTodayList");

            if (arr.length === 0) {
                box.innerHTML = `<div class="empty-state">📭 No classes today</div>`;
                return;
            }

            box.innerHTML = arr.map(c => `
                <div class="class-item ${c.extra ? "extra" : ""}">
                    <div class="class-time">${to12Hour(c.start)} - ${to12Hour(c.end)}</div>
                    <div class="class-name">${c.name} ${c.extra ? "⭐ EXTRA" : ""}</div>
                    <div class="class-details">👨‍🏫 ${c.teacher} | 🚪 ${c.room} | 📚 ${c.type}</div>
                </div>
            `).join("");
        }

        function showTeacherDay(day) {
            if (!teacherSelectedBatch) {
                showNotification("⚠ Select a batch first");
                return;
            }

            document.querySelectorAll("#teacherWeekTab .day-btn").forEach(btn => btn.classList.remove("active"));
            event.target.classList.add("active");

            let box = document.getElementById("teacherDayList");
            let arr = teacherFiltered().filter(c => c.day === day).sort((a, b) => a.start.localeCompare(b.start));

            if (arr.length === 0) {
                box.innerHTML = `<div class="empty-state">📭 No classes on ${day}</div>`;
                return;
            }

            box.innerHTML = arr.map(c => `
                <div class="class-item ${c.extra ? "extra" : ""}">
                    <div class="class-time">${to12Hour(c.start)} - ${to12Hour(c.end)}</div>
                    <div class="class-name">${c.name} ${c.extra ? "⭐ EXTRA" : ""}</div>
                    <div class="class-details">👨‍🏫 ${c.teacher} | 🚪 ${c.room} | 📚 ${c.type}</div>
                </div>
            `).join("");
        }

        function populateExtraDays() {
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const todayIndex = days.indexOf(today);

            let select = document.getElementById("extraDay");
            select.innerHTML = `<option value="">Select Day</option>`;

            for (let i = todayIndex + 1; i < days.length; i++) {
                select.innerHTML += `<option value="${days[i]}">${days[i]}</option>`;
            }
        }

        document.getElementById("extraClassForm").addEventListener("submit", e => {
            e.preventDefault();

            if (!teacherSelectedBatch) {
                showNotification("⚠ Select batch first!");
                return;
            }

            const extraClass = {
                id: Date.now(),
                name: document.getElementById("extraName").value,
                day: document.getElementById("extraDay").value,
                start: document.getElementById("extraStart").value,
                end: document.getElementById("extraEnd").value,
                teacher: currentUser.name,
                room: document.getElementById("extraRoom").value,
                type: document.getElementById("extraType").value,
                extra: true,
                batch: teacherSelectedBatch
            };

            classes.push(extraClass);
            saveClasses();
            showNotification("⭐ Extra class added!");
            document.getElementById("extraClassForm").reset();
            renderTeacherToday();
        });

        // ADMIN FUNCTIONS
        function selectAdminBatch(batch) {
            adminSelectedBatch = batch;
            renderAdminDashboard();
            renderClassList();
            showNotification(batch ? ("Showing batch: " + batch) : "Showing ALL batches");
        }

        function adminFiltered() {
            if (!adminSelectedBatch) return classes;
            return classes.filter(c => c.batch === adminSelectedBatch);
        }

        function switchAdminTab(tab) {
            document.querySelectorAll("#adminUI .tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll("#adminUI .tab-content").forEach(c => c.classList.remove("active"));
            event.target.classList.add("active");

            if (tab === "dashboard") {
                document.getElementById("adminDashboardTab").classList.add("active");
                renderAdminDashboard();
            } else {
                document.getElementById("adminDataTab").classList.add("active");
            }
        }

        function renderAdminDashboard() {
            let list = adminFiltered();
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            const todayList = list.filter(c => c.day === today);

            document.getElementById("totalClasses").textContent = list.length;
            document.getElementById("todayClasses").textContent = todayList.length;

            const now = new Date();
            const next = todayList.filter(c => {
                const [h, m] = c.start.split(":").map(Number);
                const t = new Date();
                t.setHours(h, m, 0);
                return t > now;
            }).sort((a, b) => a.start.localeCompare(b.start))[0];

            document.getElementById("nextClass").textContent = next ? to12Hour(next.start) : "--";

            const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const counts = fullDays.map(d => list.filter(c => c.day === d).length);
            const max = Math.max(...counts, 1);

            const chart = document.getElementById("classChart");
            chart.innerHTML = counts.map((count, i) => {
                const height = (count / max) * 100;
                return `
                    <div class="bar" style="height:${height}%">
                        <div class="bar-value">${count}</div>
                        <div class="bar-label">${["Mon","Tue","Wed","Thu","Fri"][i]}</div>
                    </div>
                `;
            }).join("");
        }

        function openModifyModal() {
            document.getElementById("modifyModal").classList.add("show");
            renderClassList();
        }

        function closeModifyModal() {
            document.getElementById("modifyModal").classList.remove("show");
            document.getElementById("addClassForm").style.display = "none";
        }

        function renderClassList() {
            let list = adminFiltered();
            const container = document.getElementById("classList");
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

            const sorted = [...list].sort((a, b) => {
                const diff = days.indexOf(a.day) - days.indexOf(b.day);
                return diff !== 0 ? diff : a.start.localeCompare(b.start);
            });

            container.innerHTML = sorted.map(c => `
                <div class="class-list-item">
                    <div>
                        <strong>${c.name}</strong> — ${c.day} (${to12Hour(c.start)} - ${to12Hour(c.end)})
                        <br><small>${c.teacher} | ${c.room} | Batch: ${c.batch}</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn-small btn-edit" onclick="editClass(${c.id})">Edit</button>
                        <button class="btn-small btn-delete" onclick="deleteClass(${c.id})">Delete</button>
                    </div>
                </div>
            `).join("");
        }

        function showAddClassForm() {
            const form = document.getElementById("addClassForm");
            form.style.display = form.style.display === "none" ? "block" : "none";
        }

        function addNewClass() {
            const obj = {
                id: Date.now(),
                name: document.getElementById("newClassName").value,
                day: document.getElementById("newClassDay").value,
                start: document.getElementById("newClassStart").value,
                end: document.getElementById("newClassEnd").value,
                teacher: document.getElementById("newClassTeacher").value,
                room: document.getElementById("newClassRoom").value,
                type: document.getElementById("newClassType").value,
                extra: false,
                batch: adminSelectedBatch || null
            };

            if (!obj.batch) {
                showNotification("⚠ Please select a batch first!");
                return;
            }

            if (!obj.name || !obj.start || !obj.end || !obj.teacher || !obj.room) {
                showNotification("Fill all fields!");
                return;
            }

            classes.push(obj);
            saveClasses();
            showNotification("Class added!");
            renderClassList();
            renderAdminDashboard();
            document.getElementById("addClassForm").style.display = "none";

            document.getElementById("newClassName").value = "";
            document.getElementById("newClassStart").value = "";
            document.getElementById("newClassEnd").value = "";
            document.getElementById("newClassTeacher").value = "";
            document.getElementById("newClassRoom").value = "";
        }

        function editClass(id) {
            const c = classes.find(x => x.id === id);
            if (!c) return;

            document.getElementById("newClassName").value = c.name;
            document.getElementById("newClassDay").value = c.day;
            document.getElementById("newClassStart").value = c.start;
            document.getElementById("newClassEnd").value = c.end;
            document.getElementById("newClassTeacher").value = c.teacher;
            document.getElementById("newClassRoom").value = c.room;
            document.getElementById("newClassType").value = c.type;

            showNotification("Editing class — batch is locked");
            deleteClass(id);
            document.getElementById("addClassForm").style.display = "block";
        }

        function deleteClass(id) {
            if (!confirm("Delete this class?")) return;
            classes = classes.filter(c => c.id !== id);
            saveClasses();
            renderClassList();
            renderAdminDashboard();
            showNotification("Class deleted");
        }

        function exportData() {
            const data = {
                classes,
                users: JSON.parse(localStorage.getItem("users_v3"))
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "timetable_backup.json";
            a.click();
            showNotification("Data exported successfully!");
        }

        function importData() {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";

            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = event => {
                    try {
                        const data = JSON.parse(event.target.result);

                        let fixed = [];
                        let skipped = 0;

                        (data.classes || []).forEach(cls => {
                            if (!cls.batch) {
                                skipped++;
                            } else {
                                fixed.push(cls);
                            }
                        });

                        classes = fixed;
                        if (data.users) {
                            localStorage.setItem("users_v3", JSON.stringify(data.users));
                        }

                        saveClasses();
                        showNotification(
                            skipped === 0
                                ? "Data imported successfully!"
                                : `Imported with warnings — ${skipped} classes skipped (missing batch)`
                        );

                        renderAdminDashboard();
                        renderClassList();
                    } catch (err) {
                        showNotification("Invalid file!");
                    }
                };

                reader.readAsText(file);
            };

            input.click();
        }

        function resetAllData() {
            if (!confirm("Delete ALL data?")) return;
            localStorage.clear();
            classes = [];
            showNotification("All data cleared");
            setTimeout(() => location.reload(), 1500);
        }

        function checkUpcomingClasses() {
            if (currentRole !== "student" && currentRole !== "teacher") return;

            let userBatch = currentUser.batch || teacherSelectedBatch;
            if (!userBatch) return;

            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
            const now = new Date();

            const list = classes.filter(c => c.day === today && c.batch === userBatch);

            const next = list.find(c => {
                const [h, m] = c.start.split(":");
                const t = new Date();
                t.setHours(h, m, 0);

                let diff = t - now;
                return diff > 0 && diff <= 15 * 60 * 1000;
            });

            const alert = document.getElementById("alertBox");

            if (next) {
                document.getElementById("alertMessage").textContent =
                    `${next.name} starts at ${to12Hour(next.start)} in ${next.room}`;
                alert.classList.add("show");
            } else {
                alert.classList.remove("show");
            }
        }

        function showNotification(message) {
            const notif = document.getElementById("notification");
            notif.textContent = message;
            notif.classList.add("show");
            setTimeout(() => notif.classList.remove("show"), 3000);
        }

        init();