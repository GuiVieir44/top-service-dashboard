// ==========================================
// DADOS DO SISTEMA TOP SERVICE
// ==========================================

// Array de funcionários com a estrutura completa
const employeesData = [
    {
        id: 1,
        matricula: "MAT001",           // Identificador único do funcionário (login futuro)
        nome: "Ana Carolina Silva",
        cpf: "123.456.789-00",         // CPF do funcionário
        cargo: "Gerente de Projetos",
        departamento: "Condomínio A",  // Departamento/Condomínio
        email: "ana.silva@topservice.com",
        status: "Ativo",               // Ativo ou Desligado
        admissao: "2020-05-15",        // Data de admissão
        telefone: "(11) 98765-4321",   // Telefone para contato
        endereco: "Rua A, 123"         // Endereço
    },
    // ... mais funcionários ...
];

// Variável global que armazena todos os funcionários
let employees = [...employeesData];
/**
 * Obtém a lista completa de funcionários
 * @returns {Array} Array com todos os funcionários
 */
function getEmployees() {
    return employees;
}

/**
 * Obtém o total de funcionários cadastrados
 * @returns {Number} Quantidade de funcionários
 */
function getTotalEmployees() {
    return employees.length;
}

/**
 * Obtém um funcionário específico pelo ID
 * @param {Number} id - ID do funcionário
 * @returns {Object} Dados do funcionário ou null se não encontrado
 */
function getEmployeeById(id) {
    return employees.find(emp => emp.id === id) || null;
}
/**
 * Adiciona um novo funcionário ao array
 * @param {Object} employee - Dados do novo funcionário
 * @returns {Object} O funcionário adicionado com ID gerado
 */
function addEmployee(employee) {
    // Gera um novo ID (maior ID atual + 1)
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    
    // Cria o novo funcionário com o ID gerado
    const newEmployee = {
        id: newId,
        ...employee  // Copia todos os dados do employee passado
    };
    
    // Adiciona ao array
    employees.push(newEmployee);
    
    // Retorna o novo funcionário
    return newEmployee;
}

/**
 * Atualiza os dados de um funcionário existente
 * @param {Number} id - ID do funcionário a atualizar
 * @param {Object} updatedData - Novos dados do funcionário
 * @returns {Boolean} true se atualizado com sucesso, false se não encontrado
 */
function updateEmployee(id, updatedData) {
    const index = employees.findIndex(emp => emp.id === id);
    
    if (index !== -1) {
        // Mantém o ID original e atualiza o resto dos dados
        employees[index] = {
            ...employees[index],
            ...updatedData,
            id: employees[index].id  // Garante que o ID não mude
        };
        return true;
    }
    
    return false;
}

/**
 * Remove um funcionário do array
 * @param {Number} id - ID do funcionário a remover
 * @returns {Boolean} true se removido com sucesso, false se não encontrado
 */
function deleteEmployee(id) {
    const index = employees.findIndex(emp => emp.id === id);
    
    if (index !== -1) {
        employees.splice(index, 1);  // Remove 1 elemento a partir do índice
        return true;
    }
    
    return false;
}

/**
 * Busca funcionários por um termo (nome, matrícula, email)
 * @param {String} searchTerm - Termo a buscar
 * @returns {Array} Array com funcionários que correspondem à busca
 */
function searchEmployees(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    return employees.filter(emp => 
        emp.nome.toLowerCase().includes(term) ||
        emp.matricula.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.cpf.includes(term)
    );
}

/**
 * Obtém todos os departamentos únicos
 * @returns {Array} Array com nomes dos departamentos
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
    return {
        ativo: employees.filter(emp => emp.status === "Ativo").length,
        desligado: employees.filter(emp => emp.status === "Desligado").length
    };
}