// ==========================================
// MÓDULO DE AFASTAMENTOS - TOP SERVICE
// ==========================================

var AFAST_KEY = 'topservice_afastamentos_v1';

// ===== DEBOUNCING =====
let saveAfastamentosTimeout = null;
const AFAST_SAVE_DELAY = 300; // ms

/**
 * Agenda salvamento de afastamentos com debounce
 */
function scheduleSaveAfastamentos(list) {
    if (saveAfastamentosTimeout) {
        clearTimeout(saveAfastamentosTimeout);
    }
    
    saveAfastamentosTimeout = setTimeout(() => {
        performSaveAfastamentos(list);
    }, AFAST_SAVE_DELAY);
}

/**
 * Executa salvamento real de afastamentos
 */
function performSaveAfastamentos(list) {
    try {
        localStorage.setItem(AFAST_KEY, JSON.stringify(list));
        window.afastamentos = list; // Sincronizar global
        
        // Notificar persistência global
        if (typeof window.scheduleDebouncedsave === 'function') {
            window.scheduleDebouncedsave();
        }
        
        console.log('✅ Afastamentos salvos com debounce -', list.length, 'registros');
    } catch (e) {
        console.error('Erro ao salvar afastamentos:', e);
    }
}

function loadAfastamentos() {
    try {
        return JSON.parse(localStorage.getItem(AFAST_KEY) || '[]');
    } catch (e) {
        console.error('Erro ao carregar afastamentos:', e);
        return [];
    }
}

function saveAfastamentos(list) {
    // Usar debounce
    scheduleSaveAfastamentos(list);
}

function addAfastamento(data) {
    // Validação básica de dados obrigatórios
    if (!data.employeeId || !data.type || !data.start || !data.end) {
        console.warn('[AFAST] ❌ Dados obrigatórios faltando:', data);
        return false;
    }
    
    var list = loadAfastamentos();
    // Gerar UUID para compatibilidade com Supabase
    data.id = 'afast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    list.push(data);
    
    try {
        saveAfastamentos(list);
        // Validação pós-salvamento
        var saved = loadAfastamentos();
        if (saved.some(a => a.id === data.id)) {
            console.log('%c[AFAST] ✅ Afastamento registrado e validado', 'color: #27ae60;', data.id);
            
            // ☁️ SINCRONIZAR COM SUPABASE
            if (window.supabaseRealtime && window.supabaseRealtime.insert) {
                console.log('☁️ Enviando afastamento para Supabase...');
                window.supabaseRealtime.insert('afastamentos', data);
            }
        } else {
            console.warn('%c[AFAST] ⚠️  Falha na validação de salvamento', 'color: #f39c12;');
        }
    } catch (e) {
        console.error('[AFAST] ❌ Erro ao adicionar afastamento:', e);
        return false;
    }
    
    renderAfastamentos();
    // Persistence.js já salva a cada 3s
    setTimeout(() => saveAfastamentos(list), 100);
    return true;
}

function deleteAfastamento(id) {
    if (!confirm('Confirma remoção deste afastamento?')) return;
    // Converter para string para comparação consistente
    var idStr = String(id);
    var list = loadAfastamentos().filter(function(a){ return String(a.id) !== idStr; });
    saveAfastamentos(list);
    
    // ☁️ SINCRONIZAR EXCLUSÃO COM SUPABASE
    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo afastamento do Supabase...');
        window.supabaseRealtime.remove('afastamentos', id);
    }
    
    // Garantir persistência
    setTimeout(() => saveAfastamentos(list), 100);
    renderAfastamentos();
}

// NOVA FUNÇÃO: Atualizar afastamento
function updateAfastamento(id, newData) {
    var list = loadAfastamentos();
    var idStr = String(id);
    var index = list.findIndex(function(a) { return String(a.id) === idStr; });
    
    if (index === -1) {
        console.warn('[AFAST] Afastamento não encontrado para edição:', id);
        return null;
    }
    
    // Atualizar dados mantendo o ID
    list[index] = { ...list[index], ...newData, id: list[index].id };
    
    saveAfastamentos(list);
    renderAfastamentos();
    
    // ☁️ SINCRONIZAR COM SUPABASE
    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando afastamento no Supabase...');
        window.supabaseRealtime.update('afastamentos', id, list[index]);
    }
    
    console.log('[AFAST] ✅ Afastamento atualizado:', list[index]);
    return list[index];
}

// NOVA FUNÇÃO: Abrir modal de edição de afastamento
function openEditAfastamentoModal(id) {
    var list = loadAfastamentos();
    var idStr = String(id);
    var afast = list.find(function(a) { return String(a.id) === idStr; });
    
    if (!afast) {
        showToast('Afastamento não encontrado', 'error');
        return;
    }
    
    // Obter lista de funcionários para o select
    var empOptions = '';
    if (typeof getEmployees === 'function') {
        var emps = getEmployees();
        emps.forEach(function(e) {
            var selected = (e.id == afast.employeeId) ? 'selected' : '';
            empOptions += '<option value="' + e.id + '" ' + selected + '>' + e.matricula + ' - ' + e.nome + '</option>';
        });
    }
    
    var modalHTML = `
        <div class="modal-overlay" onclick="this.remove()" id="modal-edit-afast">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Editar Afastamento</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-edit-afast').remove()">×</button>
                </div>
                
                <div class="modal-section" style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Funcionário:</label>
                        <select id="edit-afast-emp" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            ${empOptions}
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Tipo:</label>
                        <select id="edit-afast-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="Férias" ${afast.type === 'Férias' ? 'selected' : ''}>Férias</option>
                            <option value="Licença Médica" ${afast.type === 'Licença Médica' ? 'selected' : ''}>Licença Médica</option>
                            <option value="Licença Maternidade" ${afast.type === 'Licença Maternidade' ? 'selected' : ''}>Licença Maternidade</option>
                            <option value="Licença Paternidade" ${afast.type === 'Licença Paternidade' ? 'selected' : ''}>Licença Paternidade</option>
                            <option value="Afastamento INSS" ${afast.type === 'Afastamento INSS' ? 'selected' : ''}>Afastamento INSS</option>
                            <option value="Outro" ${afast.type === 'Outro' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Data Início:</label>
                        <input type="date" id="edit-afast-start" value="${afast.start || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Data Fim:</label>
                        <input type="date" id="edit-afast-end" value="${afast.end || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="document.getElementById('modal-edit-afast').remove()" 
                                style="padding: 10px 20px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 6px; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="saveEditAfastamento('${id}')" 
                                style="padding: 10px 20px; border: none; background: #3498db; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// NOVA FUNÇÃO: Salvar edição de afastamento
function saveEditAfastamento(id) {
    var newData = {
        employeeId: document.getElementById('edit-afast-emp').value,
        type: document.getElementById('edit-afast-type').value,
        start: document.getElementById('edit-afast-start').value,
        end: document.getElementById('edit-afast-end').value
    };
    
    if (!newData.employeeId || !newData.type || !newData.start || !newData.end) {
        showToast('Preencha todos os campos', 'warning');
        return;
    }
    
    var updated = updateAfastamento(id, newData);
    if (updated) {
        showToast('Afastamento atualizado!', 'success');
        document.getElementById('modal-edit-afast').remove();
    } else {
        showToast('Erro ao atualizar afastamento', 'error');
    }
}

// Expor funções globalmente
window.updateAfastamento = updateAfastamento;
window.openEditAfastamentoModal = openEditAfastamentoModal;
window.saveEditAfastamento = saveEditAfastamento;

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
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;">' +
                       '<button style="background:#f39c12;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:4px;" onclick="openEditAfastamentoModal(\'' + a.id + '\')">Editar</button>' +
                       '<button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deleteAfastamento(\'' + a.id + '\')">Excluir</button></td>';
        tbody.appendChild(tr);
    });
}

function setupAfastamentosButtonHandler() {
    console.log('[AFAST] Configurando handler do botão Adicionar...');
    
    // Elementos do formulário
    const startInput = document.getElementById('afast-start');
    const daysInput = document.getElementById('afast-days');
    const endInput = document.getElementById('afast-end');
    
    // Função para calcular data final automaticamente
    const calcularDataFinal = () => {
        if (!startInput || !startInput.value || !daysInput || !daysInput.value) {
            if (endInput) endInput.value = '';
            return;
        }
        
        const dataInicio = new Date(startInput.value + 'T00:00:00');
        const dias = Math.max(1, parseInt(daysInput.value) || 1);
        
        // Calcular data final adicionando dias
        const dataFinal = new Date(dataInicio);
        dataFinal.setDate(dataFinal.getDate() + (dias - 1)); // -1 porque o primeiro dia já conta
        
        // Formatar para YYYY-MM-DD
        const ano = dataFinal.getFullYear();
        const mes = String(dataFinal.getMonth() + 1).padStart(2, '0');
        const dia = String(dataFinal.getDate()).padStart(2, '0');
        
        if (endInput) {
            endInput.value = `${ano}-${mes}-${dia}`;
        }
        
        console.log(`[AFAST] Data final calculada: ${dataInicio.toLocaleDateString('pt-BR')} + ${dias} dia(s) = ${endInput.value}`);
    };
    
    // Eventos para cálculo automático
    if (startInput) {
        startInput.addEventListener('change', calcularDataFinal);
    }
    if (daysInput) {
        daysInput.addEventListener('change', calcularDataFinal);
        daysInput.addEventListener('input', calcularDataFinal);
    }
    
    // Handler do botão Adicionar
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
                document.getElementById('afast-days').value = '1';
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
