// ==========================================
// MÓDULO DE CARGOS POR DEPARTAMENTO
// ==========================================
// Vincula cargos globais a departamentos (condomínios)
// Permite customizar horários por departamento

var CARGO_DEPT_KEY = 'topservice_cargos_departamento_v1';

/**
 * Calcula horas efetivas levando em conta horários noturnos
 * Ex: 19:00 às 07:00 = 12 horas
 */
function calcularHorasEfetivas(horaInicio, horaFim, intervaloAlmoco) {
    const [inicioH, inicioM] = (horaInicio || '08:00').split(':').map(Number);
    const [fimH, fimM] = (horaFim || '17:00').split(':').map(Number);
    
    let minutosTotais = (fimH * 60 + fimM) - (inicioH * 60 + inicioM);
    
    // Se resultado negativo, é horário noturno (cruza meia-noite)
    if (minutosTotais < 0) {
        minutosTotais += 24 * 60; // Adiciona 24 horas
    }
    
    const horasEfetivas = (minutosTotais - (intervaloAlmoco || 60)) / 60;
    return Math.round(horasEfetivas * 100) / 100;
}

/**
 * Carrega cargos customizados para um departamento específico
 * Se não houver customização, retorna vazio (deve usar cargo global como padrão)
 */
function loadCargosDepartamento() {
    try {
        return JSON.parse(localStorage.getItem(CARGO_DEPT_KEY) || '[]');
    } catch (e) {
        console.error('Erro ao carregar cargos por departamento:', e);
        return [];
    }
}

/**
 * Salva cargos customizados para departamentos
 */
function saveCargosDepartamento(list) {
    try {
        localStorage.setItem(CARGO_DEPT_KEY, JSON.stringify(list));
        // Dual-save para garantir persistência
        setTimeout(() => localStorage.setItem(CARGO_DEPT_KEY, JSON.stringify(list)), 100);
    } catch (e) {
        console.error('Erro ao salvar cargos por departamento:', e);
    }
}

/**
 * Obtém todos os cargos de um departamento específico
 * @param {string|number} departmentId - ID do departamento (condomínio)
 * @returns {Array} Array de cargos customizados para este departamento
 */
function getCargosByDepartment(departmentId) {
    const all = loadCargosDepartamento();
    const deptIdStr = String(departmentId);
    return all.filter(cd => String(cd.departmentId) === deptIdStr);
}

/**
 * Obtém um cargo customizado de um departamento
 * @param {string|number} departmentId - ID do departamento
 * @param {number} cargoId - ID do cargo global
 * @returns {Object|null} Cargo customizado ou null
 */
function getCargoCustomizado(departmentId, cargoId) {
    const all = loadCargosDepartamento();
    const deptIdStr = String(departmentId);
    return all.find(cd => String(cd.departmentId) === deptIdStr && cd.cargoId === Number(cargoId)) || null;
}

/**
 * Vincula um cargo global a um departamento com horário customizável
 * @param {string|number} departmentId - ID do departamento
 * @param {number} cargoId - ID do cargo global
 * @param {string} horaInicio - Hora de início (ex: "08:00")
 * @param {string} horaFim - Hora de fim (ex: "17:00")
 * @param {number} intervaloAlmoco - Duração do intervalo em minutos (ex: 60)
 * @returns {Object} Cargo departamento criado
 */
function adicionarCargoDepartamento(departmentId, cargoId, horaInicio, horaFim, intervaloAlmoco) {
    console.log('[CARGOS-DEPT] Adicionando cargo:', { departmentId, cargoId, horaInicio, horaFim, intervaloAlmoco });
    const all = loadCargosDepartamento();
    
    // Verifica se já existe
    if (getCargoCustomizado(departmentId, cargoId)) {
        console.warn('Cargo já vinculado a este departamento');
        return null;
    }
    
    const id = all.length > 0 ? Math.max(...all.map(cd => cd.id)) + 1 : 1;
    const cargoGlobal = typeof getCargoById === 'function' ? getCargoById(cargoId) : null;
    
    if (!cargoGlobal) {
        console.warn('Cargo global não encontrado:', cargoId);
        return null;
    }
    
    // Calcula horas efetivas (suporta horários noturnos)
    const horasEfetivas = calcularHorasEfetivas(horaInicio, horaFim, intervaloAlmoco);
    
    const novo = {
        id,
        departmentId: departmentId, // Mantém como string ou número
        cargoId: Number(cargoId),
        cargoNome: cargoGlobal.nome,
        horaInicio: horaInicio || '08:00',
        horaFim: horaFim || '17:00',
        intervaloAlmoco: intervaloAlmoco || 60, // em minutos
        horasEfetivas: horasEfetivas,
        bancoHoras: 0,
        dataCriacao: new Date().toISOString()
    };
    
    all.push(novo);
    saveCargosDepartamento(all);
    console.log('[CARGOS-DEPT] Cargo adicionado com sucesso:', novo);
    return novo;
}

/**
 * Atualiza horário de um cargo no departamento
 */
function atualizarCargoDepartamento(departmentId, cargoId, horaInicio, horaFim, intervaloAlmoco) {
    const all = loadCargosDepartamento();
    const deptIdStr = String(departmentId);
    const index = all.findIndex(cd => String(cd.departmentId) === deptIdStr && cd.cargoId === Number(cargoId));
    
    if (index === -1) return null;
    
    // Recalcula horas efetivas (suporta horários noturnos)
    const horasEfetivas = calcularHorasEfetivas(horaInicio, horaFim, intervaloAlmoco);
    
    all[index] = {
        ...all[index],
        horaInicio: horaInicio || '08:00',
        horaFim: horaFim || '17:00',
        intervaloAlmoco: intervaloAlmoco || 60,
        horasEfetivas: horasEfetivas
    };
    
    saveCargosDepartamento(all);
    return all[index];
}

/**
 * Remove um cargo de um departamento
 */
function removerCargoDepartamento(departmentId, cargoId) {
    if (!confirm('Confirma remoção deste cargo do departamento?')) return false;
    
    const deptIdStr = String(departmentId);
    const all = loadCargosDepartamento().filter(cd => !(String(cd.departmentId) === deptIdStr && cd.cargoId === Number(cargoId)));
    saveCargosDepartamento(all);
    return true;
}

/**
 * Renderiza tabela de cargos para um departamento
 */
function renderCargosDepartamento(departmentId) {
    const tbody = document.getElementById('cargos-dept-body');
    if (!tbody) return;
    
    const cargos = getCargosByDepartment(departmentId);
    tbody.innerHTML = '';
    
    if (!cargos || cargos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Nenhum cargo vinculado a este departamento. Adicione um para começar.</td></tr>';
        return;
    }
    
    cargos.forEach(cd => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cd.cargoNome}</td>
            <td style="text-align:center;">${cd.horaInicio}</td>
            <td style="text-align:center;">${cd.horaFim}</td>
            <td style="text-align:center;">${cd.intervaloAlmoco}min</td>
            <td style="text-align:center;"><strong>${cd.horasEfetivas}h</strong></td>
            <td style="text-align:center;">${cd.bancoHoras}</td>
            <td style="text-align:center;">
                <button class="btn btn-secondary" onclick="editarCargoDeptUI(${departmentId}, ${cd.cargoId})" style="margin-right:4px;">Editar</button>
                <button class="btn btn-danger" onclick="removerCargoDeptUI(${departmentId}, ${cd.cargoId})">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * UI: Abre formulário para editar cargo do departamento
 */
function editarCargoDeptUI(departmentId, cargoId) {
    const cargo = getCargoCustomizado(departmentId, cargoId);
    if (!cargo) return;
    
    const novaInicio = prompt('Hora de Início (HH:MM):', cargo.horaInicio);
    if (novaInicio === null) return;
    
    const novaFim = prompt('Hora de Fim (HH:MM):', cargo.horaFim);
    if (novaFim === null) return;
    
    const novoIntervalo = prompt('Intervalo de Almoço (minutos):', cargo.intervaloAlmoco);
    if (novoIntervalo === null) return;
    
    atualizarCargoDepartamento(departmentId, cargoId, novaInicio, novaFim, Number(novoIntervalo));
    renderCargosDepartamento(departmentId);
    showToast('Cargo atualizado!', 'success');
}

/**
 * UI: Remove cargo do departamento
 */
function removerCargoDeptUI(departmentId, cargoId) {
    if (removerCargoDepartamento(departmentId, cargoId)) {
        renderCargosDepartamento(departmentId);
        showToast('Cargo removido!', 'success');
    }
}

/**
 * Inicializa módulo de gerenciamento de cargos por departamento
 * Chamado ao abrir o modal de cargos de um departamento
 */
function initCargosDeptoModule(departmentId) {
    console.log('[CARGOS-DEPT] Inicializando para departamento:', departmentId);
    
    const addBtn = document.getElementById('cargos-dept-add-btn');
    if (addBtn) {
        addBtn.onclick = function() {
            const cargoSelect = document.getElementById('cargos-dept-cargo-select');
            const horaInicio = document.getElementById('cargos-dept-inicio');
            const horaFim = document.getElementById('cargos-dept-fim');
            const intervalo = document.getElementById('cargos-dept-intervalo');
            
            if (!cargoSelect.value) {
                showToast('Selecione um cargo', 'warning');
                return;
            }
            
            const cargoId = Number(cargoSelect.value);
            const inicio = horaInicio.value || '08:00';
            const fim = horaFim.value || '17:00';
            const interv = intervalo.value ? Number(intervalo.value) : 60;
            
            const result = adicionarCargoDepartamento(departmentId, cargoId, inicio, fim, interv);
            if (result) {
                showToast('Cargo adicionado!', 'success');
                renderCargosDepartamento(departmentId);
                cargoSelect.value = '';
                horaInicio.value = '08:00';
                horaFim.value = '17:00';
                intervalo.value = '60';
            } else {
                showToast('Erro ao adicionar cargo', 'error');
            }
        };
    }
    
    renderCargosDepartamento(departmentId);
}
