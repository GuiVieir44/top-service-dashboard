// ==========================================
// MÓDULO DE CARGOS - TOP SERVICE
// ==========================================

const CARGOS_KEY = 'topservice_cargos_v1';

// Cargos padrão (vazio - usuário deve criar)
const defaultCargos = [];

let cargos = [];

/**
 * Inicializa os cargos do sistema
 */
function initializeCargosData() {
    cargos = (window.supabaseRealtime && window.supabaseRealtime.data.cargos) || [...defaultCargos];
}

/**
 * Salva cargos no localStorage
 */
function saveCargos() {
    // Deprecated: Data is now saved via Supabase.
    // This function can be used for fallback if needed.
}

/**
 * Obtém todos os cargos
 */
function getCargos() {
    return (window.supabaseRealtime && window.supabaseRealtime.data.cargos) || cargos;
}* Obtém cargo por ID
 */
function getCargoById(id) {
    return cargos.find(c => String(c.id) === String(id)) || null;
}

/**
 * Obtém cargo por nome
 */
function getCargoByName(nome) {
    return cargos.find(c => c.nome.toLowerCase() === nome.toLowerCase()) || null;
}

/**
 * Adiciona novo cargo
 */
function addCargo(nome, horasDia) {
    if (!nome || !horasDia || horasDia <= 0) {
        showToast('Nome e horas do dia são obrigatórios', 'warning');
function addCargo(nome, horasDia) {
    if (!nome || !horasDia || horasDia <= 0) {
        showToast('Nome e horas do dia são obrigatórios', 'warning');
        return Promise.reject('Dados inválidos');
    }

    if (getCargos().find(c => c.nome.toLowerCase() === nome.toLowerCase())) {
        showToast('Cargo já existe', 'warning');
        return Promise.reject('Cargo já existe');
    }

    const newId = 'cargo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const cargo = { id: newId, nome, horasDia: Number(horasDia), bancoHoras: 0 };

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando cargo para Supabase...');
        return window.supabaseRealtime.insert('cargos', cargo);
    } else {
        // Fallback
        cargos.push(cargo);
        saveCargos();
        renderCargos();
        return Promise.resolve(cargo);
    }
}* Atualiza cargo
 */
function updateCargo(id, nome, horasDia) {
    const index = cargos.findIndex(c => String(c.id) === String(id));
    if (index === -1) {
        return Promise.reject('Cargo não encontrado');
    }

    const updatedCargo = { ...cargos[index], nome, horasDia: Number(horasDia) };

    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando cargo no Supabase...');
        return window.supabaseRealtime.update('cargos', id, updatedCargo)
function updateCargo(id, nome, horasDia) {
    const updatedCargo = { nome, horasDia: Number(horasDia) };

    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando cargo no Supabase...');
        return window.supabaseRealtime.update('cargos', id, updatedCargo);
    } else {
        // Fallback
        const index = cargos.findIndex(c => String(c.id) === String(id));
        if (index === -1) return Promise.reject('Cargo não encontrado');
        cargos[index] = { ...cargos[index], ...updatedCargo };
        saveCargos();
        renderCargos();
        return Promise.resolve(cargos[index]);
    }
}       return window.supabaseRealtime.remove('cargos', id)
            .then(() => {
                cargos.splice(index, 1);
                saveCargos();
                return true;
            })
            .catch(err => {
                console.error('❌ Erro ao remover cargo via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback
        cargos.splice(index, 1);
        saveCargos();
        return Promise.resolve(true);
    }
function deleteCargo(id) {
    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo cargo do Supabase...');
        return window.supabaseRealtime.remove('cargos', id);
    } else {
        // Fallback
        const index = cargos.findIndex(c => String(c.id) === String(id));
        if (index === -1) return Promise.resolve(false);
        cargos.splice(index, 1);
        saveCargos();
        renderCargos();
        return Promise.resolve(true);
    }
}           <td style="padding:10px;border:1px solid #e6e6e6;color:#2ecc71;font-weight:bold;">${cargo.bancoHoras >= 0 ? '+' : ''}${cargo.bancoHoras}h</td>
            <td style="padding:10px;border:1px solid #e6e6e6;text-align:center;">
                <button onclick="editCargoModal('${cargoIdLiteral}')" style="background:#3498db;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:5px;">Editar</button>
                <button onclick="deletCargoConfirm('${cargoIdLiteral}')" style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">Excluir</button>
            </td>
        `;
function editCargoModal(id) {
    const cargo = getCargoById(id);
    if (!cargo) return;

    const novoNome = prompt('Novo nome do cargo:', cargo.nome);
    if (!novoNome) return;

    const novasHoras = prompt('Horas por dia:', cargo.horasDia);
function renderCargos() {
    const tbody = document.getElementById('cargo-list-body');
    if (!tbody) return;

    const currentCargos = getCargos();
    tbody.innerHTML = '';

    if (currentCargos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">Nenhum cargo cadastrado.</td></tr>';
        return;
    }

    currentCargos.forEach(cargo => {
        const cargoIdLiteral = String(cargo.id).replace(/'/g, "\\'");
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:10px;border:1px solid #e6e6e6;">${cargo.nome}</td>
            <td style="padding:10px;border:1px solid #e6e6e6;">${cargo.horasDia}h</td>
            <td style="padding:10px;border:1px solid #e6e6e6;color:#2ecc71;font-weight:bold;">${(cargo.bancoHoras || 0) >= 0 ? '+' : ''}${cargo.bancoHoras || 0}h</td>
            <td style="padding:10px;border:1px solid #e6e6e6;text-align:center;">
                <button onclick="editCargoModal('${cargoIdLiteral}')" style="background:#3498db;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:5px;">Editar</button>
                <button onclick="deletCargoConfirm('${cargoIdLiteral}')" style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}eletCargoConfirm(id) {
    if (!confirm('Confirma exclusão deste cargo?')) return;
    deleteCargo(id);
function deletCargoConfirm(id) {
    if (!confirm('Confirma exclusão deste cargo?')) return;
    deleteCargo(id)
        .then(() => {
            renderCargos();
            showToast('Cargo removido!', 'success');
        })
function initCargosModule() {
    console.log('[CARGOS] Inicializando módulo');

    const addBtn = document.getElementById('cargo-add-btn');
    if (addBtn) {
        addBtn.onclick = function() {
            const nomeInput = document.getElementById('cargo-nome');
            const horasInput = document.getElementById('cargo-horas');
            const nome = nomeInput?.value?.trim();
            const horas = horasInput?.value?.trim();

            if (!nome) {
                showToast('Nome do cargo é obrigatório.', 'warning');
                return;
            }
            if (!horas || horas <= 0) {
                showToast('Horas por dia deve ser maior que zero.', 'warning');
function deletCargoConfirm(id) {
    if (!confirm('Confirma exclusão deste cargo?')) return;
    deleteCargo(id)
        .then(() => {
            showToast('Cargo removido!', 'success');
        })
        .catch(() => {
            showToast('Erro ao remover cargo.', 'error');
        });
}              renderCargos();
function initCargosModule() {
    console.log('[CARGOS] Inicializando módulo');
    initializeCargosData();

    const addBtn = document.getElementById('cargo-add-btn');
    if (addBtn) {
        addBtn.onclick = function() {
            const nomeInput = document.getElementById('cargo-nome');
            const horasInput = document.getElementById('cargo-horas');
            const nome = nomeInput?.value?.trim();
            const horas = horasInput?.value?.trim();

            if (!nome) {
                showToast('Nome do cargo é obrigatório.', 'warning');
                return;
            }
            if (!horas || horas <= 0) {
                showToast('Horas por dia deve ser maior que zero.', 'warning');
                return;
            }

            addCargo(nome, horas)
                .then(newCargo => {
                    if (newCargo) {
                        showToast('Cargo adicionado!', 'success');
                        if (nomeInput) nomeInput.value = '';
                        if (horasInput) horasInput.value = '8';
                        updateCargoSelects();
                    }
                })
                .catch(() => {
                    // O toast de erro já é mostrado dentro do addCargo
                });
        };
    }

    renderCargos();
    // Add a listener for real-time updates
    window.addEventListener('cargos-updated', renderCargos);
}**
 * Cria novo cargo a partir do modal no departamento
 */
function criarCargoModal() {
    const nameInput = document.getElementById('new-cargo-name');
    const hoursInput = document.getElementById('new-cargo-hours');

    const nome = nameInput ? nameInput.value?.trim() : '';
    const horas = hoursInput ? Number(hoursInput.value) : 0;

    if (!nome) {
        showToast('Nome do cargo é obrigatório.', 'warning');
        return;
    }

    if (horas <= 0) {
        showToast('Horas por dia deve ser maior que zero.', 'warning');
        return;
    }

    addCargo(nome, horas)
        .then(cargo => {
            const createModal = document.querySelector('.modal-overlay[style*="10000"]');
            if (createModal) createModal.remove();
            
            const cargoSelect = document.getElementById('cargos-dept-cargo-select');
            if (cargoSelect) {
                const option = document.createElement('option');
                option.value = cargo.id;
                option.textContent = cargo.nome;
                cargoSelect.appendChild(option);
                cargoSelect.value = cargo.id;
            }
            
            updateCargoSelects();
            showToast('Cargo criado com sucesso!', 'success');
        })
        .catch(err => {
            showToast(err, 'warning');
        });
}

// Inicializar dados ao carregar o script
initializeCargosData();
// Inicializar dados ao carregar o script
// initializeCargosData();
// A inicialização agora é feita dentro de initCargosModule para garantir que ocorra no momento certo.