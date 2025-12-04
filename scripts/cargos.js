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
    try {
        const stored = localStorage.getItem(CARGOS_KEY);
        cargos = stored ? JSON.parse(stored) : [...defaultCargos];
        localStorage.setItem(CARGOS_KEY, JSON.stringify(cargos));
    } catch (e) {
        console.error('Erro ao carregar cargos:', e);
        cargos = [...defaultCargos];
    }
}

/**
 * Salva cargos no localStorage
 */
function saveCargos() {
    try {
        localStorage.setItem(CARGOS_KEY, JSON.stringify(cargos));
    } catch (e) {
        console.error('Erro ao salvar cargos:', e);
    }
}

/**
 * Obtém todos os cargos
 */
function getCargos() {
    return [...cargos];
}

/**
 * Obtém cargo por ID
 */
function getCargoById(id) {
    return cargos.find(c => c.id === id) || null;
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
        console.warn('Nome e horas do dia são obrigatórios');
        return null;
    }

    if (getCargoByName(nome)) {
        console.warn('Cargo já existe');
        return null;
    }

    const newId = cargos.length > 0 ? Math.max(...cargos.map(c => c.id)) + 1 : 1;
    // Permite informar banco de horas ao criar
    let bancoHoras = 0;
    if (window.promptBancoHoras) {
        bancoHoras = window.promptBancoHoras();
    }
    const cargo = { id: newId, nome, horasDia: Number(horasDia), bancoHoras: Number(bancoHoras) };
    
    cargos.push(cargo);
    saveCargos();
    return cargo;
}

/**
 * Atualiza cargo
 */
function updateCargo(id, nome, horasDia) {
    const index = cargos.findIndex(c => c.id === id);
    if (index === -1) {
        console.warn('Cargo não encontrado');
        return null;
    }

    let bancoHoras = cargos[index].bancoHoras;
    if (window.promptBancoHoras) {
        bancoHoras = window.promptBancoHoras(cargos[index].bancoHoras);
    }
    cargos[index] = { ...cargos[index], nome, horasDia: Number(horasDia), bancoHoras: Number(bancoHoras) };
    saveCargos();
    return cargos[index];
}

/**
 * Deleta cargo
 */
function deleteCargo(id) {
    const index = cargos.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    cargos.splice(index, 1);
    saveCargos();
    return true;
}

/**
 * Renderiza lista de cargos
 */
function renderCargos() {
    const tbody = document.getElementById('cargo-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (cargos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">Nenhum cargo cadastrado.</td></tr>';
        return;
    }

    cargos.forEach(cargo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:10px;border:1px solid #e6e6e6;">${cargo.nome}</td>
            <td style="padding:10px;border:1px solid #e6e6e6;">${cargo.horasDia}h</td>
            <td style="padding:10px;border:1px solid #e6e6e6;color:#2ecc71;font-weight:bold;">${cargo.bancoHoras >= 0 ? '+' : ''}${cargo.bancoHoras}h</td>
            <td style="padding:10px;border:1px solid #e6e6e6;text-align:center;">
                <button onclick="editCargoModal(${cargo.id})" style="background:#3498db;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:5px;">Editar</button>
                <button onclick="deletCargoConfirm(${cargo.id})" style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Mostra modal para editar cargo
 */
function editCargoModal(id) {
    const cargo = getCargoById(id);
    if (!cargo) return;

    const novoNome = prompt('Novo nome do cargo:', cargo.nome);
    if (!novoNome) return;

    const novasHoras = prompt('Horas por dia:', cargo.horasDia);
    if (!novasHoras) return;

    // Prompt para banco de horas
    window.promptBancoHoras = function(current = 0) {
        let val = prompt('Banco de horas inicial (pode ser negativo, ex: -5):', current);
        if (val === null || val === '') return current;
        if (isNaN(val)) return current;
        return Number(val);
    };

    updateCargo(id, novoNome, novasHoras);
    renderCargos();
    showToast('Cargo atualizado!', 'success');
}

/**
 * Confirma deleção de cargo
 */
function deletCargoConfirm(id) {
    if (!confirm('Confirma exclusão deste cargo?')) return;
    deleteCargo(id);
    renderCargos();
    showToast('Cargo removido!', 'success');
}

/**
 * Inicializa o módulo de cargos
 */
function initCargosModule() {
    console.log('[CARGOS] Inicializando módulo');

    // Botão adicionar cargo
    const addBtn = document.getElementById('cargo-add-btn');
    if (addBtn) {
        addBtn.onclick = function() {
            const nome = document.getElementById('cargo-nome')?.value?.trim();
            const horas = document.getElementById('cargo-horas')?.value?.trim();

            if (!nome) {
                showToast('Nome do cargo é obrigatório.', 'warning');
                return;
            }
            if (!horas || horas <= 0) {
                showToast('Horas por dia deve ser maior que zero.', 'warning');
                return;
            }

            // Prompt para banco de horas
            window.promptBancoHoras = function(current = 0) {
                let val = prompt('Banco de horas inicial (pode ser negativo, ex: -5):', current);
                if (val === null || val === '') return current;
                if (isNaN(val)) return current;
                return Number(val);
            };
            const newCargo = addCargo(nome, horas);
            if (newCargo) {
                showToast('Cargo adicionado!', 'success');
                document.getElementById('cargo-nome').value = '';
                document.getElementById('cargo-horas').value = '8';
                renderCargos();
                
                // Atualizar selects de cargos em outras páginas
                updateCargoSelects();
            } else {
                showToast('Erro ao adicionar cargo.', 'error');
            }
        };
    }

    renderCargos();
}

/**
 * Atualiza todos os selects de cargos nas páginas
 */
function updateCargoSelects() {
    const selects = document.querySelectorAll('[data-cargo-select]');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Selecione um cargo';
        select.appendChild(option);

        getCargos().forEach(cargo => {
            const opt = document.createElement('option');
            opt.value = cargo.id;
            opt.textContent = cargo.nome;
            select.appendChild(opt);
        });

        if (currentValue) select.value = currentValue;
    });
}

/**
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

    // Verifica se cargo já existe
    if (getCargoByName(nome)) {
        showToast('Este cargo já existe no sistema.', 'warning');
        return;
    }

    // Cria cargo com banco de horas iniciando em 0
    const newId = cargos.length > 0 ? Math.max(...cargos.map(c => c.id)) + 1 : 1;
    const cargo = { 
        id: newId, 
        nome: nome, 
        horasDia: Number(horas), 
        bancoHoras: 0
    };
    
    cargos.push(cargo);
    saveCargos();
    
    // Fecha o modal de criação
    const createModal = document.querySelector('.modal-overlay[style*="10000"]');
    if (createModal) createModal.remove();
    
    // Atualiza select no modal de departamentos
    const cargoSelect = document.getElementById('cargos-dept-cargo-select');
    if (cargoSelect) {
        const option = document.createElement('option');
        option.value = cargo.id;
        option.textContent = cargo.nome;
        cargoSelect.appendChild(option);
        cargoSelect.value = cargo.id;
    }
    
    // Atualiza outros selects
    updateCargoSelects();
    
    showToast('Cargo criado com sucesso!', 'success');
}

// Inicializar dados ao carregar o script
initializeCargosData();
