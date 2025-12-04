// Preenche o select de departamentos
function preencherDepartamentosSelect() {
    const select = document.getElementById('departamento-select');
    if (!select || typeof loadDepartments !== 'function') return;
    const departamentos = loadDepartments();
    select.innerHTML = '<option value="">Selecione</option>' + departamentos.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

// Gera relatório completo por departamento
function gerarRelatorioDepartamento() {
    const deptId = document.getElementById('departamento-select').value;
    const tabela = document.getElementById('tabela-relatorio-departamento').querySelector('tbody');
    if (!deptId || !tabela) return;
    tabela.innerHTML = '';
    const employees = typeof getEmployees === 'function' ? getEmployees() : [];
    const punches = typeof loadPunches === 'function' ? loadPunches() : [];
    const afastamentos = typeof loadAfastamentos === 'function' ? loadAfastamentos() : [];
    const atrasos = JSON.parse(localStorage.getItem('topservice_delays_v1') || '[]');
    // Filtra funcionários do departamento
    const colaboradores = employees.filter(e => String(e.departamento) === String(deptId));
    colaboradores.forEach(emp => {
        // Ponto
        const pontos = punches.filter(p => String(p.employeeId) === String(emp.id));
        // Faltas (sem ponto em dias úteis)
        // Simples: se não tem ponto em um dia útil, conta como falta
        // Atrasos
        const atrasosEmp = atrasos.filter(a => String(a.employeeId) === String(emp.id));
        // Hora extra (exemplo: tipo 'Extra' ou campo específico)
        const horasExtras = pontos.filter(p => p.type && p.type.toLowerCase().includes('extra')).length;
        // Afastamentos
        const afastEmp = afastamentos.filter(a => String(a.employeeId) === String(emp.id));
        tabela.innerHTML += `<tr>
            <td>${emp.nome}</td>
            <td>${pontos.length}</td>
            <td>-</td>
            <td>${atrasosEmp.length}</td>
            <td>${horasExtras}</td>
            <td>${afastEmp.length}</td>
        </tr>`;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    preencherDepartamentosSelect();
    var btn = document.getElementById('gerar-relatorio-departamento');
    if (btn) {
        btn.addEventListener('click', gerarRelatorioDepartamento);
    }
});

// Garante que o select de departamentos seja preenchido ao mostrar a aba Relatórios
document.addEventListener('showPageContent', function(e) {
    if (e.detail === 'relatorios-content') {
        preencherDepartamentosSelect();
    }
});
