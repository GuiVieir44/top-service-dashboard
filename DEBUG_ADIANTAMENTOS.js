// Script de debug - cole no console do navegador

console.log('=== DEBUG ADIANTAMENTOS ===\n');

// 1. Verificar dados no localStorage
const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');

console.log('📊 DADOS:');
console.log(`Pontos: ${punches.length}`);
console.log(`Funcionários: ${employees.length}\n`);

// 2. Mostrar funcionários
if (employees.length > 0) {
    console.log('👥 FUNCIONÁRIOS:');
    employees.forEach((e, i) => {
        console.log(`${i+1}. ${e.nome} (ID: ${e.id}) - Hora: ${e.horaInicio || '❌ NÃO DEF.'}`);
    });
    console.log();
}

// 3. Verificar pontos de hoje
const today = new Date().toISOString().split('T')[0];
const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today);

console.log(`📅 PONTOS HOJE (${today}):`);
if (todayPunches.length === 0) {
    console.log('❌ Nenhum ponto registrado hoje');
} else {
    todayPunches.forEach(p => {
        const emp = employees.find(e => e.id == p.employeeId);
        const time = new Date(p.timestamp).toLocaleTimeString('pt-BR');
        console.log(`  ${time} - ${p.type} (${emp ? emp.nome : 'ID ' + p.employeeId})`);
    });
}
console.log();

// 4. Testar calculateDailyBalance para cada funcionário
if (typeof calculateDailyBalance === 'function') {
    console.log('🔍 TESTANDO calculateDailyBalance:');
    const today = new Date();
    employees.forEach(emp => {
        const balance = calculateDailyBalance(emp.id, today);
        if (balance) {
            console.log(`\n${emp.nome}:`);
            console.log(`  Trabalhadas: ${balance.horasTrabalhadas}h`);
            console.log(`  Esperadas: ${balance.horasEsperadas}h`);
            console.log(`  Tipo: ${balance.tipo}`);
            console.log(`  Adiantamento: ${balance.adiantamentoMinutos}min (${balance.adiantamentoHoras}h)`);
        }
    });
}
