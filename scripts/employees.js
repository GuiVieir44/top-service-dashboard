// ==========================================
// MÓDULO DE FUNCIONÁRIOS - TOP SERVICE
// ==========================================

console.log('🔧 Módulo de funcionários carregado');

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
        const row = document.createElement('tr');
        
        // Formata a data de admissão
        const dataAdmissao = formatarData(employee.admissao);
        
        // Define a cor do badge de status
        const statusColor = getStatusColor(employee.status);
        
        row.innerHTML = `
            <td><strong>${employee.matricula}</strong></td>
            <td>${employee.nome}</td>
            <td>${employee.cargo}</td>
            <td>${employee.departamento}</td>
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
                <div class="action-buttons">
                    <button class="btn-edit" onclick="window.navigationSystem.showPage('funcionarios-novo',{editId: ${employee.id}})">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteEmployeeUI(${employee.id})">🗑️ Excluir</button>
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
 * Popula o formulário de funcionário com os dados do ID fornecido.
 * Se id for nulo/indefinido, limpa o formulário para um novo cadastro.
 */
function populateEmployeeForm(id) {
    try {
        // Clear first
        clearEmployeeForm();
        if (!id) return;
        const emp = getEmployeeById(Number(id));
        if (!emp) return;
        document.getElementById('form-edit-id').value = emp.id;
        document.getElementById('form-matricula').value = emp.matricula || '';
        document.getElementById('form-nome').value = emp.nome || '';
        document.getElementById('form-cargo').value = emp.cargo || '';
        document.getElementById('form-departamento').value = emp.departamento || '';
        document.getElementById('form-cpf').value = emp.cpf || '';
        document.getElementById('form-email').value = emp.email || '';
        if (emp.admissao) document.getElementById('form-admissao').value = emp.admissao;
        document.getElementById('form-telefone').value = emp.telefone || '';
        document.getElementById('form-endereco').value = emp.endereco || '';
        document.getElementById('form-status').value = emp.status || 'Ativo';
    } catch (e) { console.error('Erro ao popular formulário de funcionário:', e); }
}

function clearEmployeeForm() {
    try {
        const fields = ['form-edit-id','form-matricula','form-nome','form-cargo','form-departamento','form-cpf','form-email','form-admissao','form-telefone','form-endereco','form-status'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'SELECT' || el.type === 'date' || el.type === 'text' || el.type === 'hidden' || el.type === 'email') el.value = '';
                else el.value = '';
            }
        });
        // default status
        const statusEl = document.getElementById('form-status'); if (statusEl) statusEl.value = 'Ativo';
    } catch (e) { console.error('Erro ao limpar formulário:', e); }
}


/**
 * Inicializa comportamentos do módulo de funcionários (botão Adicionar)
 */
function initEmployeeModule() {
    // botão criado pelo navigation.js dentro do módulo
    var addBtn = document.getElementById('add-employee-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function(){
            // navigate to the new employee form page instead of using prompts
            try { if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
                window.navigationSystem.showPage('funcionarios-novo');
            } else {
                showToast('Navegação não disponível.', 'error');
            } } catch(e) { console.error('Erro ao navegar para formulário:', e); }
        });
    }

    // Setup search input listener
    var searchInput = document.getElementById('employee-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(){
            var term = this.value;
            renderEmployeeList(term);
        });
    }

    // render inicial
    renderEmployeeList();
}


function submitEmployeeForm() {
    var matricula = document.getElementById('form-matricula')?.value?.trim();
    var nome = document.getElementById('form-nome')?.value?.trim();
    var cargo = document.getElementById('form-cargo')?.value?.trim() || '';
    var departamento = document.getElementById('form-departamento')?.value?.trim() || '';
    var cpf = document.getElementById('form-cpf')?.value?.trim() || '';
    var email = document.getElementById('form-email')?.value?.trim() || '';
    var admissao = document.getElementById('form-admissao')?.value || '';
    var telefone = document.getElementById('form-telefone')?.value?.trim() || '';
    var endereco = document.getElementById('form-endereco')?.value?.trim() || '';
    var status = document.getElementById('form-status')?.value || 'Ativo';

    if (!matricula) return showToast('Matrícula é obrigatória.', 'warning');
    if (!nome) return showToast('Nome é obrigatório.', 'warning');

    var empData = { matricula, nome, cargo, departamento, cpf, email, admissao, telefone, endereco, status };
    try {
        var editId = document.getElementById('form-edit-id')?.value;
        if (editId) {
            var updated = updateEmployee(Number(editId), empData);
            if (updated) {
                showToast('Funcionário atualizado!', 'success');
            } else {
                showToast('Erro ao atualizar funcionário.', 'error');
            }
        } else {
            var added = addEmployee(empData);
            if (added) {
                showToast('Funcionário cadastrado: ' + added.nome, 'success');
            } else {
                showToast('Erro ao cadastrar funcionário.', 'error');
            }
        }

        // go back to funcionarios list
        if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
            window.navigationSystem.showPage('funcionarios');
        }
        // refresh list (render will be called when page loads, but call explicitly)
        setTimeout(() => { try { renderEmployeeList(); } catch(e){} }, 200);
    } catch (e) { console.error('Erro ao salvar funcionário via formulário:', e); showToast('Erro ao salvar. Veja console.', 'error'); }
}

function cancelEmployeeForm() {
    if (window.navigationSystem && typeof window.navigationSystem.showPage === 'function') {
        window.navigationSystem.showPage('funcionarios');
    }
}