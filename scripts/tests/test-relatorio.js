// ==========================================
// TESTES DO SISTEMA DE BANCO DE HORAS
// ==========================================

console.log('🧪 Módulo de testes carregado');

/**
 * Testa se todas as funções essenciais estão carregadas
 */
window.testSystemIntegration = function() {
    console.log('%c=== TESTE DE INTEGRAÇÃO DO SISTEMA ===', 'color: #3498db; font-size: 14px; font-weight: bold;');
    
    const results = {
        funcionarios: typeof getEmployees === 'function',
        cargos: typeof getCargos === 'function',
        pontos: typeof loadPunches === 'function',
        relatorioBasico: typeof calculateDailyBalance === 'function',
        relatorioMensal: typeof calculateMonthlyBalance === 'function',
        relatorioGeral: typeof generateMonthlyReport === 'function',
        renderizacao: typeof renderMonthlyReport === 'function'
    };

    Object.entries(results).forEach(([test, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`${icon} ${test}: ${status ? 'OK' : 'FALTANDO'}`);
    });

    const allOk = Object.values(results).every(v => v);
    console.log('%c' + (allOk ? '✅ TODOS OS MÓDULOS CARREGADOS' : '❌ FALTAM MÓDULOS'), 
                'color: ' + (allOk ? '#27ae60' : '#e74c3c') + '; font-size: 12px; font-weight: bold;');
    
    return results;
};

/**
 * Teste completo do pipeline de cálculo
 */
window.testCalculationPipeline = function() {
    console.log('%c=== TESTE DO PIPELINE DE CÁLCULO ===', 'color: #f39c12; font-size: 14px; font-weight: bold;');
    
    if (typeof getEmployees !== 'function') {
        console.error('❌ Função getEmployees não encontrada');
        return;
    }

    const employees = getEmployees();
    if (employees.length === 0) {
        console.warn('⚠️ Nenhum funcionário encontrado. Use window.createDemoData()');
        return;
    }

    const emp = employees[0];
    console.log(`\n📋 Testando com funcionário: ${emp.nome} (${emp.matricula})`);

    // Teste 1: Obter pontos
    if (typeof getPunchesForEmployee === 'function') {
        const punches = getPunchesForEmployee(emp.id);
        console.log(`  📍 Pontos encontrados: ${punches.length}`);
        
        if (punches.length > 0) {
            // Teste 2: Agrupar em pares
            if (typeof groupPunchesIntoPairs === 'function') {
                const pairs = groupPunchesIntoPairs(punches);
                console.log(`  📊 Pares (entrada/saída): ${pairs.length}`);
                
                if (pairs.length > 0) {
                    console.log(`    Primeiro par: ${pairs[0].data} - ${pairs[0].horasTrabalhadas}h`);
                }
            }

            // Teste 3: Balanço diário
            if (typeof calculateDailyBalance === 'function') {
                const today = new Date();
                const dayBalance = calculateDailyBalance(emp.id, today);
                if (dayBalance) {
                    console.log(`  ⏱️ Balanço de hoje:`);
                    console.log(`    - Trabalhou: ${dayBalance.horasTrabalhadas}h`);
                    console.log(`    - Esperado: ${dayBalance.horasEsperadas}h`);
                    console.log(`    - Diferença: ${dayBalance.diferenca}h (${dayBalance.tipo})`);
                }
            }
        }

        // Teste 4: Balanço mensal
        if (typeof calculateMonthlyBalance === 'function') {
            const monthBalance = calculateMonthlyBalance(emp.id);
            if (monthBalance) {
                console.log(`\n  📅 Balanço mensal:`);
                console.log(`    - Dias trabalhados: ${monthBalance.totalDias}`);
                console.log(`    - Total trabalhado: ${monthBalance.totalTrabalhado}h`);
                console.log(`    - Total esperado: ${monthBalance.totalEsperado}h`);
                console.log(`    - Horas extras: +${monthBalance.totalExtras}h`);
                console.log(`    - Atrasos: -${monthBalance.totalAtrasos}h`);
                console.log(`    - Banco anterior: ${monthBalance.bancoHorasAnterior}h`);
                console.log(`    - Novo banco: ${monthBalance.novosBancoHoras}h`);
            }
        }
    }

    console.log('%c✅ Testes de cálculo concluídos', 'color: #27ae60; font-weight: bold;');
};

/**
 * Teste de renderização
 */
window.testRendering = function() {
    console.log('%c=== TESTE DE RENDERIZAÇÃO ===', 'color: #9b59b6; font-size: 14px; font-weight: bold;');
    
    if (typeof renderMonthlyReport !== 'function') {
        console.error('❌ Função renderMonthlyReport não encontrada');
        return;
    }

    // Criar um container temporário
    let container = document.getElementById('test-render-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'test-render-container';
        container.style.cssText = 'margin: 20px; padding: 20px; background: #f0f0f0; border-radius: 6px;';
        document.body.appendChild(container);
    }

    try {
        renderMonthlyReport(new Date(), 'test-render-container');
        console.log('✅ Relatório renderizado com sucesso no container');
        console.log('📍 Encontre em: #test-render-container');
    } catch (e) {
        console.error('❌ Erro ao renderizar:', e);
    }
};

/**
 * Teste de dados de demo
 */
window.testDemoData = function() {
    console.log('%c=== TESTE DE DADOS DEMO ===', 'color: #1abc9c; font-size: 14px; font-weight: bold;');
    
    const employees = typeof getEmployees === 'function' ? getEmployees() : [];
    const cargos = typeof getCargos === 'function' ? getCargos() : [];
    const punches = typeof loadPunches === 'function' ? loadPunches() : [];

    console.log(`📊 Estado atual do sistema:`);
    console.log(`  • Funcionários: ${employees.length}`);
    console.log(`  • Cargos: ${cargos.length}`);
    console.log(`  • Pontos: ${punches.length}`);

    if (employees.length === 0) {
        console.warn('⚠️ Nenhum dado. Execute: window.createDemoData()');
    } else if (punches.length === 0) {
        console.warn('⚠️ Funcionários, mas sem pontos. Execute: window.createDemoData()');
    } else {
        console.log('%c✅ Sistema tem dados suficientes para testes', 'color: #27ae60; font-weight: bold;');
    }
};

/**
 * Teste de exportação CSV
 */
window.testCSVExport = function() {
    console.log('%c=== TESTE DE EXPORTAÇÃO CSV ===', 'color: #e67e22; font-size: 14px; font-weight: bold;');
    
    if (typeof exportMonthlyBalanceCSV !== 'function') {
        console.error('❌ Função exportMonthlyBalanceCSV não encontrada');
        return;
    }

    const report = typeof generateMonthlyReport === 'function' ? generateMonthlyReport() : [];
    if (report.length === 0) {
        console.warn('⚠️ Nenhum dado para exportar. Use window.createDemoData()');
        return;
    }

    console.log(`📊 Relatório pronto para exportação: ${report.length} registros`);
    console.log('Para exportar, clique no botão "Exportar CSV" ou execute:');
    console.log('  exportMonthlyBalanceCSV()');
};

/**
 * Suite completa de testes
 */
window.runAllTests = function() {
    console.clear();
    console.log('%c╔════════════════════════════════════╗', 'color: #3498db; font-weight: bold;');
    console.log('%c║  SUITE DE TESTES - BANCO DE HORAS  ║', 'color: #3498db; font-weight: bold;');
    console.log('%c╚════════════════════════════════════╝', 'color: #3498db; font-weight: bold;');

    window.testSystemIntegration();
    console.log('\n---\n');
    
    window.testDemoData();
    console.log('\n---\n');
    
    window.testCalculationPipeline();
    console.log('\n---\n');
    
    window.testCSVExport();
    console.log('\n---\n');
    
    console.log('%c╔════════════════════════════════════╗', 'color: #27ae60; font-weight: bold;');
    console.log('%c║       TESTES CONCLUÍDOS            ║', 'color: #27ae60; font-weight: bold;');
    console.log('%c╚════════════════════════════════════╝', 'color: #27ae60; font-weight: bold;');

    console.log('%cPróximos passos:', 'font-weight: bold;');
    console.log('1. window.createDemoData() - Cria dados de teste');
    console.log('2. window.testCalculationPipeline() - Testa cálculos');
    console.log('3. window.testRendering() - Renderiza relatório');
    console.log('4. window.exportMonthlyBalanceCSV() - Exporta CSV');
};

/**
 * Função de benchmark
 */
window.benchmarkCalculations = function() {
    console.log('%c=== BENCHMARK DE PERFORMANCE ===', 'color: #e74c3c; font-size: 14px; font-weight: bold;');
    
    const employees = typeof getEmployees === 'function' ? getEmployees() : [];
    if (employees.length === 0) {
        console.warn('⚠️ Nenhum funcionário. Execute: window.createDemoData()');
        return;
    }

    const iterations = 100;
    console.log(`\nExecutando ${iterations} cálculos de balanço mensal...\n`);

    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        if (typeof calculateMonthlyBalance === 'function') {
            calculateMonthlyBalance(employees[0].id);
        }
    }
    
    const end = performance.now();
    const total = end - start;
    const average = total / iterations;

    console.log(`⏱️ Tempo total: ${total.toFixed(2)}ms`);
    console.log(`⏱️ Média por cálculo: ${average.toFixed(3)}ms`);
    console.log(`⚡ Taxa: ${(iterations / (total / 1000)).toFixed(2)} cálculos/segundo`);

    if (average < 10) {
        console.log('%c✅ Performance EXCELENTE', 'color: #27ae60; font-weight: bold;');
    } else if (average < 50) {
        console.log('%c✅ Performance BOA', 'color: #f39c12; font-weight: bold;');
    } else {
        console.log('%c⚠️ Performance PODE MELHORAR', 'color: #e74c3c; font-weight: bold;');
    }
};

console.log('%c🧪 Módulo de testes pronto', 'color: #27ae60; font-weight: bold;');
console.log('%cUse: window.runAllTests()', 'color: #3498db;');
