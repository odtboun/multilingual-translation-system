/**
 * Aviation Translation System — Debug Console Client
 */

const API = '';  // Same origin

// ============================================================
// State
// ============================================================
let convSessionId = 'conv-' + Date.now();

// ============================================================
// Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTranslate();
    initBatch();
    initCompare();
    initGlossary();
    initConversation();
    checkHealth();
});

// ============================================================
// Health Check
// ============================================================
async function checkHealth() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    try {
        const res = await fetch(`${API}/api/debug/health`);
        const data = await res.json();
        dot.className = 'status-dot connected';
        text.textContent = `${data.glossary_terms} terms loaded · ${data.default_model}`;
    } catch (e) {
        dot.className = 'status-dot error';
        text.textContent = 'Disconnected';
    }
}

// ============================================================
// Tabs
// ============================================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
}

// ============================================================
// Single Translation
// ============================================================
function initTranslate() {
    const btn = document.getElementById('translateBtn');
    const swap = document.getElementById('swapLangs');

    btn.addEventListener('click', doTranslate);
    swap.addEventListener('click', () => {
        const src = document.getElementById('sourceLang');
        const tgt = document.getElementById('targetLang');
        const tmp = src.value;
        src.value = tgt.value;
        tgt.value = tmp;
    });

    // Ctrl+Enter shortcut
    document.getElementById('sourceText').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
    });
}

async function doTranslate() {
    const btn = document.getElementById('translateBtn');
    const text = document.getElementById('sourceText').value.trim();
    if (!text) return;

    setLoading(btn, true);

    const body = {
        text,
        source_lang: document.getElementById('sourceLang').value,
        target_lang: document.getElementById('targetLang').value,
        context: {
            touchpoint: document.getElementById('touchpoint').value,
            flight: {
                flight: document.getElementById('flightNum').value || null,
                gate: document.getElementById('gateNum').value || null,
                destination: document.getElementById('destination').value || null,
            }
        }
    };

    try {
        const res = await fetch(`${API}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        showTranslateResult(data);
    } catch (e) {
        document.getElementById('resultBox').innerHTML =
            `<p style="color:var(--error)">Error: ${e.message}</p>`;
    } finally {
        setLoading(btn, false);
    }
}

function showTranslateResult(data) {
    // Main result
    document.getElementById('resultBox').innerHTML =
        `<div class="translation-text">${escapeHtml(data.translation)}</div>`;

    // Metadata
    const grid = document.getElementById('metaGrid');
    grid.style.display = 'grid';
    document.getElementById('metaLatency').textContent = `${data.latency_ms}ms`;
    document.getElementById('metaModel').textContent = data.model_used.split('/').pop();
    document.getElementById('metaTerms').textContent = data.glossary_terms_injected;
    document.getElementById('metaGuard').textContent = data.guard_corrections.length;

    // Corrections
    const cp = document.getElementById('correctionsPanel');
    if (data.guard_corrections.length > 0) {
        cp.style.display = 'block';
        document.getElementById('correctionsList').innerHTML = data.guard_corrections.map(c =>
            `<div class="correction-item">
                <span class="correction-old">${escapeHtml(c.original)}</span>
                <span class="correction-arrow">→</span>
                <span class="correction-new">${escapeHtml(c.corrected)}</span>
                <span class="correction-reason">${escapeHtml(c.reason)}</span>
            </div>`
        ).join('');
    } else {
        cp.style.display = 'none';
    }

    // Raw output
    const rp = document.getElementById('rawPanel');
    if (data.raw_translation !== data.translation) {
        rp.style.display = 'block';
        document.getElementById('rawOutput').textContent = data.raw_translation;
    } else {
        rp.style.display = 'none';
    }

    // Notes
    const np = document.getElementById('notesPanel');
    if (data.notes && data.notes.length > 0) {
        if (!np) {
            const html = `<div class="panel" id="notesPanel">
                <div class="panel-header">Contextual Notes</div>
                <div id="notesOutput" style="color:var(--text-secondary);font-size:13px;line-height:1.5;"></div>
            </div>`;
            document.getElementById('resultBox').insertAdjacentHTML('afterend', html);
        }
        document.getElementById('notesPanel').style.display = 'block';
        document.getElementById('notesOutput').innerHTML = data.notes.map(n => `<div>• ${escapeHtml(n)}</div>`).join('');
    } else if (np) {
        np.style.display = 'none';
    }
}

// ============================================================
// Batch Testing
// ============================================================
const PRESETS = {
    boarding: [
        { text: "15 ile 25. sıralar arasındaki yolcular biniş yapabilir", expected_contains: ["boarding", "rows", "15", "25"], expected_not_contains: ["boarding card"], context: { touchpoint: "BOARDING" } },
        { text: "Biniş kartınızı hazırlayın lütfen", expected_contains: ["boarding pass"], expected_not_contains: ["boarding card", "boarding ticket"], context: { touchpoint: "BOARDING" } },
        { text: "Son çağrı, kapı kapanıyor", expected_contains: ["final call"], expected_not_contains: ["last call"], context: { touchpoint: "BOARDING" } },
        { text: "Öncelikli biniş yolcuları lütfen", expected_contains: ["priority boarding"], expected_not_contains: ["early boarding"], context: { touchpoint: "BOARDING" } },
        { text: "TK1234 sefer sayılı Londra uçağımız için biniş başlamıştır", expected_contains: ["boarding", "TK1234", "London"], context: { touchpoint: "BOARDING" } },
    ],
    checkin: [
        { text: "Pasaportunuzu ve biniş kartınızı görebilir miyim", expected_contains: ["passport", "boarding pass"], expected_not_contains: ["boarding card"], context: { touchpoint: "CHECK_IN" } },
        { text: "Pencere kenarı mı koridor kenarı mı tercih edersiniz", expected_contains: ["window", "aisle"], context: { touchpoint: "CHECK_IN" } },
        { text: "Fazla bagajınız var, ek ücret ödemeniz gerekiyor", expected_contains: ["excess baggage"], expected_not_contains: ["extra luggage"], context: { touchpoint: "CHECK_IN" } },
    ],
    security: [
        { text: "Lütfen elektronik cihazlarınızı tepsiye koyun", expected_contains: ["electronic device", "tray"], expected_not_contains: ["gadget", "bin"], context: { touchpoint: "SECURITY" } },
        { text: "Kemerinizi çıkarın lütfen", expected_contains: ["belt"], context: { touchpoint: "SECURITY" } },
        { text: "Sıvılarınızı ayrı bir poşete koyun", expected_contains: ["liquids"], expected_not_contains: ["fluids"], context: { touchpoint: "SECURITY" } },
    ],
    irregular: [
        { text: "Uçuşunuz iptal edilmiştir, lütfen aktarma masasına gidin", expected_contains: ["cancellation", "transfer desk"], expected_not_contains: ["cancelled flight"], context: { touchpoint: "IRREGULAR" } },
        { text: "Rötar sebebiyle yemek kuponu verilecektir", expected_contains: ["delay", "meal voucher"], expected_not_contains: ["late", "food coupon"], context: { touchpoint: "IRREGULAR" } },
    ],
};

function initBatch() {
    document.getElementById('batchRunBtn').addEventListener('click', runBatch);
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
    });
}

function loadPreset(name) {
    let items;
    if (name === 'all') {
        items = [].concat(...Object.values(PRESETS));
    } else {
        items = PRESETS[name] || [];
    }
    document.getElementById('batchInput').value = JSON.stringify(items, null, 2);
}

async function runBatch() {
    const btn = document.getElementById('batchRunBtn');
    const input = document.getElementById('batchInput').value.trim();
    if (!input) return;

    let items;
    try {
        items = JSON.parse(input);
    } catch (e) {
        alert('Invalid JSON: ' + e.message);
        return;
    }

    setLoading(btn, true);

    try {
        const res = await fetch(`${API}/api/debug/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
        });
        const data = await res.json();

        // Summary
        const summary = document.getElementById('batchSummary');
        summary.style.display = 'flex';
        summary.innerHTML = `
            <span>Total: ${data.total}</span>
            <span class="batch-pass">✓ Passed: ${data.passed}</span>
            <span class="batch-fail">✗ Failed: ${data.failed}</span>
            <span>Rate: ${data.pass_rate}</span>
        `;

        // Results
        document.getElementById('batchResults').innerHTML = data.results.map(r =>
            `<div class="batch-result-item ${r.passed ? 'passed' : 'failed'}">
                <div class="batch-input-text">→ ${escapeHtml(r.input)}</div>
                <div class="batch-output-text">${escapeHtml(r.translation)}</div>
                ${r.failure_reasons.length ? r.failure_reasons.map(f =>
                    `<div class="batch-failure-reason">✗ ${escapeHtml(f)}</div>`
                ).join('') : ''}
                ${r.guard_corrections.length ? `<div class="batch-meta">Guard: ${r.guard_corrections.map(c =>
                    `${c.original} → ${c.corrected}`
                ).join(', ')}</div>` : ''}
                <div class="batch-meta">${r.latency_ms}ms · ${r.model_used.split('/').pop()} · ${r.glossary_terms_injected} terms</div>
            </div>`
        ).join('');
    } catch (e) {
        document.getElementById('batchResults').innerHTML =
            `<p style="color:var(--error)">Error: ${e.message}</p>`;
    } finally {
        setLoading(btn, false);
    }
}

// ============================================================
// Context Comparison
// ============================================================
function initCompare() {
    document.getElementById('compareBtn').addEventListener('click', doCompare);
}

async function doCompare() {
    const btn = document.getElementById('compareBtn');
    const text = document.getElementById('compareText').value.trim();
    if (!text) return;

    setLoading(btn, true);

    try {
        const res = await fetch(`${API}/api/debug/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                touchpoints: ['CHECK_IN', 'SECURITY', 'BOARDING', 'TRANSFER', 'BAGGAGE', 'GATE'],
            }),
        });
        const data = await res.json();

        document.getElementById('compareResults').innerHTML = `
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Touchpoint</th>
                        <th>Translation</th>
                        <th>Latency</th>
                        <th>Corrections</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.comparisons.map(c => `
                        <tr>
                            <td class="touchpoint-cell">${c.touchpoint}</td>
                            <td>${escapeHtml(c.translation)}</td>
                            <td>${c.latency_ms}ms</td>
                            <td>${c.guard_corrections.length || '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('compareResults').innerHTML =
            `<p style="color:var(--error)">Error: ${e.message}</p>`;
    } finally {
        setLoading(btn, false);
    }
}

// ============================================================
// Glossary Browser
// ============================================================
function initGlossary() {
    loadGlossary();
    document.getElementById('glossarySearch').addEventListener('input', debounce(filterGlossary, 200));
    document.getElementById('glossaryFilter').addEventListener('change', filterGlossary);
}

let allGlossaryTerms = [];

async function loadGlossary() {
    try {
        const [termsRes, statsRes] = await Promise.all([
            fetch(`${API}/api/glossary/all`),
            fetch(`${API}/api/glossary/stats`),
        ]);
        const termsData = await termsRes.json();
        const statsData = await statsRes.json();

        allGlossaryTerms = termsData.terms;

        // Stats
        document.getElementById('glossaryStats').innerHTML = `
            <span class="glossary-stat"><span class="dot critical"></span>Critical: ${statsData.by_priority.CRITICAL || 0}</span>
            <span class="glossary-stat"><span class="dot high"></span>High: ${statsData.by_priority.HIGH || 0}</span>
            <span class="glossary-stat"><span class="dot medium"></span>Medium: ${statsData.by_priority.MEDIUM || 0}</span>
            <span>Total: ${statsData.total_terms} · Forbidden alts: ${statsData.total_forbidden_alternatives}</span>
        `;

        renderGlossary(allGlossaryTerms);
    } catch (e) {
        document.getElementById('glossaryTable').innerHTML =
            `<p style="color:var(--error)">Failed to load glossary: ${e.message}</p>`;
    }
}

function filterGlossary() {
    const query = document.getElementById('glossarySearch').value.toLowerCase();
    const context = document.getElementById('glossaryFilter').value;

    let filtered = allGlossaryTerms;

    if (query) {
        filtered = filtered.filter(t =>
            t.term_tr.toLowerCase().includes(query) ||
            t.term_en.toLowerCase().includes(query) ||
            t.id.toLowerCase().includes(query) ||
            (t.category || '').toLowerCase().includes(query)
        );
    }

    if (context) {
        filtered = filtered.filter(t => t.context_tags.includes(context));
    }

    renderGlossary(filtered);
}

function renderGlossary(terms) {
    const header = `
        <div class="glossary-term-row header">
            <span>ID</span>
            <span>Turkish</span>
            <span>English</span>
            <span>Context</span>
            <span>Priority</span>
        </div>
    `;

    const rows = terms.map(t => `
        <div class="glossary-term-row">
            <span class="glossary-id">${t.id}</span>
            <span class="glossary-tr">${escapeHtml(t.term_tr)}</span>
            <span class="glossary-en">${escapeHtml(t.term_en)}</span>
            <span class="glossary-context">${t.context_tags.join(', ')}</span>
            <span><span class="priority-badge ${t.priority}">${t.priority}</span></span>
        </div>
    `).join('');

    document.getElementById('glossaryTable').innerHTML = header + rows;
}

// ============================================================
// Conversation
// ============================================================
function initConversation() {
    document.getElementById('convSendBtn').addEventListener('click', sendConvMessage);
    document.getElementById('convResetBtn').addEventListener('click', resetConversation);
    document.getElementById('convInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendConvMessage();
    });
}

async function sendConvMessage() {
    const input = document.getElementById('convInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addConvMessage(text, null, 'agent');

    const body = {
        text,
        source_lang: 'tr',
        target_lang: 'en',
        context: {
            touchpoint: document.getElementById('convTouchpoint').value,
            flight: {
                flight: document.getElementById('convFlight').value || null,
            },
            session_id: convSessionId,
        }
    };

    try {
        const res = await fetch(`${API}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        addConvMessage(text, data, 'system');
    } catch (e) {
        addConvMessage(text, { translation: 'Error: ' + e.message, latency_ms: 0, guard_corrections: [] }, 'system');
    }
}

function addConvMessage(source, data, type) {
    const log = document.getElementById('convLog');
    const div = document.createElement('div');
    div.className = `conv-message ${type}`;

    if (type === 'agent') {
        div.innerHTML = `<div class="conv-source">${escapeHtml(source)}</div>`;
    } else if (data) {
        div.innerHTML = `
            <div class="conv-translation">${escapeHtml(data.translation)}</div>
            <div class="conv-meta">${data.latency_ms}ms · ${data.guard_corrections.length} corrections</div>
        `;
    }

    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function resetConversation() {
    convSessionId = 'conv-' + Date.now();
    document.getElementById('convLog').innerHTML = '';
}

// ============================================================
// Utilities
// ============================================================
function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.querySelector('.btn-text').style.display = loading ? 'none' : '';
    btn.querySelector('.btn-loading').style.display = loading ? '' : 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
