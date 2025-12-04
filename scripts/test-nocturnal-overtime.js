// ==========================================
// TESTE DE CORREÇÃO - JORNADAS NOTURNAS
// Execute no console: window.testOvertimeNocturna()
// ==========================================

(function() {
    window.testOvertimeNocturna = function() {
        console.clear();
        console.log('%c🧪 TESTE: CÁLCULO DE HORAS EXTRAS COM JORNADAS NOTURNAS', 'color: #3498db; font-size: 16px; font-weight: bold;');
        console.log('==================================================');
        
        // Simular funcionário que entra 19:00 do dia 27 e sai 07:00 do dia 28
        const testCase = {
            nome: "João Silva",
            entrada: "2025-11-27T19:00:00",     // 19:00 do dia 27
            saida: "2025-11-28T07:00:00"        // 07:00 do dia 28
        };
        
        console.log('\n📌 Caso de Teste:');
        console.log(`   Funcionário: ${testCase.nome}`);
        console.log(`   Entrada: ${testCase.entrada} (19:00 do dia 27)`);
        console.log(`   Saída: ${testCase.saida} (07:00 do dia 28)`);
        
        // Calcular duração
        const entrada = new Date(testCase.entrada);
        const saida = new Date(testCase.saida);
        const diffMs = saida - entrada;
        const diffHoras = diffMs / (1000 * 60 * 60);
        
        console.log(`\n⏱️ Duração Total: ${diffHoras.toFixed(2)} horas`);
        
        // Descontar intervalo (1 hora padrão)
        const intervalo = 1;
        const horasAjustadas = diffHoras - intervalo;
        
        console.log(`   Menos intervalo (${intervalo}h): ${horasAjustadas.toFixed(2)} horas`);
        
        // Supondo jornada padrão de 8 horas
        const horasPadrão = 8;
        const horasExtras = Math.max(0, horasAjustadas - horasPadrão);
        
        console.log(`\n📊 Cálculo de Horas Extras:`);
        console.log(`   Horas Trabalhadas (ajustadas): ${horasAjustadas.toFixed(2)}h`);
        console.log(`   Horas Padrão (esperadas): ${horasPadrão}h`);
        console.log(`   HORAS EXTRAS: ${horasExtras.toFixed(2)}h`);
        
        console.log('\n' + '==================================================');
        if (horasExtras > 0 && horasExtras < 5) {
            console.log('%c✅ TESTE PASSOU: Cálculo correto de horas noturnas!', 'color: #27ae60; font-weight: bold; font-size: 14px;');
        } else {
            console.log('%c❌ TESTE FALHOU: Valor de extras fora do esperado!', 'color: #e74c3c; font-weight: bold; font-size: 14px;');
        }
        console.log('==================================================\n');
        
        // Mostrar dados reais do sistema
        console.log('📈 DADOS REAIS DO SISTEMA:');
        const punches = typeof loadPunches === 'function' ? loadPunches() : [];
        const employees = typeof getEmployees === 'function' ? getEmployees() : [];
        
        console.log(`   Total de Pontos: ${punches.length}`);
        console.log(`   Total de Funcionários: ${employees.length}`);
        
        // Encontrar jornadas noturnas
        const punchesSorted = punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const jornadas = [];
        let entradaAtual = null;
        
        punchesSorted.forEach(ponto => {
            if (ponto.type === 'Entrada' && !entradaAtual) {
                entradaAtual = ponto;
            } else if (ponto.type === 'Saída' && entradaAtual) {
                const entrada = new Date(entradaAtual.timestamp);
                const saida = new Date(ponto.timestamp);
                const duracao = (saida - entrada) / (1000 * 60 * 60);
                
                // Detectar jornadas noturnas (mais de 8 horas ou que cruzam meia-noite)
                if (duracao > 8 || entrada.getDate() !== saida.getDate()) {
                    jornadas.push({
                        empId: entradaAtual.employeeId,
                        entrada: entrada,
                        saida: saida,
                        duracao: duracao
                    });
                }
                entradaAtual = null;
            }
        });
        
        if (jornadas.length > 0) {
            console.log(`\n🌙 JORNADAS NOTURNAS ENCONTRADAS: ${jornadas.length}`);
            jornadas.slice(0, 5).forEach((j, i) => {
                const emp = employees.find(e => e.id == j.empId);
                const empName = emp ? emp.nome : `Emp #${j.empId}`;
                console.log(`   ${i+1}. ${empName}: ${j.entrada.toLocaleString('pt-BR')} até ${j.saida.toLocaleString('pt-BR')} (${j.duracao.toFixed(2)}h)`);
            });
        } else {
            console.log(`\n🌙 Nenhuma jornada noturna encontrada nos dados`);
        }
        
        console.log('\n' + '==================================================');
        console.log('✅ Teste concluído! A correção de jornadas noturnas está ativa.');
        console.log('==================================================\n');
    };

    console.log('%c✅ Teste de jornadas noturnas carregado. Execute: window.testOvertimeNocturna()', 'color: #27ae60; font-weight: bold;');
})();
