// ==========================================
// MÓDULO DE AFASTAMENTOS - TOP SERVICE
// ==========================================

var AFAST_KEY = 'topservice_afastamentos_v1';

function loadAfastamentos() {
    try {
        return JSON.parse(localStorage.getItem(AFAST_KEY) || '[]');
    } catch (e) {
        console.error('Erro ao carregar afastamentos:', e);
        return [];
    }
}

function saveAfastamentos(list) {
    try {
        localStorage.setItem(AFAST_KEY, JSON.stringify(list));
    } catch (e) {
        console.error('Erro ao salvar afastamentos:', e);
    }
}

function addAfastamento(data) {
    var list = loadAfastamentos();
    data.id = Date.now();
    list.push(data);
    saveAfastamentos(list);
    renderAfastamentos();
}

function deleteAfastamento(id) {
    if (!confirm('Confirma remoção deste afastamento?')) return;
    var list = loadAfastamentos().filter(function(a){ return a.id !== id; });
    saveAfastamentos(list);
    renderAfastamentos();
}

function renderAfastamentos() {
    var tbody = document.getElementById('afast-list-body');
    if (!tbody) return;
    var list = loadAfastamentos();

    tbody.innerHTML = '';

    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#666;">Nenhum afastamento registrado.</td></tr>';
        return;
    }

    list.slice().reverse().forEach(function(a){
        var empName = a.employeeId;
        if (typeof getEmployeeById === 'function') {
            var emp = getEmployeeById(a.employeeId);
            if (emp) empName = emp.matricula + ' - ' + emp.nome;
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="padding:8px;border:1px solid #e6e6e6;">' + empName + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + a.type + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + a.start + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + a.end + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;"><button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deleteAfastamento(' + a.id + ')">Excluir</button></td>';
        tbody.appendChild(tr);
    });
}

function setupAfastamentosButtonHandler() {
    console.log('[AFAST] Configurando handler do botão Adicionar...');
    var btn = document.getElementById('afast-add-btn');
    if (btn) {
        console.log('[AFAST] Botão encontrado, atribuindo onclick');
        btn.onclick = function(){
            console.log('[AFAST] onClick acionado');
            var empSelect = document.getElementById('afast-employee-select');
            var empId = empSelect ? parseInt(empSelect.value, 10) || 0 : 0;
            var typeEl = document.getElementById('afast-type');
            var type = typeEl ? typeEl.value || 'Outro' : 'Outro';
            var startEl = document.getElementById('afast-start');
            var endEl = document.getElementById('afast-end');
            var start = startEl ? startEl.value || '' : '';
            var end = endEl ? endEl.value || '' : '';
            console.log('[AFAST] Dados:', { empId, type, start, end });
            if (!empId) { showToast('Selecione um funcionário.', 'warning'); return; }
            if (!start || !end) { showToast('Preencha período de afastamento.', 'warning'); return; }
            try {
                console.log('[AFAST] Chamando addAfastamento...');
                addAfastamento({ employeeId: empId, type: type, start: start, end: end });
                showToast('Afastamento adicionado com sucesso!', 'success');
                // Limpar campos
                document.getElementById('afast-start').value = '';
                document.getElementById('afast-end').value = '';
                document.getElementById('afast-type').value = 'Férias';
                console.log('[AFAST] Afastamento adicionado com sucesso');
            } catch (e) { 
                console.error('[AFAST] Erro ao adicionar afastamento:', e);
                showToast('Erro ao adicionar afastamento. Veja console.', 'error'); 
            }
        };
    } else {
        console.warn('[AFAST] Botão #afast-add-btn NÃO ENCONTRADO');
    }
}

function initAfastamentosModule() {
    console.log('[AFAST] Inicializando módulo de afastamentos');
    var select = document.getElementById('afast-employee-select');
    if (select && typeof getEmployees === 'function') {
        var emps = getEmployees();
        console.log('[AFAST] Funcionários carregados:', emps?.length || 0);
        if (emps && emps.length > 0) {
            select.innerHTML = emps.map(function(e){ return '<option value="' + e.id + '">' + e.matricula + ' - ' + e.nome + '</option>'; }).join('');
        } else select.innerHTML = '<option value="0">Sem funcionários</option>';
    } else {
        console.warn('[AFAST] #afast-employee-select não encontrado ou getEmployees não definido');
    }

    setupAfastamentosButtonHandler();

    // render existing afastamentos
    try { 
        console.log('[AFAST] Renderizando afastamentos');
        renderAfastamentos(); 
    } catch(e) { 
        console.error('[AFAST] Erro ao renderizar afastamentos:', e); 
    }
}
