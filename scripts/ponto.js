// ==========================================
// MÓDULO DE REGISTRO DE PONTO - TOP SERVICE
// ==========================================

// Key used in localStorage
var PUNCH_KEY = 'topservice_punches_v1';

function loadPunches() {
    try {
        return JSON.parse(localStorage.getItem(PUNCH_KEY) || '[]');
    } catch (e) {
        console.error('Erro ao carregar punches:', e);
        return [];
    }
}

function savePunches(punches) {
    try {
        localStorage.setItem(PUNCH_KEY, JSON.stringify(punches));
    } catch (e) {
        console.error('Erro ao salvar punches:', e);
    }
}

function registerPunch(employeeId, type) {
    var punches = loadPunches();
    var now = new Date();
    var punch = {
        id: Date.now(),
        employeeId: employeeId,
        type: type,
        timestamp: now.toISOString()
    };
    punches.push(punch);
    savePunches(punches);
    renderPunches();
}

function deletePunch(id) {
    if (!confirm('Confirma exclusão deste registro de ponto?')) return;
    var punches = loadPunches().filter(function(p){ return p.id !== id; });
    savePunches(punches);
    renderPunches();
}

function formatDateTimeISO(iso) {
    try {
        var d = new Date(iso);
        return d.toLocaleString('pt-BR');
    } catch (e) {
        return iso;
    }
}

function renderPunches() {
    var tbody = document.getElementById('punch-list-body');
    if (!tbody) return;
    var punches = loadPunches();

    // show latest first
    punches = punches.slice().reverse();

    tbody.innerHTML = '';

    if (punches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#666;">Nenhum registro de ponto encontrado.</td></tr>';
        return;
    }

    punches.forEach(function(p){
        var empName = p.employeeId;
        if (typeof getEmployeeById === 'function') {
            var emp = getEmployeeById(p.employeeId);
            if (emp) empName = emp.matricula + ' - ' + emp.nome;
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="padding:8px;border:1px solid #e6e6e6;">' + empName + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + p.type + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + formatDateTimeISO(p.timestamp) + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;"><button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deletePunch(' + p.id + ')">Excluir</button></td>';
        tbody.appendChild(tr);
    });
}

function initPunchModule() {
    // populate employee select if present
    var select = document.getElementById('punch-employee-select');
    if (select && typeof getEmployees === 'function') {
        var emps = getEmployees();
        if (emps && emps.length > 0) {
            select.innerHTML = emps.map(function(e){ return '<option value="' + e.id + '">' + e.matricula + ' - ' + e.nome + '</option>'; }).join('');
        } else {
            select.innerHTML = '<option value="0">Sem funcionários</option>';
        }
    }

    var btn = document.getElementById('punch-register-btn');
    // Evitar múltiplos listeners ao navegar entre telas
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', function(e){
            // Debounce simples contra cliques repetidos ou múltiplos listeners
            if (btn.disabled) return;
            btn.disabled = true;
            setTimeout(function(){ btn.disabled = false; }, 600);

            var selectEl = document.getElementById('punch-employee-select');
            var empId = parseInt(selectEl && selectEl.value, 10) || 0;
            var typeEl = document.querySelector('input[name="punch-type"]:checked');
            var type = typeEl ? typeEl.value : 'Entrada';

            if (!empId) {
                showToast('Selecione um funcionário antes de registrar o ponto.', 'warning');
                return;
            }

            try {
                registerPunch(empId, type);
                showToast('Ponto registrado com sucesso!', 'success');
            } catch (err) {
                console.error('Erro ao registrar ponto:', err);
                showToast('Erro ao registrar ponto.', 'error');
            }
        });
    }

    renderPunches();
}
