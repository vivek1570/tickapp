// ===== WhatsApp Group Payment Tracker — Firebase Cloud Version =====

(function () {
    'use strict';

    // ===== 🔥 FIREBASE CONFIG =====
    // Config is loaded from firebase-config.js (gitignored — never committed)
    // See firebase-config.example.js for the template
    const firebaseConfig = window.FIREBASE_CONFIG || null;

    // ===== Firebase Init =====
    let db = null;
    let useFirebase = false;
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
            console.log('✅ Firebase connected — data syncs across all devices');
        } else {
            console.log('⚠️ Firebase not configured — using localStorage (data stays on this device only)');
            console.log('   → Copy firebase-config.example.js to firebase-config.js and add your keys');
        }
    } catch (e) {
        console.log('⚠️ Firebase init failed, falling back to localStorage', e);
    }

    // ===== Storage Keys (localStorage fallback) =====
    const KEYS = {
        MEMBERS: 'wt_members',
        PAYMENTS: 'wt_payments',
        SETTINGS: 'wt_settings',
        PIN: 'wt_admin_pin',
        LOG: 'wt_activity_log',
    };

    // ===== State =====
    let state = {
        members: [],
        payments: {},
        settings: { groupName: 'WhatsApp Group', monthlyAmount: 500 },
        log: [],
        currentMonth: new Date(),
        isAdmin: false,
    };

    // ===== Local Storage Helpers =====
    function saveLocal(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function loadLocal(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
    function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function monthKey(d) {
        const dt = d || state.currentMonth;
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    }
    function monthLabel(d) {
        const dt = d || state.currentMonth;
        return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    function isCurrentMonth() {
        const now = new Date();
        return monthKey(now) === monthKey();
    }
    function formatTime(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
            d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // ===== Firebase Persist =====
    async function persistToFirebase() {
        if (!useFirebase) return;
        try {
            await db.collection('appData').doc('members').set({ data: state.members });
            await db.collection('appData').doc('payments').set({ data: state.payments });
            await db.collection('appData').doc('settings').set({ data: state.settings });
            await db.collection('appData').doc('log').set({ data: state.log });
            await db.collection('appData').doc('pin').set({ data: localStorage.getItem(KEYS.PIN) || '' });
        } catch (e) { console.error('Firebase save error:', e); }
    }

    async function loadFromFirebase() {
        if (!useFirebase) return false;
        try {
            const membersDoc = await db.collection('appData').doc('members').get();
            const paymentsDoc = await db.collection('appData').doc('payments').get();
            const settingsDoc = await db.collection('appData').doc('settings').get();
            const logDoc = await db.collection('appData').doc('log').get();
            const pinDoc = await db.collection('appData').doc('pin').get();

            if (membersDoc.exists) state.members = membersDoc.data().data || [];
            if (paymentsDoc.exists) state.payments = paymentsDoc.data().data || {};
            if (settingsDoc.exists) state.settings = settingsDoc.data().data || state.settings;
            if (logDoc.exists) state.log = logDoc.data().data || [];
            if (pinDoc.exists && pinDoc.data().data) localStorage.setItem(KEYS.PIN, pinDoc.data().data);
            return true;
        } catch (e) { console.error('Firebase load error:', e); return false; }
    }

    // ===== Real-time Listener =====
    function setupRealtimeSync() {
        if (!useFirebase) return;
        db.collection('appData').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const id = change.doc.id;
                    const d = change.doc.data().data;
                    if (id === 'members') state.members = d || [];
                    if (id === 'payments') state.payments = d || {};
                    if (id === 'settings') state.settings = d || state.settings;
                    if (id === 'log') state.log = d || [];
                    if (id === 'pin' && d) localStorage.setItem(KEYS.PIN, d);
                    renderAll();
                }
            });
        });
    }

    // ===== Persist (handles both Firebase + localStorage) =====
    function persist() {
        saveLocal(KEYS.MEMBERS, state.members);
        saveLocal(KEYS.PAYMENTS, state.payments);
        saveLocal(KEYS.SETTINGS, state.settings);
        saveLocal(KEYS.LOG, state.log);
        persistToFirebase();
    }

    function loadState() {
        state.members = loadLocal(KEYS.MEMBERS) || [];
        state.payments = loadLocal(KEYS.PAYMENTS) || {};
        state.settings = loadLocal(KEYS.SETTINGS) || { groupName: 'WhatsApp Group', monthlyAmount: 500 };
        state.log = loadLocal(KEYS.LOG) || [];
    }

    // ===== Activity Log =====
    function addLog(type, msg) {
        state.log.unshift({ time: new Date().toISOString(), type, msg });
        if (state.log.length > 500) state.log.length = 500;
        persist();
    }

    // ===== Toast =====
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== Render Stats =====
    function renderStats() {
        const mk = monthKey();
        const monthPayments = state.payments[mk] || {};
        let paidCount = 0, totalCollected = 0;
        state.members.forEach(m => {
            const p = monthPayments[m.id];
            if (p && p.paid) { paidCount++; totalCollected += (p.amount || state.settings.monthlyAmount); }
        });
        document.getElementById('totalMembers').textContent = state.members.length;
        document.getElementById('paidCount').textContent = paidCount;
        document.getElementById('pendingCount').textContent = Math.max(0, state.members.length - paidCount);
        document.getElementById('totalCollected').textContent = `₹${totalCollected.toLocaleString('en-IN')}`;
    }

    // ===== Render Month =====
    function renderMonth() {
        document.getElementById('currentMonthLabel').textContent = monthLabel();
        document.getElementById('monthYearSub').textContent = isCurrentMonth() ? 'Current Month' : '';
    }

    // ===== Render Payment Grid =====
    function renderGrid() {
        const grid = document.getElementById('paymentGrid');
        const empty = document.getElementById('emptyState');
        grid.innerHTML = '';

        if (state.members.length === 0) {
            empty.classList.add('visible');
            return;
        }
        empty.classList.remove('visible');

        const mk = monthKey();
        const monthPayments = state.payments[mk] || {};

        state.members.forEach((member, i) => {
            const p = monthPayments[member.id];
            const isPaid = p && p.paid;
            const paidAmount = p ? p.amount : 0;

            const card = document.createElement('div');
            card.className = `member-card ${isPaid ? 'paid' : 'unpaid'}`;
            card.style.animationDelay = `${i * 0.05}s`;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'member-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'member-name';
            nameEl.textContent = member.name;
            infoDiv.appendChild(nameEl);

            if (member.phone) {
                const phoneEl = document.createElement('div');
                phoneEl.className = 'member-phone';
                phoneEl.textContent = member.phone;
                infoDiv.appendChild(phoneEl);
            }

            const amountEl = document.createElement('div');
            if (isPaid) {
                amountEl.className = 'member-amount paid-amount';
                amountEl.textContent = `✓ Paid ₹${(paidAmount || state.settings.monthlyAmount).toLocaleString('en-IN')}`;
                if (p.paidAt) amountEl.textContent += ` · ${formatTime(p.paidAt)}`;
            } else {
                amountEl.className = 'member-amount';
                amountEl.textContent = `Pending · ₹${state.settings.monthlyAmount.toLocaleString('en-IN')}`;
            }
            infoDiv.appendChild(amountEl);

            const tickBtn = document.createElement('button');
            tickBtn.className = `tick-btn ${isPaid ? 'ticked' : ''} ${!state.isAdmin ? 'disabled' : ''}`;
            tickBtn.title = state.isAdmin ? (isPaid ? 'Mark as unpaid' : 'Mark as paid') : 'Admin access required';
            tickBtn.innerHTML = isPaid
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/></svg>';

            if (state.isAdmin) {
                tickBtn.addEventListener('click', () => togglePayment(member.id, tickBtn));
            }

            card.appendChild(infoDiv);
            card.appendChild(tickBtn);
            grid.appendChild(card);
        });
    }

    // ===== Toggle Payment =====
    function togglePayment(memberId, btn) {
        const mk = monthKey();
        if (!state.payments[mk]) state.payments[mk] = {};
        const current = state.payments[mk][memberId];
        const member = state.members.find(m => m.id === memberId);

        if (current && current.paid) {
            delete state.payments[mk][memberId];
            addLog('payment', `Unmarked payment for "${member.name}" in ${monthLabel()}`);
            showToast(`${member.name} marked as unpaid`, 'info');
        } else {
            const defaultAmt = state.settings.monthlyAmount;
            const input = prompt(`Enter amount paid by ${member.name}:`, defaultAmt);
            if (input === null) return;
            const amount = parseInt(input) || defaultAmt;

            state.payments[mk][memberId] = {
                paid: true,
                amount,
                paidAt: new Date().toISOString(),
                markedBy: 'admin',
            };
            addLog('payment', `Marked "${member.name}" paid ₹${amount} for ${monthLabel()}`);
            showToast(`${member.name} marked as paid ₹${amount}`, 'success');

            btn.classList.add('animate');
            setTimeout(() => btn.classList.remove('animate'), 400);
        }
        persist();
        renderGrid();
        renderStats();
    }

    // ===== Render Group Name =====
    function renderGroupName() {
        document.getElementById('groupNameDisplay').textContent = state.settings.groupName;
    }

    // ===== Render Admin Members List =====
    function renderAdminMembers() {
        const list = document.getElementById('adminMembersList');
        const count = document.getElementById('memberCountAdmin');
        list.innerHTML = '';
        count.textContent = state.members.length;

        if (state.members.length === 0) {
            list.innerHTML = '<p style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:16px">No members added yet.</p>';
            return;
        }

        state.members.forEach(member => {
            const item = document.createElement('div');
            item.className = 'admin-member-item';
            item.innerHTML = `
                <div>
                    <div class="member-name">${member.name}</div>
                    ${member.phone ? `<div class="member-phone">${member.phone}</div>` : ''}
                </div>
            `;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-member-btn';
            removeBtn.title = 'Remove member';
            removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
            removeBtn.addEventListener('click', () => removeMember(member.id));
            item.appendChild(removeBtn);
            list.appendChild(item);
        });
    }

    // ===== Add Member =====
    function addMember() {
        const nameInput = document.getElementById('memberNameInput');
        const phoneInput = document.getElementById('memberPhoneInput');
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        if (!name) { showToast('Please enter a name', 'error'); return; }
        if (state.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            showToast('Member already exists', 'error'); return;
        }
        const member = { id: genId(), name, phone, addedAt: new Date().toISOString() };
        state.members.push(member);
        addLog('member', `Added member "${name}"`);
        persist();
        nameInput.value = '';
        phoneInput.value = '';
        showToast(`${name} added!`, 'success');
        renderAll();
    }

    // ===== Remove Member =====
    function removeMember(id) {
        const member = state.members.find(m => m.id === id);
        if (!member) return;
        if (!confirm(`Remove "${member.name}" from the group?`)) return;
        state.members = state.members.filter(m => m.id !== id);
        addLog('member', `Removed member "${member.name}"`);
        persist();
        showToast(`${member.name} removed`, 'info');
        renderAll();
    }

    // ===== Render All =====
    function renderAll() {
        renderGroupName();
        renderMonth();
        renderGrid();
        renderStats();
        renderAdminMembers();
    }

    // ===== Admin PIN Logic =====
    function hasPin() { return !!localStorage.getItem(KEYS.PIN); }
    function checkPin(pin) { return localStorage.getItem(KEYS.PIN) === pin; }
    function setPin(pin) {
        localStorage.setItem(KEYS.PIN, pin);
        if (useFirebase) {
            db.collection('appData').doc('pin').set({ data: pin });
        }
    }

    function openPinModal() {
        const modal = document.getElementById('pinModal');
        const firstTime = document.getElementById('firstTimeSetup');
        const pinGroup = document.querySelector('.pin-input-group');
        const hint = document.getElementById('pinHint');
        const submitBtn = document.getElementById('pinSubmitBtn');

        hint.textContent = '';

        if (!hasPin()) {
            firstTime.classList.add('visible');
            pinGroup.style.display = 'none';
            submitBtn.textContent = 'Create PIN';
            document.getElementById('newPinInput').value = '';
            document.getElementById('confirmPinInput').value = '';
        } else {
            firstTime.classList.remove('visible');
            pinGroup.style.display = '';
            submitBtn.textContent = 'Unlock';
            document.getElementById('pinInput').value = '';
        }
        modal.classList.add('active');
        setTimeout(() => {
            if (hasPin()) document.getElementById('pinInput').focus();
            else document.getElementById('newPinInput').focus();
        }, 200);
    }

    function closePinModal() { document.getElementById('pinModal').classList.remove('active'); }

    function handlePinSubmit() {
        const hint = document.getElementById('pinHint');
        if (!hasPin()) {
            const newPin = document.getElementById('newPinInput').value;
            const confirmPin = document.getElementById('confirmPinInput').value;
            if (newPin.length < 4) { hint.textContent = 'PIN must be at least 4 digits'; return; }
            if (newPin !== confirmPin) { hint.textContent = 'PINs do not match'; return; }
            setPin(newPin);
            addLog('admin', 'Admin PIN created');
            state.isAdmin = true;
            closePinModal();
            openAdminSidebar();
            showToast('Admin PIN set! You are now in admin mode.', 'success');
            updateAdminUI();
        } else {
            const pin = document.getElementById('pinInput').value;
            if (checkPin(pin)) {
                state.isAdmin = true;
                closePinModal();
                addLog('admin', 'Admin logged in');
                openAdminSidebar();
                showToast('Admin mode activated', 'success');
                updateAdminUI();
            } else {
                hint.textContent = 'Incorrect PIN';
                addLog('access', 'Failed admin login attempt');
            }
        }
    }

    // ===== Admin Sidebar =====
    function openAdminSidebar() {
        document.getElementById('adminSidebar').classList.add('active');
        document.getElementById('adminOverlay').classList.add('active');
        document.getElementById('groupNameInput').value = state.settings.groupName;
        document.getElementById('monthlyAmountInput').value = state.settings.monthlyAmount;
        renderAdminMembers();
    }
    function logoutAdmin() {
        state.isAdmin = false;
        closeAdminSidebar();
        addLog('admin', 'Admin logged out');
        showToast('Logged out of admin mode', 'info');
        updateAdminUI();
    }
    function closeAdminSidebar() {
        document.getElementById('adminSidebar').classList.remove('active');
        document.getElementById('adminOverlay').classList.remove('active');
    }

    function updateAdminUI() {
        const btn = document.getElementById('adminToggleBtn');
        if (state.isAdmin) {
            btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="btn-label">Admin Panel</span>';
        } else {
            btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="btn-label">Admin</span>';
        }
        renderGrid();
    }

    // ===== Save Settings =====
    function saveSettings() {
        const name = document.getElementById('groupNameInput').value.trim();
        const amount = parseInt(document.getElementById('monthlyAmountInput').value) || 0;
        if (!name) { showToast('Group name is required', 'error'); return; }
        state.settings.groupName = name;
        state.settings.monthlyAmount = amount;
        addLog('admin', `Updated settings: name="${name}", amount=₹${amount}`);
        persist();
        renderAll();
        showToast('Settings saved!', 'success');
    }

    // ===== Export =====
    function exportData() {
        const data = { members: state.members, payments: state.payments, settings: state.settings, log: state.log, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-tracker-${monthKey()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('admin', 'Data exported');
        showToast('Data exported!', 'success');
    }

    // ===== Import =====
    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.members) state.members = data.members;
                if (data.payments) state.payments = data.payments;
                if (data.settings) state.settings = data.settings;
                if (data.log) state.log = data.log;
                persist();
                addLog('admin', 'Data imported');
                renderAll();
                showToast('Data imported successfully!', 'success');
            } catch {
                showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ===== Activity Log Modal =====
    function openLogModal() {
        document.getElementById('logModal').classList.add('active');
        renderLog('all');
        addLog('access', 'Viewed activity log');
    }
    function closeLogModal() { document.getElementById('logModal').classList.remove('active'); }

    function renderLog(filter) {
        const list = document.getElementById('logList');
        list.innerHTML = '';
        const filtered = filter === 'all' ? state.log : state.log.filter(l => l.type === filter);
        if (filtered.length === 0) {
            list.innerHTML = '<div class="log-empty">No activity recorded yet.</div>';
            return;
        }
        filtered.slice(0, 100).forEach(entry => {
            const item = document.createElement('div');
            item.className = 'log-item';
            item.innerHTML = `
                <div class="log-time">${formatTime(entry.time)} <span class="log-type ${entry.type}">${entry.type}</span></div>
                <div class="log-msg">${entry.msg}</div>
            `;
            list.appendChild(item);
        });
    }

    // ===== Change PIN =====
    function changePin() {
        const oldPin = document.getElementById('oldPinInput').value;
        const newPin = document.getElementById('newAdminPin').value;
        if (!checkPin(oldPin)) { showToast('Current PIN is incorrect', 'error'); return; }
        if (newPin.length < 4) { showToast('New PIN must be at least 4 digits', 'error'); return; }
        setPin(newPin);
        addLog('admin', 'Admin PIN changed');
        document.getElementById('oldPinInput').value = '';
        document.getElementById('newAdminPin').value = '';
        showToast('PIN changed successfully!', 'success');
    }

    // ===== Background Particles =====
    function createParticles() {
        const container = document.getElementById('bgParticles');
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 200 + 80;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.animationDuration = (15 + Math.random() * 15) + 's';
            container.appendChild(p);
        }
    }

    // ===== Event Bindings =====
    function bindEvents() {
        // Admin toggle
        document.getElementById('adminToggleBtn').addEventListener('click', () => {
            if (state.isAdmin) {
                openAdminSidebar();
            } else {
                openPinModal();
            }
        });

        // PIN modal
        document.getElementById('pinModalClose').addEventListener('click', closePinModal);
        document.getElementById('pinCancelBtn').addEventListener('click', closePinModal);
        document.getElementById('pinSubmitBtn').addEventListener('click', handlePinSubmit);
        document.getElementById('pinInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') handlePinSubmit(); });
        document.getElementById('confirmPinInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') handlePinSubmit(); });

        // Admin sidebar
        document.getElementById('closeAdmin').addEventListener('click', closeAdminSidebar);
        document.getElementById('adminOverlay').addEventListener('click', closeAdminSidebar);

        // Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

        // Add member
        document.getElementById('addMemberBtn').addEventListener('click', addMember);
        document.getElementById('memberNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addMember(); });

        // Month navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
            renderAll();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
            renderAll();
        });

        // Export / Import
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            if (e.target.files[0]) importData(e.target.files[0]);
        });

        // Reset
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            if (!confirm('⚠️ This will delete ALL data. Are you sure?')) return;
            if (!confirm('This action CANNOT be undone. Type "RESET" to confirm.')) return;
            localStorage.removeItem(KEYS.MEMBERS);
            localStorage.removeItem(KEYS.PAYMENTS);
            localStorage.removeItem(KEYS.SETTINGS);
            localStorage.removeItem(KEYS.LOG);
            localStorage.removeItem(KEYS.PIN);
            state.members = [];
            state.payments = {};
            state.settings = { groupName: 'WhatsApp Group', monthlyAmount: 500 };
            state.log = [];
            state.isAdmin = false;
            persist();
            closeAdminSidebar();
            updateAdminUI();
            renderAll();
            showToast('All data has been reset', 'info');
        });

        // Change PIN
        document.getElementById('changePinBtn').addEventListener('click', changePin);
        document.getElementById('logoutAdminBtn').addEventListener('click', logoutAdmin);

        // Activity Log
        document.getElementById('activityLogBtn').addEventListener('click', openLogModal);
        document.getElementById('logModalClose').addEventListener('click', closeLogModal);
        document.getElementById('logModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('logModal')) closeLogModal();
        });
        document.getElementById('pinModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('pinModal')) closePinModal();
        });

        // Log filters
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                renderLog(chip.dataset.filter);
            });
        });
    }

    // ===== Init =====
    async function init() {
        loadState();
        createParticles();
        bindEvents();

        // Try loading from Firebase (cloud data takes priority)
        if (useFirebase) {
            const loaded = await loadFromFirebase();
            if (loaded) console.log('📦 Data loaded from Firebase');
            setupRealtimeSync();
        }

        addLog('access', 'App opened');
        persist();
        renderAll();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
