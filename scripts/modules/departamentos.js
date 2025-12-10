/**
 * Módulo de Departamentos (Reconstruído)
 * 
 * Foco: Simplicidade, robustez e logging claro para depuração.
 */

// Função principal de inicialização do módulo de departamentos.
// Chamada pelo sistema de navegação após a página ser carregada.
function initDepartmentsModule() {
    console.log('[DEPT] 🚀 Módulo de Departamentos (reconstruído) INICIADO.');

    // 1. Encontrar o botão Salvar pelo novo ID.
    const saveButton = document.getElementById('save-dept-btn');

    // 2. Encontrar os campos de input.
    const nameInput = document.getElementById('new-dept-name');
    const descInput = document.getElementById('new-dept-desc');

    // 3. Encontrar o container da lista.
    const listContainer = document.getElementById('dept-list-container');

    // 4. Verificar se os elementos essenciais foram encontrados.
    if (!saveButton) {
        console.error('[DEPT] ❌ CRÍTICO: O botão "save-dept-btn" não foi encontrado no DOM. A função não pode continuar.');
        showToast('Erro crítico: Botão Salvar não encontrado.', 'error');
        return;
    }
    if (!nameInput || !descInput) {
        console.error('[DEPT] ❌ CRÍTICO: Campos de nome ou descrição não encontrados.');
        return;
    }
    if (!listContainer) {
        console.error('[DEPT] ❌ CRÍTICO: Container da lista não encontrado.');
        return;
    }

    console.log('[DEPT] ✅ Elementos essenciais (botão, inputs, lista) foram encontrados no DOM.');

    // 5. Adicionar o event listener ao botão Salvar.
    // Removemos qualquer listener antigo para garantir que não haja duplicatas.
    saveButton.removeEventListener('click', handleSaveDepartment);
    saveButton.addEventListener('click', handleSaveDepartment);

    console.log('[DEPT] ✅ Event listener "click" adicionado ao botão "save-dept-btn".');

    // 6. Carregar e renderizar a lista de departamentos existentes.
    renderDepartmentList();
}

// Função chamada quando o botão Salvar é clicado.
async function handleSaveDepartment() {
    console.log('[DEPT] 🖱️ Botão "Salvar Departamento" foi clicado.');

    const nameInput = document.getElementById('new-dept-name');
    const descInput = document.getElementById('new-dept-desc');

    const nome = nameInput.value.trim();
    const descricao = descInput.value.trim();

    if (!nome) {
        showToast('O nome do departamento é obrigatório.', 'error');
        nameInput.focus();
        return;
    }

    console.log(`[DEPT] 📝 Tentando salvar novo departamento: "${nome}"`);
    showToast('Salvando departamento...', 'info');

    try {
        // Simula uma chamada à API (substituir pela lógica do Supabase)
        const newDepartment = await saveDepartmentToDatabase({ nome, descricao });

        console.log('[DEPT] ✅ Departamento salvo com sucesso na "base de dados".', newDepartment);
        showToast('Departamento salvo com sucesso!', 'success');

        // Limpar os campos após o sucesso
        nameInput.value = '';
        descInput.value = '';

        // Atualizar a lista na tela para mostrar o novo item
        renderDepartmentList();

    } catch (error) {
        console.error('[DEPT] ❌ Erro ao salvar o departamento:', error);
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    }
}

// Função para renderizar a lista de departamentos.
async function renderDepartmentList() {
    const listContainer = document.getElementById('dept-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<p style="text-align: center; color: #999;">Carregando lista...</p>';

    try {
        const departments = await fetchDepartmentsFromDatabase();
        console.log(`[DEPT] 📊 ${departments.length} departamentos carregados.`);

        if (departments.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #999;">Nenhum departamento cadastrado.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th class="actions-column">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${departments.map(dept => `
                    <tr data-id="${dept.id}">
                        <td>${dept.nome}</td>
                        <td>${dept.descricao || ''}</td>
                        <td class="actions-column">
                            <button class="btn-icon btn-edit" onclick="handleEditDepartment('${dept.id}')" title="Editar">✏️</button>
                            <button class="btn-icon btn-delete" onclick="handleDeleteDepartment('${dept.id}')" title="Excluir">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        listContainer.innerHTML = '';
        listContainer.appendChild(table);

    } catch (error) {
        console.error('[DEPT] ❌ Erro ao renderizar a lista de departamentos:', error);
        listContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Erro ao carregar a lista.</p>';
    }
}

// Função para deletar um departamento.
async function handleDeleteDepartment(id) {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) {
        return;
    }

    console.log(`[DEPT] 🗑️ Tentando excluir departamento com ID: ${id}`);
    showToast('Excluindo...', 'info');

    try {
        await deleteDepartmentFromDatabase(id);
        showToast('Departamento excluído com sucesso!', 'success');
        renderDepartmentList(); // Atualiza a lista
    } catch (error) {
        console.error('[DEPT] ❌ Erro ao excluir:', error);
        showToast(`Erro ao excluir: ${error.message}`, 'error');
    }
}

// Função de edição (placeholder).
function handleEditDepartment(id) {
    console.log(`[DEPT] ✏️ Editar departamento com ID: ${id}`);
    showToast('Função de edição ainda não implementada.', 'info');
    // Aqui, você poderia preencher o formulário com os dados do departamento
}


// ==================================================================
// SIMULAÇÃO DE BANCO DE DADOS (Substituir por chamadas Supabase)
// ==================================================================

// Pega os dados do localStorage ou retorna um array vazio
const getMockDatabase = () => {
    try {
        const data = localStorage.getItem('mock_departments_db');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

// Salva os dados no localStorage
const saveMockDatabase = (db) => {
    localStorage.setItem('mock_departments_db', JSON.stringify(db));
};

// Simula a busca de dados
const fetchDepartmentsFromDatabase = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = getMockDatabase();
            resolve(db);
        }, 300); // Simula latência de rede
    });
};

// Simula o salvamento de um novo departamento
const saveDepartmentToDatabase = (deptData) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const db = getMockDatabase();
            const newDept = {
                id: `dept_${Date.now()}`, // ID único
                ...deptData
            };
            db.push(newDept);
            saveMockDatabase(db);
            resolve(newDept);
        }, 300);
    });
};

// Simula a exclusão de um departamento
const deleteDepartmentFromDatabase = (id) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let db = getMockDatabase();
            const initialLength = db.length;
            db = db.filter(dept => dept.id !== id);

            if (db.length === initialLength) {
                return reject(new Error('Departamento não encontrado.'));
            }

            saveMockDatabase(db);
            resolve();
        }, 300);
    });
};
