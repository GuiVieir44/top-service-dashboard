// ==========================================
// MÓDULO DE DEPARTAMENTOS - TOP SERVICE
// ==========================================

var DEPT_KEY = 'topservice_departamentos_v1';

function loadDepartments() {
    try { 
        var rawData = localStorage.getItem(DEPT_KEY);
        console.log('[DEPT] Dados brutos no localStorage:', rawData ? 'SIM (' + rawData.length + ' caracteres)' : 'NÃO (null)');
        
        var list = rawData ? JSON.parse(rawData) : [];
        
        // Garantir compatibilidade: converter 'name' para 'nome'
        list = list.map(d => ({
            id: d.id,
            nome: d.nome || d.name || '',
            description: d.description || ''
        }));
        
        console.log('[DEPT] Departamentos carregados:', list.length, list);
        return list;
    } catch(e) { 
        console.error('[DEPT] Erro ao carregar departamentos:', e); 
        return []; 
    }
}

function saveDepartments(list) {
    try { 
        // Garantir que todos os departamentos tenham AMBOS os campos 'nome' e 'name'
        const normalizedList = list.map(d => ({
            id: d.id,
            nome: d.nome || d.name || '',
            name: d.nome || d.name || '',  // Duplicar para compatibilidade com Supabase
            description: d.description || ''
        }));
        
        localStorage.setItem(DEPT_KEY, JSON.stringify(normalizedList));
        
        // Validação pós-salvamento
        try {
            const verification = JSON.parse(localStorage.getItem(DEPT_KEY));
            if (verification.length === normalizedList.length) {
                console.log('%c[DEPT] ✅ Departamentos salvos com sucesso: ' + normalizedList.length, 'color: #27ae60;');
            } else {
                console.warn('%c[DEPT] ⚠️  Falha na validação - quantidade incorreta', 'color: #f39c12;');
            }
        } catch (e) {
            console.warn('%c[DEPT] ⚠️  Erro ao validar salvamento', 'color: #f39c12;', e.message);
        }
    } catch(e) { 
        console.error('%c[DEPT] ❌ Erro ao salvar departamentos', 'color: #e74c3c;', e); 
    }
}

function addDepartment(name, description) {
    var list = loadDepartments();
    var id = list.length > 0 ? Math.max.apply(null, list.map(function(d){return d.id;})) + 1 : 1;
    // Usar string ID para compatibilidade com Supabase
    var stringId = 'dept_' + Date.now() + '_' + id;
    var d = { id: stringId, nome: name, name: name, description: description || '' };
    list.push(d);
    saveDepartments(list);
    
    // Sincronizar com Supabase Realtime
    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando departamento para Supabase Realtime...');
        window.supabaseRealtime.insert('departamentos', d);
    }
    
    // Validação: verificar se foi salvo corretamente
    setTimeout(function() {
        var savedList = loadDepartments();
        if (savedList.length === list.length && savedList.some(dept => dept.id === d.id && (dept.nome === name || dept.name === name))) {
            console.log('%c[DEPT] ✅ Departamento adicionado e verificado:', 'color: #27ae60;', d);
        } else {
            console.error('%c[DEPT] ❌ Falha na verificação de salvamento do departamento', 'color: #e74c3c;');
        }
    }, 150);
    
    renderDepartments();
    return d;
}

function getDepartmentById(id) {
    var list = loadDepartments();
    return list.find(function(d) { return d.id === id || d.id === Number(id); });
}

function getDepartmentByName(name) {
    if (!name) return null;
    var list = loadDepartments();
    return list.find(function(d) { return d.nome === name; });
}

function deleteDepartment(id) {
    if (!confirm('Confirma exclusão deste departamento?')) return;
    
    // Converter para string para comparação consistente
    var idStr = String(id);
    var list = loadDepartments().filter(function(d){ 
        return String(d.id) !== idStr; 
    });
    
    saveDepartments(list);
    renderDepartments();
    
    // Sincronizar com Supabase Realtime
    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo departamento do Supabase Realtime...');
        window.supabaseRealtime.remove('departamentos', id);
    }
}

// NOVA FUNÇÃO: Atualizar departamento
function updateDepartment(id, newName, newDescription) {
    var list = loadDepartments();
    var idStr = String(id);
    var index = list.findIndex(function(d) { return String(d.id) === idStr; });
    
    if (index === -1) {
        console.warn('[DEPT] Departamento não encontrado para edição:', id);
        return null;
    }
    
    // Atualizar dados
    list[index].nome = newName;
    list[index].name = newName;
    list[index].description = newDescription || '';
    
    saveDepartments(list);
    renderDepartments();
    
    // ☁️ SINCRONIZAR COM SUPABASE
    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando departamento no Supabase...');
        window.supabaseRealtime.update('departamentos', id, list[index]);
    }
    
    console.log('[DEPT] ✅ Departamento atualizado:', list[index]);
    return list[index];
}

// NOVA FUNÇÃO: Abrir modal de edição de departamento
function openEditDepartmentModal(id) {
    var dept = getDepartmentById(id);
    if (!dept) {
        showToast('Departamento não encontrado', 'error');
        return;
    }
    
    var modalHTML = `
        <div class="modal-overlay" onclick="this.remove()" id="modal-edit-dept">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Editar Departamento</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-edit-dept').remove()">×</button>
                </div>
                
                <div class="modal-section" style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nome:</label>
                        <input type="text" id="edit-dept-name" value="${dept.nome || ''}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Descrição:</label>
                        <textarea id="edit-dept-desc" rows="3"
                                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;">${dept.description || ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="document.getElementById('modal-edit-dept').remove()" 
                                style="padding: 10px 20px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 6px; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="saveEditDepartment('${id}')" 
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

// NOVA FUNÇÃO: Salvar edição de departamento
function saveEditDepartment(id) {
    var newName = document.getElementById('edit-dept-name').value.trim();
    var newDesc = document.getElementById('edit-dept-desc').value.trim();
    
    if (!newName) {
        showToast('Nome é obrigatório', 'warning');
        return;
    }
    
    var updated = updateDepartment(id, newName, newDesc);
    if (updated) {
        showToast('Departamento atualizado!', 'success');
        document.getElementById('modal-edit-dept').remove();
    } else {
        showToast('Erro ao atualizar departamento', 'error');
    }
}

function renderDepartments() {
    console.log('[DEPT] renderDepartments() chamado');
    var tbody = document.getElementById('dept-list-body');
    if (!tbody) {
        console.warn('[DEPT] tbody não encontrado');
        return;
    }
    var list = loadDepartments();
    console.log('[DEPT] Lista para renderizar:', list);
    tbody.innerHTML = '';
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;color:#666;">Nenhum departamento cadastrado.</td></tr>';
        return;
    }
    list.forEach(function(d){
        console.log('[DEPT] Renderizando departamento:', d.id, d.nome);
        var tr = document.createElement('tr');
        
        // Célula Nome
        var tdNome = document.createElement('td');
        tdNome.style.cssText = 'padding:8px;border:1px solid #e6e6e6;';
        tdNome.textContent = d.nome || '';
        
        // Célula Descrição
        var tdDesc = document.createElement('td');
        tdDesc.style.cssText = 'padding:8px;border:1px solid #e6e6e6;';
        tdDesc.textContent = d.description || '';
        
        // Célula Ações
        var tdAcoes = document.createElement('td');
        tdAcoes.style.cssText = 'padding:8px;border:1px solid #e6e6e6;text-align:center;';
        
        // Botão Cargos - usando closure para capturar valores
        var btnCargos = document.createElement('button');
        btnCargos.style.cssText = 'background:#3498db;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:4px;';
        btnCargos.textContent = 'Cargos';
        (function(deptId, deptNome) {
            btnCargos.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[DEPT] Clicou em Cargos:', deptId, deptNome);
                abrirCargosDepartamentoModal(deptId, deptNome);
            };
        })(d.id, d.nome || '');
        
        // Botão Editar - usando closure para capturar valor
        var btnEditar = document.createElement('button');
        btnEditar.style.cssText = 'background:#f39c12;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:4px;';
        btnEditar.textContent = 'Editar';
        (function(deptId) {
            btnEditar.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[DEPT] Clicou em Editar:', deptId);
                openEditDepartmentModal(deptId);
            };
        })(d.id);
        
        // Botão Excluir - usando closure para capturar valor
        var btnExcluir = document.createElement('button');
        btnExcluir.style.cssText = 'background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;';
        btnExcluir.textContent = 'Excluir';
        (function(deptId) {
            btnExcluir.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[DEPT] Clicou em Excluir:', deptId);
                deleteDepartment(deptId);
            };
        })(d.id);
        
        tdAcoes.appendChild(btnCargos);
        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnExcluir);
        
        tr.appendChild(tdNome);
        tr.appendChild(tdDesc);
        tr.appendChild(tdAcoes);
        tbody.appendChild(tr);
    });
    console.log('[DEPT] renderDepartments() concluído');
}

// Expor funções globalmente para garantir acesso
window.renderDepartments = renderDepartments;
window.deleteDepartment = deleteDepartment;
window.addDepartment = addDepartment;
window.updateDepartment = updateDepartment;
window.openEditDepartmentModal = openEditDepartmentModal;
window.saveEditDepartment = saveEditDepartment;
window.abrirCargosDepartamentoModal = abrirCargosDepartamentoModal;

function abrirCargosDepartamentoModal(deptId, deptName) {
    var modalHTML = `
        <div class="modal-overlay" onclick="this.remove()" id="modal-cargos-dept">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Cargos do Departamento: ${deptName}</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-cargos-dept').remove()">×</button>
                </div>
                
                <div class="modal-section">
                    <h4>Adicionar Cargo ao Departamento</h4>
                    <div class="modal-grid">
                        <label class="modal-label">
                            <small>Cargo</small>
                            <select id="cargos-dept-cargo-select">
                                <option value="">Selecione um cargo global</option>
                            </select>
                            <button id="cargos-dept-create-btn" class="btn btn-success" style="margin-top:8px;width:100%;">+ Criar Novo Cargo</button>
                        </label>
                        <label class="modal-label">
                            <small>Início</small>
                            <input id="cargos-dept-inicio" type="time" value="08:00" />
                        </label>
                        <label class="modal-label">
                            <small>Fim</small>
                            <input id="cargos-dept-fim" type="time" value="17:00" />
                        </label>
                        <label class="modal-label">
                            <small>Almoço (min)</small>
                            <input id="cargos-dept-intervalo" type="number" value="60" min="0" max="180" />
                        </label>
                    </div>
                    <button id="cargos-dept-add-btn" class="btn btn-primary" style="margin-top:10px;">Adicionar Cargo</button>
                </div>
                
                <div style="overflow:auto;">
                    <h4>Cargos Vinculados</h4>
                    <table class="modal-table">
                        <thead>
                            <tr>
                                <th>Cargo</th>
                                <th style="text-align:center;">Início</th>
                                <th style="text-align:center;">Fim</th>
                                <th style="text-align:center;">Almoço</th>
                                <th style="text-align:center;">Horas</th>
                                <th style="text-align:center;">Banco</th>
                                <th style="text-align:center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="cargos-dept-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Listener para botão "Criar Novo Cargo"
    var createCargoBtn = document.getElementById('cargos-dept-create-btn');
    if (createCargoBtn) {
        createCargoBtn.onclick = function(e) {
            e.stopPropagation();
            // Modal para criar novo cargo
            var createCargoModal = document.createElement('div');
            createCargoModal.className = 'modal-overlay';
            createCargoModal.style.zIndex = '10000';
            createCargoModal.innerHTML = `
                <div class="modal-content" style="max-width:400px;">
                    <div class="modal-header">
                        <h2>Criar Novo Cargo</h2>
                        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-section">
                        <label class="modal-label">
                            <small>Nome do Cargo</small>
                            <input id="new-cargo-name" class="form-input" placeholder="Ex: Gerente, Analista..." style="width:100%;margin-bottom:12px;" />
                        </label>
                        <label class="modal-label">
                            <small>Horas por Dia</small>
                            <input id="new-cargo-hours" type="number" min="1" max="24" value="8" class="form-input" style="width:100%;margin-bottom:12px;" />
                        </label>
                        <div style="display:flex;justify-content:flex-end;gap:8px;">
                            <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                            <button class="btn btn-primary" onclick="criarCargoModal()">Criar Cargo</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(createCargoModal);
            createCargoModal.onclick = e => { if (e.target === createCargoModal) createCargoModal.remove(); };
        };
    }
    
    // Popula select de cargos globais
    var cargoSelect = document.getElementById('cargos-dept-cargo-select');
    if (typeof getCargos === 'function') {
        var cargosGlobais = getCargos();
        cargosGlobais.forEach(function(c) {
            var option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            cargoSelect.appendChild(option);
        });
    }
    
    // Inicializa módulo
    if (typeof initCargosDeptoModule === 'function') {
        initCargosDeptoModule(deptId);
    }
}

function initDepartmentsModule() {
    console.log('[DEPT] Inicializando módulo Departamentos');
    
    // Validar e garantir que os departamentos existentes sejam preservados
    const existingDepts = loadDepartments();
    console.log('[DEPT] Departamentos encontrados ao carregar:', existingDepts.length, existingDepts);
    
    var addBtn = document.getElementById('dept-add-btn');
    if (addBtn) {
        addBtn.onclick = function(){
            var name = document.getElementById('dept-name')?.value?.trim();
            var desc = document.getElementById('dept-desc')?.value?.trim() || '';
            if (!name) { showToast('Nome do departamento é obrigatório.', 'warning'); return; }
            
            const newDept = addDepartment(name, desc);
            console.log('[DEPT] Novo departamento adicionado:', newDept);
            
            // Validação de salvamento
            setTimeout(function() {
                const check = loadDepartments();
                console.log('[DEPT] Departamentos após adicionar:', check.length);
                if (check.some(d => d.id === newDept.id && d.nome === name)) {
                    showToast('Departamento adicionado!', 'success');
                } else {
                    showToast('Erro ao salvar departamento', 'error');
                }
            }, 200);
            
            document.getElementById('dept-name').value = '';
            document.getElementById('dept-desc').value = '';
        };
    }
    
    try { 
        renderDepartments();
        console.log('[DEPT] Departamentos renderizados com sucesso');
    } catch(e) { 
        console.error('Erro ao renderizar departamentos:', e); 
    }
}

// Função de debug
window.debugDepartamentos = function() {
    console.clear();
    console.log('%c🔍 DEBUG DEPARTAMENTOS', 'color: #3498db; font-size: 16px; font-weight: bold;');
    const raw = localStorage.getItem('topservice_departamentos_v1');
    console.log('%c📦 Dados brutos no localStorage:', 'color: #2ecc71; font-weight: bold;');
    console.log(raw ? JSON.parse(raw) : 'VAZIO');
    
    console.log('%c✅ Departamentos carregados via loadDepartments():', 'color: #f39c12; font-weight: bold;');
    const loaded = loadDepartments();
    console.table(loaded.map(d => ({
        ID: d.id,
        Nome: d.nome,
        Descrição: d.description
    })));
    
    return { raw: raw ? JSON.parse(raw) : [], loaded };
};

console.log('%c💡 Dica: Use window.debugDepartamentos() para verificar se os departamentos estão sendo salvos', 'color: #f39c12;');
