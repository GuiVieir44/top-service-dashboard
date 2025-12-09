// Script de teste para verificar adiantamentos
console.log('=== TESTE DE ADIANTAMENTOS ===\n');

// Simular dados
function testAdiantamentos() {
    // Dados de teste
    const testPunches = [
        {
            id: 1,
            employeeId: 1,
            type: 'Entrada',
            timestamp: new Date().toISOString().split('T')[0] + 'T07:45:00'
        },
        {
            id: 2,
            employeeId: 1,
            type: 'Saída',
            timestamp: new Date().toISOString().split('T')[0] + 'T12:00:00'
        }
    ];
    
    const testEmployee = {
        id: 1,
        nome: 'João Silva',
        matricula: '001',
        cargo: 'Gerente',
        departamento: 'TI',
        horaInicio: '08:00'
    };
    
    console.log('📌 FUNCIONÁRIO:');
    console.log(`Nome: ${testEmployee.nome}`);
    console.log(`Hora de Início Esperada: ${testEmployee.horaInicio}`);
    console.log();
    
    console.log('📌 PONTOS DO DIA:');
    testPunches.forEach(p => {
        console.log(`${p.type}: ${p.timestamp}`);
    });
    console.log();
    
    // Calcular adiantamento
    const entradaPunch = testPunches.find(p => p.type === 'Entrada');
    if (entradaPunch) {
        const entradaTime = new Date(entradaPunch.timestamp);
        const [horaEsp, minEsp] = testEmployee.horaInicio.split(':').map(Number);
        
        const horaEsperada = new Date(entradaTime);
        horaEsperada.setHours(horaEsp, minEsp, 0, 0);
        
        const diffMs = horaEsperada - entradaTime;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = (diffMin / 60).toFixed(2);
        
        console.log('🔍 CÁLCULO:');
        console.log(`Entrada Real: ${entradaTime.toLocaleTimeString('pt-BR')}`);
        console.log(`Entrada Esperada: ${horaEsperada.toLocaleTimeString('pt-BR')}`);
        console.log(`Diferença: ${diffMin} minutos = ${diffHoras}h`);
        console.log();
        
        if (diffMin > 0) {
            console.log(`✅ ADIANTAMENTO DETECTADO: +${diffMin} minutos (+${diffHoras}h)`);
        } else {
            console.log(`❌ Sem adiantamento`);
        }
    }
}

testAdiantamentos();

// Agora verificar dados reais do localStorage
console.log('\n=== DADOS REAIS NO LOCALSTORAGE ===\n');

try {
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    
    console.log(`📊 Total de Pontos: ${punches.length}`);
    console.log(`👥 Total de Funcionários: ${employees.length}\n`);
    
    if (employees.length > 0) {
        console.log('🧑 FUNCIONÁRIOS:');
        employees.forEach(emp => {
            console.log(`  - ${emp.matricula} ${emp.nome} | Hora: ${emp.horaInicio || 'não definida'}`);
        });
        console.log();
    }
    
    // Verificar pontos de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today);
    
    if (todayPunches.length > 0) {
        console.log(`📅 PONTOS DE HOJE (${today}):`);
        todayPunches.forEach(p => {
            const emp = employees.find(e => e.id == p.employeeId);
            const empName = emp ? emp.nome : `ID ${p.employeeId}`;
            console.log(`  - ${p.type}: ${p.timestamp} (${empName})`);
        });
    } else {
        console.log(`📭 Nenhum ponto registrado hoje`);
    }
    
} catch (e) {
    console.error('❌ Erro ao acessar localStorage:', e);
}
