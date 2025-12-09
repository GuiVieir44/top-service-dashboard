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
    return (window.supabaseRealtime && window.supabaseRealtime.data.afastamentos) || [];
}

function saveAfastamentos(list) {
    // Deprecated: Data is now saved via Supabase.
}

function addAfastamento(data) {
    if (!data.employeeId || !data.type || !data.start || !data.end) {
        showToast('Dados obrigatórios faltando.', 'warning');
        return Promise.reject('Dados obrigatórios faltando');
    }

    data.id = 'afast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando afastamento para Supabase...');
        return window.supabaseRealtime.insert('afastamentos', data)
            .then(result => {
                renderAfastamentos();
                return result;
            })
            .catch(err => {
                console.error('❌ Erro ao adicionar afastamento via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback
        const list = loadAfastamentos();
        list.push(data);
        saveAfastamentos(list);
        renderAfastamentos();
        return Promise.resolve(data);
    }
}

function deleteAfastamento(id) {
    if (!confirm('Confirma remoção deste afastamento?')) return;

    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo afastamento do Supabase...');
        window.supabaseRealtime.remove('afastamentos', id)
            .then(() => {
                renderAfastamentos();
            })
            .catch(err => {
                console.error('❌ Erro ao remover afastamento via Supabase:', err);
            });
    } else {
        // Fallback
        const idStr = String(id);
        const list = loadAfastamentos().filter(a => String(a.id) !== idStr);
        // saveAfastamentos(list); // Deprecated
        renderAfastamentos();
    }
}

function updateAfastamento(id, newData) {
    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando afastamento no Supabase...');
        return window.supabaseRealtime.update('afastamentos', id, newData)
            .then(updated => {
                renderAfastamentos();
                return updated;
            })
            .catch(err => {
                console.error('❌ Erro ao atualizar afastamento via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback
        const list = loadAfastamentos();
        const idStr = String(id);
        const index = list.findIndex(a => String(a.id) === idStr);

        if (index === -1) {
            return Promise.reject('Afastamento não encontrado');
        }

        list[index] = { ...list[index], ...newData };
        saveAfastamentos(list);
        renderAfastamentos();
        return Promise.resolve(list[index]);
    }
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
    
    updateAfastamento(id, newData)
        .then(updated => {
            if (updated) {
                showToast('Afastamento atualizado!', 'success');
                const modal = document.getElementById('modal-edit-afast');
                if (modal) modal.remove();
            }
        })
        .catch(() => {
            showToast('Erro ao atualizar afastamento', 'error');
        });
}   } else {
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
        btn.onclick = function(){
            console.log('[AFAST] onClick acionado');
            var empSelect = document.getElementById('afast-employee-select');
            var empId = empSelect?.value;
            var typeEl = document.getElementById('afast-type');
            var type = typeEl?.value || 'Outro';
            var startEl = document.getElementById('afast-start');
            var endEl = document.getElementById('afast-end');
            var start = startEl?.value || '';
            var end = endEl?.value || '';
            
            if (!empId) { showToast('Selecione um funcionário.', 'warning'); return; }
            if (!start || !end) { showToast('Preencha período de afastamento.', 'warning'); return; }

            addAfastamento({ employeeId: empId, type: type, start: start, end: end })
                .then(() => {
                    showToast('Afastamento adicionado com sucesso!', 'success');
                    if (startEl) startEl.value = '';
                    if (document.getElementById('afast-days')) document.getElementById('afast-days').value = '1';
                    if (endEl) endEl.value = '';
                    if (typeEl) typeEl.value = 'Férias';
                })
                .catch(err => {
                    console.error('[AFAST] Erro ao adicionar afastamento:', err);
                    showToast('Erro ao adicionar afastamento. Veja console.', 'error'); 
                });
        };      document.getElementById('afast-end').value = '';
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
