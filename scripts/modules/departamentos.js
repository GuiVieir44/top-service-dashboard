/**
 * Módulo de Departamentos (Versão Integrada)
 * 
 * Responsável por gerenciar a UI e interações na página de departamentos,
 * utilizando o `supabaseRealtime` como única fonte da verdade para os dados.
 */

// Função de inicialização, chamada pelo sistema de navegação.
function initDepartmentsModule() {
    console.log('[DEPT] 🚀 Módulo de Departamentos (Integrado) INICIADO.');

    const addButton = document.getElementById('dept-add-btn');
    if (addButton) {
        // Garantir que não haja listeners duplicados
        addButton.removeEventListener('click', handleAddDepartment);
        addButton.addEventListener('click', handleAddDepartment);
        console.log('[DEPT] ✅ Event listener adicionado ao botão "Adicionar".');
    } else {
        console.error('[DEPT] ❌ CRÍTICO: Botão "dept-add-btn" não encontrado.');
    }

    // A renderização inicial é chamada pelo supabase-realtime.js,
    // mas podemos chamar aqui para garantir que a lista apareça se os dados já estiverem em cache.
    renderDepartments();
}

// Função para renderizar a lista de departamentos na tabela.
function renderDepartments() {
    console.log('[DEPT] 🎨 Renderizando a lista de departamentos...');
    const departments = window.supabaseRealtime.data.departments || [];
    const listBody = document.getElementById('dept-list-body');

    if (!listBody) {
        console.warn('[DEPT] ⚠️ Tabela "dept-list-body" não encontrada no DOM. A renderização foi pulada.');
        return;
    }

    if (departments.length === 0) {
        listBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px; color: #888;">
                    Nenhum departamento cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    listBody.innerHTML = departments.map(dept => `
        <tr data-id="${dept.id}">
            <td>${escapeHTML(dept.nome)}</td>
            <td>${escapeHTML(dept.descricao || '')}</td>
            <td class="actions-column">
                <button class="btn-icon btn-edit" onclick="handleEditDepartment('${dept.id}')" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" onclick="handleDeleteDepartment('${dept.id}')" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');

    console.log(`[DEPT] ✅ Lista de ${departments.length} departamentos renderizada.`);
}

// Manipulador para o clique no botão "Adicionar Departamento".
async function handleAddDepartment() {
    console.log('[DEPT] ➕ Tentando adicionar novo departamento...');
    const nameInput = document.getElementById('dept-name');
    const descInput = document.getElementById('dept-desc');

    const nome = nameInput.value.trim();
    const descricao = descInput.value.trim();

    if (!nome) {
        showToast('O nome do departamento é obrigatório.', 'error');
        nameInput.focus();
        return;
    }

    showToast('Adicionando departamento...', 'info');

    // A operação de inserção é delegada ao supabaseRealtime.
    const result = await window.supabaseRealtime.insert('departments', { nome, descricao });

    if (result) {
        showToast('Departamento adicionado com sucesso!', 'success');
        // Limpa os campos após o sucesso.
        nameInput.value = '';
        descInput.value = '';
        console.log('[DEPT] ✅ Campos do formulário limpos.');
    } else {
        showToast('Falha ao adicionar o departamento.', 'error');
        console.error('[DEPT] ❌ Falha na operação de inserção.');
    }
    // A UI será atualizada automaticamente pelo listener do `supabaseRealtime`.
}

// Manipulador para o clique no botão "Excluir".
async function handleDeleteDepartment(id) {
    if (!id) {
        console.error('[DEPT] ❌ ID para exclusão é inválido.');
        return;
    }

    if (!confirm('Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.')) {
        return;
    }

    showToast('Excluindo departamento...', 'info');

    // A operação de remoção é delegada ao supabaseRealtime.
    const result = await window.supabaseRealtime.remove('departments', id);

    if (result !== null) { // `remove` pode retornar `undefined` em sucesso
        showToast('Departamento excluído com sucesso!', 'success');
    } else {
        showToast('Falha ao excluir o departamento.', 'error');
        console.error(`[DEPT] ❌ Falha ao excluir departamento com ID: ${id}`);
    }
    // A UI será atualizada automaticamente.
}

// Manipulador para o clique no botão "Editar".
function handleEditDepartment(id) {
    console.log(`[DEPT] ✏️ Editando departamento ID: ${id}`);
    const departments = window.supabaseRealtime.data.departments || [];
    const department = departments.find(d => d.id === id);

    if (!department) {
        showToast('Departamento não encontrado.', 'error');
        return;
    }

    // Preenche o formulário com os dados existentes para edição.
    const nameInput = document.getElementById('dept-name');
    const descInput = document.getElementById('dept-desc');
    nameInput.value = department.nome;
    descInput.value = department.descricao;

    // Altera o botão de "Adicionar" para "Salvar Alterações".
    const addButton = document.getElementById('dept-add-btn');
    addButton.innerHTML = '<span class="icon">💾</span> Salvar Alterações';
    
    // Remove o listener de adicionar e adiciona um novo para salvar.
    const saveHandler = async () => {
        const newName = nameInput.value.trim();
        const newDesc = descInput.value.trim();

        if (!newName) {
            showToast('O nome não pode ficar em branco.', 'error');
            return;
        }

        showToast('Salvando alterações...', 'info');
        
        const updateData = { nome: newName, descricao: newDesc };
        const result = await window.supabaseRealtime.update('departments', id, updateData);

        if (result) {
            showToast('Departamento atualizado com sucesso!', 'success');
            // Limpa os campos e restaura o botão.
            nameInput.value = '';
            descInput.value = '';
            addButton.innerHTML = '<span class="icon">➕</span> Adicionar Departamento';
            // Restaura o listener original.
            addButton.removeEventListener('click', saveHandler);
            addButton.addEventListener('click', handleAddDepartment);
        } else {
            showToast('Falha ao atualizar o departamento.', 'error');
        }
    };

    addButton.removeEventListener('click', handleAddDepartment);
    addButton.addEventListener('click', saveHandler, { once: true }); // Executa apenas uma vez
    
    // Adiciona um botão "Cancelar" para sair do modo de edição.
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.className = 'btn btn-ghost';
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = () => {
        nameInput.value = '';
        descInput.value = '';
        addButton.innerHTML = '<span class="icon">➕</span> Adicionar Departamento';
        addButton.removeEventListener('click', saveHandler);
        addButton.addEventListener('click', handleAddDepartment);
        cancelButton.remove();
    };
    
    // Insere o botão Cancelar se ele ainda não existir.
    if (!addButton.nextElementSibling || addButton.nextElementSibling.tagName !== 'BUTTON') {
        addButton.parentNode.appendChild(cancelButton);
    }
}

// Função de utilidade para escapar HTML e prevenir XSS.
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
