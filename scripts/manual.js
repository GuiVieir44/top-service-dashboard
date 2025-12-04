// ==========================================
// MÓDULO DE MARCAÇÃO MANUAL - TOP SERVICE
// ==========================================

// Reuse punches storage from ponto.js (loadPunches/savePunches) when available
function registerManualPunch(employeeId, type, isoTimestamp) {
    try {
        var punches = typeof loadPunches === 'function' ? loadPunches() : [];
        var punch = {
            id: Date.now(),
            employeeId: Number(employeeId),
            type: type,
            timestamp: isoTimestamp || new Date().toISOString()
        };
        punches.push(punch);
        if (typeof savePunches === 'function') savePunches(punches);
        else localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
        if (typeof renderPunches === 'function') renderPunches();
        alert('Registro manual salvo.');
        return punch;
    } catch (e) { console.error('Erro ao registrar marcação manual:', e); alert('Erro ao salvar marcação. Veja console.'); }
}

function initManualModule() {
    console.log('Inicializando módulo Marcação Manual');
    var select = document.getElementById('manual-employee-select');
    if (select && typeof getEmployees === 'function') {
        var emps = getEmployees();
        if (emps && emps.length > 0) {
            select.innerHTML = emps.map(function(e){ return '<option value="' + e.id + '">' + e.matricula + ' - ' + e.nome + '</option>'; }).join('');
        } else select.innerHTML = '<option value="0">Sem funcionários</option>';
    }

    var btn = document.getElementById('manual-add-btn');
    if (btn) {
        btn.onclick = function(){
            var empId = parseInt(document.getElementById('manual-employee-select')?.value || '0',10) || 0;
            var date = document.getElementById('manual-date')?.value || '';
            var time = document.getElementById('manual-time')?.value || '';
            var typeEl = document.querySelector('input[name="manual-type"]:checked');
            var type = typeEl ? typeEl.value : 'Entrada';
            if (!empId) { showToast('Selecione um funcionário.', 'warning'); return; }
            if (!date || !time) { showToast('Preencha data e hora.', 'warning'); return; }
            var iso = new Date(date + 'T' + time + ':00').toISOString();
            registerManualPunch(empId, type, iso);
            showToast('Marcação manual registrada!', 'success');
            // Limpar campos
            document.getElementById('manual-date').value = '';
            document.getElementById('manual-time').value = '';
        };
    }
}
