// ==========================================
// DADOS DO SISTEMA TOP SERVICE
// ==========================================

/**
 * @typedef {Object} Employee
 * @property {number} id - ID único do funcionário
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

// Array de funcionários padrão com estrutura completa
const employeesData = [
    {
        id: 1,
        matricula: "MAT001",
        nome: "Ana Carolina Silva",
        cpf: "123.456.789-00",
        cargo: "Gerente de Projetos",
        departamento: "Condomínio A",
        email: "ana.silva@topservice.com",
        status: "Ativo",
        admissao: "2020-05-15",
        telefone: "(11) 98765-4321",
        endereco: "Rua A, 123"
    },
    {
        id: 2,
        matricula: "MAT002",
        nome: "Bruno Santos Oliveira",
        cpf: "234.567.890-11",
        cargo: "Coordenador de Limpeza",
        departamento: "Condomínio A",
        email: "bruno.santos@topservice.com",
        status: "Ativo",
        admissao: "2020-08-20",
        telefone: "(11) 98765-4322",
        endereco: "Rua B, 456"
    },
    {
        id: 3,
        matricula: "MAT003",
        nome: "Carla Mendes Costa",
        cpf: "345.678.901-22",
        cargo: "Assistente Administrativo",
        departamento: "Condomínio B",
        email: "carla.mendes@topservice.com",
        status: "Ativo",
        admissao: "2021-03-10",
        telefone: "(11) 98765-4323",
        endereco: "Rua C, 789"
    },
    {
        id: 4,
        matricula: "MAT004",
        nome: "Diego Ferreira Gomes",
        cpf: "456.789.012-33",
        cargo: "Gerente de Operações",
        departamento: "Condomínio B",
        email: "diego.ferreira@topservice.com",
        status: "Ativo",
        admissao: "2019-11-05",
        telefone: "(11) 98765-4324",
        endereco: "Rua D, 321"
    },
    {
        id: 5,
        matricula: "MAT005",
        nome: "Elisa Rocha Martins",
        cpf: "567.890.123-44",
        cargo: "Motorista",
        departamento: "Transporte",
        email: "elisa.rocha@topservice.com",
        status: "Ativo",
        admissao: "2020-02-15",
        telefone: "(11) 98765-4325",
        endereco: "Rua E, 654"
    },
    {
        id: 6,
        matricula: "MAT006",
        nome: "Felipe Alves Silva",
        cpf: "678.901.234-55",
        cargo: "Técnico de Manutenção",
        departamento: "Manutenção",
        email: "felipe.alves@topservice.com",
        status: "Ativo",
        admissao: "2021-06-01",
        telefone: "(11) 98765-4326",
        endereco: "Rua F, 987"
    }
];

// ===== Constantes de Persistência =====
const EMP_KEY = 'topservice_employees_v1';
const VALID_STATUSES = ['Ativo', 'Desligado', 'Férias', 'Afastado'];

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

// Variável global que armazena todos os funcionários
let employees = [];

/**
 * Inicializa o sistema de dados, carregando funcionários do localStorage ou usando defaults
 */
function initializeEmployeesData() {
    try {
        const stored = localStorage.getItem(EMP_KEY);
        employees = stored ? JSON.parse(stored) : [...employeesData];
        localStorage.setItem(EMP_KEY, JSON.stringify(employees));
        window.employees = employees; // Sincronizar variável global
        console.log('✅ Funcionários carregados:', employees.length);
    } catch (e) {
        console.error('Erro ao carregar employees do localStorage, usando defaults:', e);
        employees = [...employeesData];
        window.employees = employees;
    }
}

/**
 * Persiste a lista de funcionários no localStorage
 * @throws {Error} Se houver erro ao salvar
 */
function saveEmployees() {
    // Apenas agenda com debounce, não salva diretamente
    scheduleSaveEmployees();
}

// Inicializar dados ao carregar o script
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
 * @param {number} id - ID do funcionário
 * @returns {Employee|null} Dados do funcionário ou null se não encontrado
 */
function getEmployeeById(id) {
    if (!Number.isInteger(id) || id <= 0) return null;
    return employees.find(emp => emp.id === id) || null;
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
    
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    
    const newEmployee = {
        id: newId,
        ...employee,
        status: employee.status || 'Ativo'
    };
    
    console.log('📌 Novo funcionário criado com ID:', newId);
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
 * @param {number} id - ID do funcionário
 * @param {Object} updatedData - Novos dados (apenas campos a atualizar)
 * @returns {Employee|null} Funcionário atualizado ou null se falhar
 */
function updateEmployee(id, updatedData) {
    const index = employees.findIndex(emp => emp.id === id);
    
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