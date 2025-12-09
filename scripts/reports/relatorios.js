// ==========================================
// MÓDULO DE RELATÓRIOS - TOP SERVICE
// ==========================================

function formatDateTimeISO_short(iso) {
    try {
        var d = new Date(iso);
        return d.toLocaleString('pt-BR');
    } catch (e) {
        return iso;
    }
}

function filterPunchesByRange(startISO, endISO, employeeId) {
    var punches = typeof loadPunches === 'function' ? loadPunches() : [];
    if (!punches || punches.length === 0) return [];

    var start = startISO ? new Date(startISO + 'T00:00:00') : null;
    var end = endISO ? new Date(endISO + 'T23:59:59') : null;

    return punches.filter(function(p){
        var t = new Date(p.timestamp);
        if (start && t < start) return false;
        if (end && t > end) return false;
        if (employeeId && parseInt(employeeId,10) > 0) {
            return parseInt(p.employeeId,10) === parseInt(employeeId,10);
        }
        return true;
    });
}

function aggregatePunches(punches) {
    var total = punches.length;
    var entries = punches.filter(p => p.type === 'Entrada').length;
    var exits = punches.filter(p => p.type === 'Saída').length;

    var byEmployee = {};
    punches.forEach(function(p){
        var id = p.employeeId;
        if (!byEmployee[id]) byEmployee[id] = { count:0, entries:0, exits:0 };
        byEmployee[id].count++;
        if (p.type === 'Entrada') byEmployee[id].entries++;
        if (p.type === 'Saída') byEmployee[id].exits++;
    });

    return { total, entries, exits, byEmployee };
}

function renderReportTable(punches) {
    var tbody = document.getElementById('report-list-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!punches || punches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#666;">Nenhum registro encontrado para o período.</td></tr>';
        return;
    }

    punches.slice().reverse().forEach(function(p){
        var name = p.employeeId;
        if (typeof getEmployeeById === 'function') {
            var emp = getEmployeeById(p.employeeId);
            if (emp) name = emp.matricula + ' - ' + emp.nome;
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="padding:8px;border:1px solid #e6e6e6;">' + name + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + p.type + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + formatDateTimeISO_short(p.timestamp) + '</td>';
        tbody.appendChild(tr);
    });
}

function populateReportEmployeeSelect() {
    var sel = document.getElementById('report-employee-select');
    if (!sel) return;
    if (typeof getEmployees !== 'function') return;
    var emps = getEmployees();
    var opts = ['<option value="0">Todos</option>'];
    emps.forEach(function(e){ opts.push('<option value="' + e.id + '">' + e.matricula + ' - ' + e.nome + '</option>'); });
    sel.innerHTML = opts.join('');
}

function generateReport() {
    const startEl = document.getElementById('report-start');
    const endEl = document.getElementById('report-end');
    const empEl = document.getElementById('report-employee-select');
    
    // Se algum elemento não existir, ignorar
    if (!startEl || !endEl || !empEl) {
        console.warn('[RELATORIO] Elementos do relatório não encontrados');
        return;
    }
    
    var start = startEl.value;
    var end = endEl.value;
    var emp = empEl.value;

    var punches = filterPunchesByRange(start, end, emp);
    var agg = aggregatePunches(punches);

    var totalEl = document.getElementById('report-total');
    var entriesEl = document.getElementById('report-entries');
    var exitsEl = document.getElementById('report-exits');

    if (totalEl) totalEl.textContent = agg.total;
    if (entriesEl) entriesEl.textContent = agg.entries;
    if (exitsEl) exitsEl.textContent = agg.exits;

    renderReportTable(punches);
}

function exportReportCSV() {
    var start = document.getElementById('report-start').value;
    var end = document.getElementById('report-end').value;
    var emp = document.getElementById('report-employee-select').value;

    var punches = filterPunchesByRange(start, end, emp);
    if (!punches || punches.length === 0) {
        showToast('Nenhum registro para exportar.', 'warning');
        return;
    }

    var rows = [['Funcionário','Tipo','Horário']];
    punches.forEach(function(p){
        var name = p.employeeId;
        if (typeof getEmployeeById === 'function') {
            var e = getEmployeeById(p.employeeId);
            if (e) name = e.matricula + ' - ' + e.nome;
        }
        rows.push([name, p.type, formatDateTimeISO_short(p.timestamp)]);
    });

    var csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var fileName = 'relatorio_ponto_' + (start || 'all') + '_' + (end || 'all') + '.csv';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
        URL.revokeObjectURL(url);
        a.remove();
    }, 1000);
    showToast('Relatório exportado com sucesso!', 'success');
}

function initReportModule() {
    console.log('[RELATORIO] initReportModule iniciado');
    
    // Verificar se os elementos existem
    const reportStartEl = document.getElementById('report-start');
    const reportEndEl = document.getElementById('report-end');
    const reportEmployeeSelectEl = document.getElementById('report-employee-select');
    const reportGenerateBtnEl = document.getElementById('report-generate-btn');
    const reportExportBtnEl = document.getElementById('report-export-btn');
    
    if (!reportStartEl || !reportEndEl || !reportEmployeeSelectEl) {
        console.warn('[RELATORIO] Elementos do relatório não encontrados. Módulo pode estar em outra página.');
        return;
    }
    
    populateReportEmployeeSelect();
    if (reportGenerateBtnEl) reportGenerateBtnEl.addEventListener('click', generateReport);
    if (reportExportBtnEl) reportExportBtnEl.addEventListener('click', exportReportCSV);
    
    var qToday = document.getElementById('quick-today');
    var q7 = document.getElementById('quick-7days');
    var qMonth = document.getElementById('quick-month');
    if (qToday) qToday.addEventListener('click', function(){ setQuickRange('today'); });
    if (q7) q7.addEventListener('click', function(){ setQuickRange('7days'); });
    if (qMonth) qMonth.addEventListener('click', function(){ setQuickRange('month'); });

    // quick auto-generate for today's date range
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth()+1).padStart(2,'0');
    var dd = String(today.getDate()).padStart(2,'0');
    var startInput = document.getElementById('report-start');
    var endInput = document.getElementById('report-end');
    if (startInput && endInput) {
        startInput.value = yyyy + '-' + mm + '-' + dd;
        endInput.value = yyyy + '-' + mm + '-' + dd;
    }

    // generate initial report
    generateReport();
}

function setQuickRange(kind) {
    var today = new Date();
    var start = new Date(today);
    if (kind === 'today') {
        // start = today
    } else if (kind === '7days') {
        start.setDate(today.getDate() - 6);
    } else if (kind === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    var yyyy = start.getFullYear();
    var mm = String(start.getMonth()+1).padStart(2,'0');
    var dd = String(start.getDate()).padStart(2,'0');
    var startInput = document.getElementById('report-start');
    var endInput = document.getElementById('report-end');
    if (startInput && endInput) {
        startInput.value = yyyy + '-' + mm + '-' + dd;
        var eyyyy = today.getFullYear();
        var emm = String(today.getMonth()+1).padStart(2,'0');
        var edd = String(today.getDate()).padStart(2,'0');
        endInput.value = eyyyy + '-' + emm + '-' + edd;
    }
    // regenerate
    generateReport();
}
