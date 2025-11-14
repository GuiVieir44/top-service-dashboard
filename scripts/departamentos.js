// ==========================================
// MÓDULO DE DEPARTAMENTOS - TOP SERVICE
// ==========================================

var DEPT_KEY = 'topservice_departamentos_v1';

function loadDepartments() {
    try { return JSON.parse(localStorage.getItem(DEPT_KEY) || '[]'); } catch(e) { console.error('Erro ao carregar departamentos:', e); return []; }
}

function saveDepartments(list) {
    try { localStorage.setItem(DEPT_KEY, JSON.stringify(list)); } catch(e) { console.error('Erro ao salvar departamentos:', e); }
}

function addDepartment(name, description) {
    var list = loadDepartments();
    var id = list.length > 0 ? Math.max.apply(null, list.map(function(d){return d.id;})) + 1 : 1;
    var d = { id: id, name: name, description: description || '' };
    list.push(d);
    saveDepartments(list);
    renderDepartments();
    return d;
}

function deleteDepartment(id) {
    if (!confirm('Confirma exclusão deste departamento?')) return;
    var list = loadDepartments().filter(function(d){ return d.id !== id; });
    saveDepartments(list);
    renderDepartments();
}

function renderDepartments() {
    var tbody = document.getElementById('dept-list-body');
    if (!tbody) return;
    var list = loadDepartments();
    tbody.innerHTML = '';
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#666;">Nenhum departamento cadastrado.</td></tr>';
        return;
    }
    list.forEach(function(d){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="padding:8px;border:1px solid #e6e6e6;">' + d.name + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + (d.description||'') + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;"><button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deleteDepartment(' + d.id + ')">Excluir</button></td>';
        tbody.appendChild(tr);
    });
}

function initDepartmentsModule() {
    console.log('[DEPT] Inicializando módulo Departamentos');
    var addBtn = document.getElementById('dept-add-btn');
    if (addBtn) {
        addBtn.onclick = function(){
            var name = document.getElementById('dept-name')?.value?.trim();
            var desc = document.getElementById('dept-desc')?.value?.trim() || '';
            if (!name) { showToast('Nome do departamento é obrigatório.', 'warning'); return; }
            addDepartment(name, desc);
            showToast('Departamento adicionado!', 'success');
            document.getElementById('dept-name').value = '';
            document.getElementById('dept-desc').value = '';
        };
    }
    try { renderDepartments(); } catch(e) { console.error('Erro ao renderizar departamentos:', e); }
}
