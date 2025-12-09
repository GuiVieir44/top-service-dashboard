// ==========================================
// DADOS DO SISTEMA TOP SERVICE
// ==========================================

/**
 * @typedef {Object} Employee
 * @property {string} id - UUID único do funcionário
 * @property {string} matricula - Matrícula (ex: MAT001)
 * @property {string} nome - Nome completo
 * @property {string} cpf - CPF formatado
 * @property {string} cargo - Cargo/Posição
 * @property {string} departamento - Departamento/Condomínio
 * @property {string} email - Email corporativo
 * @property {string} status - Status (Ativo, Desligado, Férias, Afastado)
 * @property {string} admissao - Data de admissão (YYYY-MM-DD)
 * @property {string} telefone - Telefone de contato
 * @property {string} endereco - Endereço residencial
 */

// Array de funcionários (mantido em memória)
const employeesData = [];

// ===== Constantes de Persistência =====
const EMP_KEY = 'topservice_employees_v1';
const VALID_STATUSES = ['Ativo', 'Desligado', 'Férias', 'Afastado'];

// Variável global que armazena todos os funcionários (precisa existir antes do IIFE)
let employees = [];
window.employees = employees;

// Remove duplicados por ID (prioritário) ou matrícula, mantendo a última ocorrência
function dedupeEmployees(list) {
    if (!Array.isArray(list)) return [];

    const seenIds = new Set();
    const seenMatriculas = new Set();
    const result = [];

    for (let i = list.length - 1; i >= 0; i--) {
        const emp = list[i];
        if (!emp) continue;

        const idKey = emp.id ? String(emp.id).trim() : '';
        const matriculaKey = emp.matricula ? String(emp.matricula).toLowerCase().trim() : '';

        const hasId = idKey && seenIds.has(idKey);
        const hasMatricula = matriculaKey && seenMatriculas.has(matriculaKey);
        if (hasId || hasMatricula) continue;

        if (idKey) {
            seenIds.add(idKey);
        }
        if (matriculaKey) {
            seenMatriculas.add(matriculaKey);
        }

        if (!idKey && !matriculaKey) {
            continue;
        }

        result.unshift(emp);
    }

    return result;
}
window.dedupeEmployees = dedupeEmployees;

// ===== GERAR UUID =====
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Inicializar dados do localStorage IMEDIATAMENTE
(function() {
    try {
        const stored = localStorage.getItem(EMP_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                employees = dedupeEmployees(parsed);
                window.employees = employees;
                if (employees.length !== parsed.length) {
                    localStorage.setItem(EMP_KEY, JSON.stringify(employees));
                }
                console.log('✅ [data.js] Funcionários carregados:', employees.length);
            }
        }
    } catch (e) {
        console.error('❌ [data.js] Erro ao carregar funcionários:', e);
    }
})();

// ===== DEBOUNCING =====
let saveEmployeesTimeout = null;
const SAVE_DEBOUNCE_DELAY = 300; // ms

/**
 * Agenda salvamento com debounce
 */
function scheduleSaveEmployees() {
    if (saveEmployeesTimeout) {
        clearTimeout(saveEmployeesTimeout);
    }
    
    saveEmployeesTimeout = setTimeout(() => {
        performSaveEmployees();
    }, SAVE_DEBOUNCE_DELAY);
}

/**
 * Executa o salvamento real
 */
function performSaveEmployees() {
    try {
        employees = dedupeEmployees(employees);
        localStorage.setItem(EMP_KEY, JSON.stringify(employees));
        window.employees = employees; // Manter sincronizado
        
        // Notificar persistência global
        if (typeof window.scheduleDebouncedsave === 'function') {
            window.scheduleDebouncedsave();
        }
        
        // Disparar evento para UI
        window.dispatchEvent(new CustomEvent('employeesChanged', { detail: { count: employees.length } }));
        
        console.log('✅ Funcionários salvos com debounce -', employees.length, 'registros');
    } catch (e) {
        console.error('Erro ao salvar funcionários:', e);
    }
}

/**
 * Inicializa o sistema de dados, carregando funcionários do localStorage
 * NÃO usa defaults - dados vêm do Supabase
 */
function initializeEmployeesData() {
    try {
        const stored = localStorage.getItem(EMP_KEY);
        // NÃO usar employeesData como fallback - começar vazio
        const parsed = stored ? JSON.parse(stored) : [];
        employees = dedupeEmployees(parsed);
        window.employees = employees;
        if (employees.length !== parsed.length) {
            localStorage.setItem(EMP_KEY, JSON.stringify(employees));
        }
        console.log('✅ Funcionários carregados do localStorage:', employees.length);
    } catch (e) {
        console.error('Erro ao carregar employees do localStorage:', e);
        employees = [];
        window.employees = employees;
    }
}

// Força atualizar o cache em memória a partir de dados fornecidos ou do localStorage
window.refreshEmployeesCache = function(data = null) {
    try {
        const src = data ? data : JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
        const cleaned = dedupeEmployees(Array.isArray(src) ? src : []);
        employees = cleaned;
        window.employees = employees;
        localStorage.setItem(EMP_KEY, JSON.stringify(employees));
        console.log('🔄 refreshEmployeesCache:', employees.length, 'registros');
    } catch (e) {
        console.error('❌ refreshEmployeesCache falhou:', e);
    }
};

/**
 * Persiste a lista de funcionários no localStorage
 * @throws {Error} Se houver erro ao salvar
 */
function saveEmployees() {
    // Apenas agenda com debounce, não salva diretamente
    scheduleSaveEmployees();
}

// Inicializar automaticamente para garantir que o localStorage carregue os dados
initializeEmployeesData();

/**
 * Obtém a lista completa de funcionários
 * @returns {Employee[]} Array com todos os funcionários
 */
function getEmployees() {
    return [...employees]; // Retorna cópia para evitar mutação externa
}

/**
 * Obtém o total de funcionários cadastrados
 * @returns {number} Quantidade de funcionários
 */
function getTotalEmployees() {
    return employees.length;
}

/**
 * Obtém um funcionário específico pelo ID com validação
 * @param {string|number} id - ID do funcionário (UUID ou número legado)
 * @returns {Employee|null} Dados do funcionário ou null se não encontrado
 */
function getEmployeeById(id) {
    if (id === undefined || id === null) return null;
    const idStr = String(id);
    return employees.find(emp => String(emp.id) === idStr) || null;
}

/**
 * Valida estrutura de dados do funcionário
 * @param {Object} employee - Dados do funcionário a validar
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateEmployee(employee) {
    const errors = [];
    
    if (!employee.nome || typeof employee.nome !== 'string' || employee.nome.trim() === '') 
        errors.push('Nome é obrigatório');
    if (!employee.matricula || typeof employee.matricula !== 'string') 
        errors.push('Matrícula é obrigatória');
    // Email é opcional agora
    if (employee.email && !employee.email.includes('@')) 
        errors.push('Email inválido');
    // Departamento é opcional agora
    if (!VALID_STATUSES.includes(employee.status)) 
        errors.push(`Status deve ser um de: ${VALID_STATUSES.join(', ')}`);
    
    return { 
        valid: errors.length === 0, 
        errors 
    };
}

/**
 * Adiciona um novo funcionário com validação
 * @param {Object} employee - Dados do novo funcionário
 * @returns {Employee|null} O funcionário adicionado ou null se inválido
 */
function addEmployee(employee) {
    console.log('➕ addEmployee() INICIADO com:', employee);
    const validation = validateEmployee(employee);
    if (!validation.valid) {
        console.warn('❌ Erro ao adicionar funcionário:', validation.errors);
        return null;
    }
    
    // Usar UUID em vez de ID numérico
    const newId = generateUUID();
    
    const newEmployee = {
        id: newId,
        ...employee,
        status: employee.status || 'Ativo'
    };
    
    console.log('📌 Novo funcionário criado com UUID:', newId);
    employees.push(newEmployee);
    console.log('📊 Total funcionários antes de salvar:', employees.length);
    
    // Salvar localmente
    saveEmployees();
    
    // Sincronizar com Supabase Realtime
    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando funcionário para Supabase Realtime...');
        window.supabaseRealtime.insert('employees', newEmployee);
    }
    
    console.log('✅ addEmployee() CONCLUÍDO com sucesso');
    return newEmployee;
}

/**
 * Atualiza dados de um funcionário existente com validação
 * @param {string} id - ID (UUID) do funcionário
 * @param {Object} updatedData - Novos dados (apenas campos a atualizar)
 * @returns {Employee|null} Funcionário atualizado ou null se falhar
 */
function updateEmployee(id, updatedData) {
    // Converter para string para comparação consistente
    const idStr = String(id);
    const index = employees.findIndex(emp => String(emp.id) === idStr);
    
    if (index === -1) {
        console.warn(`Funcionário com ID ${id} não encontrado`);
        return null;
    }
    
    const updated = { ...employees[index], ...updatedData, id };
    const validation = validateEmployee(updated);
    
    if (!validation.valid) {
        console.warn('Dados inválidos para atualização:', validation.errors);
        return null;
    }
    
    employees[index] = updated;
    saveEmployees();
    
    // Sincronizar com Supabase Realtime
    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando funcionário no Supabase Realtime...');
        window.supabaseRealtime.update('employees', id, updated);
    }
    
    return updated;
}

/**
 * Remove um funcionário pelo ID
 * @param {number} id - ID do funcionário
 * @returns {boolean} true se removido, false se não encontrado
 */
function deleteEmployee(id) {
    // Converter para string para comparação consistente
    const idStr = String(id);
    const index = employees.findIndex(emp => String(emp.id) === idStr);
    
    if (index === -1) {
        console.warn(`Funcionário com ID ${id} não encontrado`);
        return false;
    }
    
    employees.splice(index, 1);
    saveEmployees();
    
    // Sincronizar com Supabase Realtime
    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo funcionário do Supabase Realtime...');
        window.supabaseRealtime.remove('employees', id);
    }
    
    return true;
}

/**
 * Busca funcionários por termo (nome, matrícula, email, CPF)
 * @param {string} searchTerm - Termo de busca (case-insensitive)
 * @returns {Employee[]} Array com funcionários encontrados
 */
function searchEmployees(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    
    const term = searchTerm.toLowerCase().trim();
    
    return employees.filter(emp => 
        emp.nome.toLowerCase().includes(term) ||
        emp.matricula.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.cpf.includes(term)
    );
}

/**
 * Obtém departamentos únicos ordenados alfabeticamente
 * @returns {string[]} Array de nomes de departamentos
 */
function getDepartments() {
    const departments = [...new Set(employees.map(emp => emp.departamento))];
    return departments.sort();
}

/**
 * Conta funcionários por status
 * @returns {Object} Objeto com contagem por status
 */
function getEmployeesByStatus() {
    const result = {};
    
    VALID_STATUSES.forEach(status => {
        result[status.toLowerCase()] = employees.filter(emp => emp.status === status).length;
    });
    
    return result;
}