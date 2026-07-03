// ===== Payment Dashboard — Total Summary per Member =====

(function () {
    'use strict';

    // ===== Firebase Config =====
    const firebaseConfig = window.FIREBASE_CONFIG || null;

    let db = null;
    let useFirebase = false;
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
        }
    } catch (e) {
        console.log('Firebase init failed:', e);
    }

    // ===== Storage Keys =====
    const KEYS = {
        MEMBERS: 'wt_members',
        PAYMENTS: 'wt_payments',
        SETTINGS: 'wt_settings',
    };

    // ===== State =====
    let state = {
        members: [],
        payments: {},
        settings: { groupName: 'WhatsApp Group', monthlyAmount: 500 },
    };

    // ===== Helpers =====
    function loadLocal(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }

    function monthKey(d) {
        const dt = d || new Date();
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    }

    // Get current month key
    function currentMonthKey() {
        return monthKey(new Date());
    }

    // Check if a member is active in a given month
    function isMemberActive(member, mk) {
        if (!member.startMonth && !member.endMonth) return true;
        if (member.startMonth && mk < member.startMonth) return false;
        if (member.endMonth && mk > member.endMonth) return false;
        return true;
    }

    // Get all month keys a member is active for (from startMonth to endMonth or current month)
    function getActiveMonths(member) {
        const now = currentMonthKey();

        // If no range set, find the earliest payment month for this member
        // or use their addedAt date as start
        let start = member.startMonth;
        let end = member.endMonth;

        if (!start) {
            // Use the member's addedAt date as start
            if (member.addedAt) {
                const d = new Date(member.addedAt);
                start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else {
                start = now;
            }
        }

        if (!end) {
            end = now; // up to current month
        }

        // If end is in the future, cap at current month for calculation
        if (end > now) end = now;

        // Generate all months from start to end
        const months = [];
        const [startYear, startMon] = start.split('-').map(Number);
        const [endYear, endMon] = end.split('-').map(Number);

        let year = startYear;
        let mon = startMon;

        while (year < endYear || (year === endYear && mon <= endMon)) {
            months.push(`${year}-${String(mon).padStart(2, '0')}`);
            mon++;
            if (mon > 12) { mon = 1; year++; }
        }

        return months;
    }

    // Calculate per-member payment summary
    function calculateMemberSummary(member) {
        const activeMonths = getActiveMonths(member);
        const monthlyAmount = state.settings.monthlyAmount;
        // const totalExpected = activeMonths.length * monthlyAmount;
        const totalExpected = 5000;

        let totalPaid = 0;
        let paidMonths = 0;

        activeMonths.forEach(mk => {
            const monthPayments = state.payments[mk];
            if (monthPayments && monthPayments[member.id] && monthPayments[member.id].paid) {
                totalPaid += (monthPayments[member.id].amount || monthlyAmount);
                paidMonths++;
            }
        });

        const pending = Math.max(0, totalExpected - totalPaid);
        const percent = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

        return {
            member,
            activeMonthCount: activeMonths.length,
            totalExpected,
            totalPaid,
            pending,
            percent,
            paidMonths,
        };
    }

    // ===== Load Data =====
    function loadState() {
        state.members = loadLocal(KEYS.MEMBERS) || [];
        state.payments = loadLocal(KEYS.PAYMENTS) || {};
        state.settings = loadLocal(KEYS.SETTINGS) || { groupName: 'WhatsApp Group', monthlyAmount: 500 };
    }

    async function loadFromFirebase() {
        if (!useFirebase) return false;
        try {
            const membersDoc = await db.collection('appData').doc('members').get();
            const paymentsDoc = await db.collection('appData').doc('payments').get();
            const settingsDoc = await db.collection('appData').doc('settings').get();

            if (membersDoc.exists) state.members = membersDoc.data().data || [];
            if (paymentsDoc.exists) state.payments = paymentsDoc.data().data || {};
            if (settingsDoc.exists) state.settings = settingsDoc.data().data || state.settings;
            return true;
        } catch (e) { console.error('Firebase load error:', e); return false; }
    }

    // ===== Background Particles =====
    function createParticles() {
        const container = document.getElementById('bgParticles');
        for (let i = 0; i < 8; i++) {
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

    // ===== Render Dashboard =====
    function renderDashboard() {
        const loading = document.getElementById('dashboardLoading');
        const content = document.getElementById('dashboardContent');
        const tbody = document.getElementById('dashboardTableBody');
        const tfoot = document.getElementById('dashboardTableFoot');
        const emptyEl = document.getElementById('dashboardEmpty');

        // Update group name
        document.getElementById('groupNameDisplay').textContent = state.settings.groupName;

        if (state.members.length === 0) {
            loading.style.display = 'none';
            content.style.display = 'block';
            tbody.innerHTML = '';
            tfoot.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        // Calculate summaries
        // const summaries = state.members.map(m => calculateMemberSummary(m));
        const summaries = state.members
            .map(m => calculateMemberSummary(m))
            .sort((a, b) => b.totalPaid - a.totalPaid);
        // console.log(summaries)

        // Sort: most pending first
        // summaries.sort((a, b) => b.pending - a.pending);

        // Grand totals
        let grandExpected = 0, grandPaid = 0, grandPending = 0;
        summaries.forEach(s => {
            grandExpected += s.totalExpected;
            grandPaid += s.totalPaid;
            grandPending += s.pending;
        });
        const grandPercent = grandExpected > 0 ? Math.round((grandPaid / grandExpected) * 100) : 0;

        // Update summary cards
        document.getElementById('summaryTotalMembers').textContent = state.members.length;
        document.getElementById('summaryTotalPaid').textContent = `₹${grandPaid.toLocaleString('en-IN')}`;
        document.getElementById('summaryTotalPending').textContent = `₹${grandPending.toLocaleString('en-IN')}`;
        document.getElementById('summaryOverallPercent').textContent = `${grandPercent}%`;
        document.getElementById('tableCount').textContent = `${state.members.length} members`;

        // Render table rows
        tbody.innerHTML = '';
        summaries.forEach((s, i) => {
            const tr = document.createElement('tr');

            // Progress bar class
            let barClass = 'low';
            if (s.percent >= 100) barClass = 'full';
            else if (s.percent >= 60) barClass = 'high';
            else if (s.percent >= 30) barClass = 'mid';

            // Status
            let statusClass = 'none', statusText = 'No Payment';
            if (s.percent >= 100) { statusClass = 'complete'; statusText = '✓ Complete'; }
            else if (s.percent > 0) { statusClass = 'partial'; statusText = 'Partial'; }

            // Date range display
            let dateRange = '';
            if (s.member.startMonth || s.member.endMonth) {
                const from = s.member.startMonth || '—';
                const to = s.member.endMonth || 'ongoing';
                dateRange = `<div class="member-dates-cell">📅 ${from} → ${to}</div>`;
            }

            tr.innerHTML = `
                <td data-label="#">${i + 1}</td>
                <td data-label="Member">
                    <div class="member-name-cell">${s.member.name}</div>
                    ${s.member.phone ? `<div class="member-phone-cell">${s.member.phone}</div>` : ''}
                    ${dateRange}
                </td>
                <td data-label="Active Months">${s.activeMonthCount}</td>
                <td data-label="Expected" class="amount-total">₹${s.totalExpected.toLocaleString('en-IN')}</td>
                <td data-label="Paid" class="amount-paid">₹${s.totalPaid.toLocaleString('en-IN')}</td>
                <td data-label="Pending" class="amount-pending">₹${s.pending.toLocaleString('en-IN')}</td>
                <td data-label="Progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${barClass}" style="width:${s.percent}%"></div>
                    </div>
                    <div class="progress-text">${s.percent}% · ${s.paidMonths}/${s.activeMonthCount} months</div>
                </td>
                <td data-label="Status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Totals row
        tfoot.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:right;color:var(--text-secondary);">TOTAL</td>
                <td class="amount-total">₹${grandExpected.toLocaleString('en-IN')}</td>
                <td class="amount-paid">₹${grandPaid.toLocaleString('en-IN')}</td>
                <td class="amount-pending">₹${grandPending.toLocaleString('en-IN')}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${grandPercent >= 100 ? 'full' : grandPercent >= 60 ? 'high' : grandPercent >= 30 ? 'mid' : 'low'}" style="width:${grandPercent}%"></div>
                    </div>
                    <div class="progress-text">${grandPercent}%</div>
                </td>
                <td></td>
            </tr>
        `;

        // Show content
        loading.style.display = 'none';
        content.style.display = 'block';
        emptyEl.style.display = 'none';
    }

    // ===== Init =====
    async function init() {
        loadState();
        createParticles();

        if (useFirebase) {
            await loadFromFirebase();
        }

        renderDashboard();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
