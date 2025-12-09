// ==========================================
// MÓDULO DE FUNCIONÁRIOS - TOP SERVICE
// ==========================================

console.log('🔧 Módulo de funcionários carregado');

// Formatação de CPF
function formatCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{2})$/, '$1-$2')
        .slice(0, 14);
}

// Formatação de Telefone
function formatPhone(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 15);
}

// Validar matrícula duplicada
function isMatriculaDuplicate(matricula, excludeId = null) {
    const employees = getEmployees();
    return employees.some(emp => 
        emp.matricula.toLowerCase() === matricula.toLowerCase() && 
        (!excludeId || emp.id !== excludeId)
    );
}

/**
 * Função para renderizar a lista de funcionários na tabela
 */
function renderEmployeeList(searchTerm) {
    const employeeListBody = document.getElementById('employee-list-body');
    
    // Verifica se o elemento existe antes de tentar manipular
    if (!employeeListBody) {
        console.error('❌ Elemento employee-list-body não encontrado');
        return;
    }
    
    // Limpa o conteúdo anterior
    employeeListBody.innerHTML = '';
    
    // Resto do código permanece igual...
    var employees = getEmployees();
    
    // Filtrar se searchTerm for fornecido
    if (searchTerm && searchTerm.trim()) {
        var term = searchTerm.toLowerCase().trim();
        employees = employees.filter(emp => 
            emp.nome.toLowerCase().includes(term) ||
            emp.matricula.toLowerCase().includes(term) ||
            emp.email.toLowerCase().includes(term) ||
            emp.cpf.toLowerCase().includes(term)
        );
    }
    
    if (employees.length === 0) {
        employeeListBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    <p>${searchTerm ? 'Nenhum funcionário encontrado com os critérios de busca.' : 'Nenhum funcionário cadastrado. Clique em "Adicionar Novo" para começar.'}</p>
            </tr>
        `;
        return;
    }
    
    // Itera sobre cada funcionário e cria uma linha na tabela
    employees.forEach(employee => {
        const idLiteral = String(employee.id).replace(/'/g, "\\'");
        const row = document.createElement('tr');
        
        // Formata a data de admissão
        const dataAdmissao = formatarData(employee.admissao);
        
        // Define a cor do badge de status
        const statusColor = getStatusColor(employee.status);
        
        // Buscar nome do departamento (se for ID, buscar o nome)
        let deptNome = employee.departamento || '-';
        if (deptNome && deptNome.startsWith('dept_')) {
            // É um ID, buscar o nome real
            if (typeof getDepartmentById === 'function') {
                const dept = getDepartmentById(deptNome);
                if (dept) {
                    deptNome = dept.nome || dept.name || deptNome;
                }
            }
        }
        
        row.innerHTML = `
            <td><strong>${employee.matricula}</strong></td>
            <td>${employee.nome}</td>
            <td>${employee.cargo}</td>
            <td>${deptNome}</td>
            <td>${employee.adicional || '-'}</td>
            <td>${employee.valeAlimentacao ? 'R$ ' + parseFloat(employee.valeAlimentacao).toFixed(2).replace('.', ',') : '-'}</td>
            <td>${employee.valeTransporte || '-'}</td>
            <td>${employee.cpf}</td>
            <td>
                <span style="
                    background-color: ${statusColor};
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.85rem;
                    font-weight: 600;
                ">
                    ${employee.status}
                </span>
            </td>
            <td>${dataAdmissao}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-edit" data-id='${idLiteral}'>✏️ Editar</button>
                    <button class="btn-delete" data-id='${idLiteral}'>🗑️ Excluir</button>
                </div>
            </td>
        `;
        
        employeeListBody.appendChild(row);
    });
}



/**
 * Função auxiliar para formatar a data
 */
function formatarData(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Função auxiliar para obter a cor do badge de status
 */
function getStatusColor(status) {
    const statusColors = {
        'Ativo': '#27ae60',      // Verde
        'Desligado': '#e74c3c',   // Vermelho
        'Férias': '#3498db',     // Azul
        'Afastado': '#f39c12'    // Laranja
    };

    return statusColors[status] || '#95a5a6'; // Padrão: cinza
}

/**
 * Função para deletar um funcionário (UI)
 */
function deleteEmployeeUI(id) {
    if (confirm("Tem certeza que deseja deletar este funcionário?")) {
        // Esta função vem do data.js
        deleteEmployee(id);
        renderEmployeeList(); // Atualiza a tabela
    }
}

/**
 * Função para abrir o modal de cadastro/edição
 */
function openEmployeeModal(id = null) {
    // Compatibilidade: abre a página de formulário em modo edição ou novo
    try {
        if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
            if (id) window.navigationSystem.showPage('funcionarios-novo', { editId: id });
            else window.navigationSystem.showPage('funcionarios-novo');
        } else {
            alert('Navegação não disponível.');
        }
    } catch (e) { console.error('Erro ao abrir formulário de funcionário:', e); }
    // fecha a função openEmployeeModal
}

/**
 * Popula o select de cargos com os cargos disponíveis do departamento selecionado
 * Se não houver customização, usa os cargos globais
 */
function populateCargoSelect(selectId = 'form-cargo', departmentId = null, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Limpar e manter primeira opção
    const firstOption = select.options[0];
    select.innerHTML = '';
    
    if (firstOption) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.text = firstOption.text;
        select.appendChild(opt);
    }
    
    // Carregar cargos do localStorage
    try {
        const raw = localStorage.getItem('topservice_cargos_v1');
        if (raw) {
            const cargos = JSON.parse(raw);
            if (Array.isArray(cargos) && cargos.length > 0) {
                cargos.forEach(cargo => {
                    const option = document.createElement('option');
                    option.value = cargo.id;
                    option.text = cargo.nome || 'Sem nome';
                    select.appendChild(option);
                });
                console.log('Cargos populados:', cargos.length);
            }
        }
    } catch(e) {
        console.error('Erro ao popular cargos:', e);
    }
    
    if (selectedValue) select.value = selectedValue;
}

/**
 * Popula o select de departamentos com os departamentos disponíveis
 */
function populateDepartmentSelect(selectId = 'form-departamento', selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) {
        console.warn('Select departamento não encontrado:', selectId);
        return;
    }
    
    // Limpar options existentes, manter apenas a primeira
    const firstOption = select.options[0];
    select.innerHTML = '';
    
    if (firstOption) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.text = firstOption.text;
        select.appendChild(opt);
    }
    
    // Carregar do localStorage
    try {
        const raw = localStorage.getItem('topservice_departamentos_v1');
        if (raw) {
            const departments = JSON.parse(raw);
            if (Array.isArray(departments) && departments.length > 0) {
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.text = dept.nome || dept.name || 'Sem nome';
                    select.appendChild(option);
                });
                console.log('Departamentos populados:', departments.length);
            } else {
                console.warn('Nenhum departamento em localStorage');
            }
        } else {
            console.warn('localStorage vazio para departamentos');
        }
    } catch(e) {
        console.error('Erro ao popular departamentos:', e);
    }
    
    if (selectedValue) select.value = selectedValue;
}

/**
 * Popula o formulário de funcionário com os dados do ID fornecido.
 * Se id for nulo/indefinido, limpa o formulário para um novo cadastro.
 */
function populateEmployeeForm(id) {
    try {
        console.log('%c[EMP] Populando formulário de funcionário, ID:', 'color: #3498db;', id);
        
        // Clear first
        clearEmployeeForm();
        
        // Always populate the dropdowns
        console.log('[EMP] Populando dropdowns de cargo e departamento...');
        populateCargoSelect('form-cargo');
        populateDepartmentSelect('form-departamento');
        console.log('%c[EMP] ✅ Dropdowns populados', 'color: #27ae60;');
        
        if (!id) {
            console.log('[EMP] Novo cadastro - formulário pronto');
            return;
        }
        
        const emp = getEmployeeById(id);
        if (!emp) {
            console.warn('[EMP] Funcionário não encontrado:', id);
            return;
        }
        
        console.log('[EMP] Preenchendo dados do funcionário:', emp.nome);
        document.getElementById('form-edit-id').value = emp.id;
        document.getElementById('form-matricula').value = emp.matricula || '';
        document.getElementById('form-nome').value = emp.nome || '';
        
        // Set cargo select by finding the cargo ID that matches the stored cargo name
        if (emp.cargo) {
            const cargoObj = typeof getCargoByName === 'function' ? getCargoByName(emp.cargo) : null;
            document.getElementById('form-cargo').value = cargoObj ? cargoObj.id : '';
        }
        
        // Set departamento select by finding the departamento ID that matches the stored departamento name
        if (emp.departamento) {
            const deptObj = typeof getDepartmentByName === 'function' ? getDepartmentByName(emp.departamento) : null;
            if (deptObj) {
                document.getElementById('form-departamento').value = deptObj.id;
                console.log('[EMP] Departamento selecionado:', emp.departamento, '(ID:', deptObj.id + ')');
            }
        }
        
        document.getElementById('form-cpf').value = emp.cpf || '';
        document.getElementById('form-email').value = emp.email || '';
        if (emp.admissao) document.getElementById('form-admissao').value = emp.admissao;
        document.getElementById('form-telefone').value = emp.telefone || '';
        document.getElementById('form-endereco').value = emp.endereco || '';
        document.getElementById('form-status').value = emp.status || 'Ativo';
        document.getElementById('form-adicional').value = emp.adicional || '';
        document.getElementById('form-vale-alimentacao').value = emp.valeAlimentacao || '';
        document.getElementById('form-vale-transporte').value = emp.valeTransporte || '';
        
        console.log('%c[EMP] ✅ Formulário preenchido com sucesso', 'color: #27ae60;');
    } catch (e) { console.error('[EMP] ❌ Erro ao popular formulário de funcionário:', e); }
}

function clearEmployeeForm() {
    try {
        console.log('%c[EMP] Limpando formulário de funcionário', 'color: #95a5a6;');
        const fields = ['form-edit-id','form-matricula','form-nome','form-cargo','form-departamento','form-adicional','form-vale-alimentacao','form-vale-transporte','form-cpf','form-email','form-admissao','form-telefone','form-endereco','form-status'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'SELECT' || el.type === 'date' || el.type === 'text' || el.type === 'hidden' || el.type === 'email') el.value = '';
                else el.value = '';
            }
        });
        // default status
        const statusEl = document.getElementById('form-status'); if (statusEl) statusEl.value = 'Ativo';
        console.log('%c[EMP] ✅ Formulário limpo', 'color: #27ae60;');
    } catch (e) { console.error('[EMP] ❌ Erro ao limpar formulário:', e); }
}


/**
 * Inicializa comportamentos do módulo de funcionários (botão Adicionar)
 */
function initEmployeeModule() {
    console.log('🚀 initEmployeeModule chamado');
    // Garante que o DOM está pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupModule);
    } else {
        setupModule();
    }
}

function setupModule() {
    console.log('🔧 Configurando módulo de funcionários...');
    // Setup search input listener
    var searchInput = document.getElementById('employee-search');
    if (searchInput) {
        // Evita adicionar múltiplos listeners
        if (!searchInput.hasAttribute('data-listener-added')) {
            searchInput.addEventListener('input', function() {
                var term = this.value;
                renderEmployeeList(term);
            });
            searchInput.setAttribute('data-listener-added', 'true');
        }
    }

    // Render inicial
    renderEmployeeList();
    // Adiciona os listeners para os botões de editar/excluir
    setupEmployeeActionButtons();
    console.log('✅ Módulo de funcionários configurado.');
}

// Expõe a função para ser chamada pelo sistema de navegação
window.initEmployeeModule = initEmployeeModule;

/**
 * Inicializa listeners para o formulário de funcionários
 * Chamado quando a página funcionarios-novo é carregada
 */
function initEmployeeFormListeners() {
    console.log('%c[EMP] Inicializando listeners do formulário de funcionários', 'color: #3498db;');
    
    // Garantir que departamentos sejam populados SEMPRE
    const deptSelect = document.getElementById('form-departamento');
    if (deptSelect) {
        console.log('%c[EMP] ✅ Select de departamento encontrado, populando...', 'color: #27ae60;');
        populateDepartmentSelect('form-departamento');
        
        // Remover listener antigo e adicionar novo (evitar duplicação)
        const newDeptSelect = deptSelect.cloneNode(true);
        deptSelect.parentNode.replaceChild(newDeptSelect, deptSelect);
        
        newDeptSelect.addEventListener('change', function() {
            // Quando departamento mudar, recarrega os cargos disponíveis
            const departmentId = this.value || null;
            console.log('[EMP] Departamento selecionado:', departmentId);
            populateCargoSelect('form-cargo', departmentId);
        });
    } else {
        console.error('%c[EMP] ❌ Select de departamento NÃO ENCONTRADO!', 'color: #e74c3c;');
    }
    
    console.log('%c[EMP] ✅ Listeners configurados com sucesso', 'color: #27ae60;');
}



function submitEmployeeForm() {
    console.log('🔵 submitEmployeeForm() INICIADA');
    
    var matricula = document.getElementById('form-matricula')?.value?.trim();
    var nome = document.getElementById('form-nome')?.value?.trim();
    var cargoId = document.getElementById('form-cargo')?.value?.trim() || '';
    var departamentoId = document.getElementById('form-departamento')?.value?.trim() || '';
    var adicional = document.getElementById('form-adicional')?.value?.trim() || '';
    var valeAlimentacao = parseFloat(document.getElementById('form-vale-alimentacao')?.value || '0') || 0;
    var valeTransporte = document.getElementById('form-vale-transporte')?.value?.trim() || '';
    var cpf = document.getElementById('form-cpf')?.value?.trim() || '';
    var email = document.getElementById('form-email')?.value?.trim() || '';
    var admissao = document.getElementById('form-admissao')?.value || '';
    var telefone = document.getElementById('form-telefone')?.value?.trim() || '';
    var endereco = document.getElementById('form-endereco')?.value?.trim() || '';
    var status = document.getElementById('form-status')?.value || 'Ativo';

    console.log('📋 Dados coletados:', {matricula, nome, cargoId, departamentoId, adicional, valeAlimentacao, valeTransporte, cpf, email, admissao, telefone, endereco, status});

    if (!matricula) return showToast('Matrícula é obrigatória.', 'warning');
    if (!nome) return showToast('Nome é obrigatório.', 'warning');

    // Convert IDs to names for storage
    var cargoName = '';
    var departamentoName = '';
    
    if (cargoId) {
        var cargoLookupId = isNaN(Number(cargoId)) ? cargoId : Number(cargoId);
        var cargo = typeof getCargoById === 'function' ? getCargoById(cargoLookupId) : null;
        cargoName = cargo ? cargo.nome : cargoId;
    }
    
    if (departamentoId) {
        var departamento = typeof getDepartmentById === 'function' ? getDepartmentById(departamentoId) : null;
        departamentoName = departamento ? departamento.nome : departamentoId;
        console.log(`📌 Departamento selecionado: ID=${departamentoId}, Nome=${departamentoName}`, departamento);
    }

    var empData = { 
        matricula, 
        nome, 
        cargo: cargoName, 
        departamento: departamentoName, 
        adicional,
        valeAlimentacao,
        valeTransporte,
        cpf, 
        email, 
        admissao, 
        telefone, 
        endereco, 
        status 
    };
    
    console.log('💾 Tentando salvar empData:', empData);
    
    try {
        var editId = document.getElementById('form-edit-id')?.value;
        console.log('📝 EditID:', editId);
        
        if (editId) {
            console.log('🔄 Atualizando funcionário ID:', editId);
            var updated = updateEmployee(editId, empData);
            if (updated) {
                showToast('Funcionário atualizado!', 'success');
                console.log('✅ Funcionário atualizado com sucesso');
            } else {
                showToast('Erro ao atualizar funcionário.', 'error');
                console.error('❌ updateEmployee retornou false');
            }
        } else {
            console.log('➕ Adicionando novo funcionário');
            var added = addEmployee(empData);
            if (added) {
                showToast('Funcionário cadastrado: ' + added.nome, 'success');
                console.log('✅ Funcionário adicionado com sucesso:', added);
            } else {
                console.error('❌ Erro ao cadastrar. empData:', empData);
                showToast('Erro ao cadastrar funcionário. Verifique console.', 'error');
            }
        }

        // go back to funcionarios list
        console.log('🚀 Voltando para lista de funcionários');
        if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
            window.navigationSystem.showPage('funcionarios');
        }
        // refresh list (render will be called when page loads, but call explicitly)
        setTimeout(() => { try { renderEmployeeList(); } catch(e){} }, 200);
    } catch (e) { 
        console.error('❌ EXCEÇÃO ao salvar funcionário via formulário:', e); 
        showToast('Erro ao salvar. Veja console.', 'error'); 
    }
}

function cancelEmployeeForm() {
    console.log('🚫 Cancelando formulário - voltando para funcionarios');
    if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
        window.navigationSystem.showPage('funcionarios');
    } else {
        console.error('❌ navigationSystem não disponível em cancelEmployeeForm');
    }
}

// Adiciona event listeners para os botões de ação da tabela de funcionários
function setupEmployeeActionButtons() {
    const employeeListBody = document.getElementById('employee-list-body');
    if (employeeListBody) {
        employeeListBody.addEventListener('click', function(event) {
            const target = event.target;
            const editButton = target.closest('.btn-edit');
            const deleteButton = target.closest('.btn-delete');

            if (editButton) {
                const id = editButton.dataset.id;
                if (id && window.navigationSystem) {
                    window.navigationSystem.showPage('funcionarios-novo', { editId: id });
                }
            }

            if (deleteButton) {
                const id = deleteButton.dataset.id;
                if (id) {
                    deleteEmployeeUI(id);
                }
            }
        });
    }
}

// ==========================================
// Tornar funções globais
// ==========================================
window.submitEmployeeForm = submitEmployeeForm;
window.cancelEmployeeForm = cancelEmployeeForm;
window.renderEmployeeList = renderEmployeeList;
window.deleteEmployeeUI = deleteEmployeeUI;
window.openEmployeeModal = openEmployeeModal;
window.populateEmployeeForm = populateEmployeeForm;
window.initEmployeeModule = initEmployeeModule;
window.initEmployeeFormListeners = initEmployeeFormListeners;
window.setupEmployeeActionButtons = setupEmployeeActionButtons;