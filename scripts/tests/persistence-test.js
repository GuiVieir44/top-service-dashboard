/**
 * MÓDULO DE TESTES - VALIDAÇÃO DE PERSISTÊNCIA
 * 
 * Funções para testar a integridade do sistema de salvamento de dados
 * Execute no console: window.runPersistenceTests()
 */

(function() {
    // Testes de persistência
    window.runPersistenceTests = function() {
        console.clear();
        console.log('%c🧪 INICIANDO TESTES DE PERSISTÊNCIA', 'color: #3498db; font-size: 16px; font-weight: bold;');
        console.log('==================================================');
        
        let testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
        
        // TESTE 1: localStorage disponível
        try {
            localStorage.setItem('test_key', 'test_value');
            localStorage.removeItem('test_key');
            testResults.passed++;
            testResults.tests.push('✅ localStorage disponível e funcional');
        } catch(e) {
            testResults.failed++;
            testResults.tests.push('❌ localStorage indisponível: ' + e.message);
        }
        
        // TESTE 2: Funcionários
        try {
            const empsBefore = getEmployees ? getEmployees().length : 0;
            testResults.tests.push(`✅ Funcionários carregados: ${empsBefore} registros`);
            testResults.passed++;
        } catch(e) {
            testResults.failed++;
            testResults.tests.push('❌ Erro ao carregar funcionários: ' + e.message);
        }
        
        // TESTE 3: Departamentos
        try {
            const depts = loadDepartments ? loadDepartments() : [];
            const deptsRaw = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
            if (depts.length === deptsRaw.length) {
                testResults.tests.push(`✅ Departamentos sincronizados: ${depts.length} registros`);
                testResults.passed++;
            } else {
                testResults.failed++;
                testResults.tests.push(`❌ Departamentos desincronizados: ${depts.length} via função vs ${deptsRaw.length} no localStorage`);
            }
        } catch(e) {
            testResults.failed++;
            testResults.tests.push('❌ Erro ao validar departamentos: ' + e.message);
        }
        
        // TESTE 4: Pontos
        try {
            const punches = loadPunches ? loadPunches() : [];
            const punchesRaw = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
            if (punches.length === punchesRaw.length) {
                testResults.tests.push(`✅ Pontos sincronizados: ${punches.length} registros`);
                testResults.passed++;
            } else {
                testResults.failed++;
                testResults.tests.push(`❌ Pontos desincronizados: ${punches.length} via função vs ${punchesRaw.length} no localStorage`);
            }
        } catch(e) {
            testResults.failed++;
            testResults.tests.push('❌ Erro ao validar pontos: ' + e.message);
        }
        
        // TESTE 5: Afastamentos
        try {
            const afast = loadAfastamentos ? loadAfastamentos() : [];
            const afastRaw = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
            if (afast.length === afastRaw.length) {
                testResults.tests.push(`✅ Afastamentos sincronizados: ${afast.length} registros`);
                testResults.passed++;
            } else {
                testResults.failed++;
                testResults.tests.push(`❌ Afastamentos desincronizados: ${afast.length} via função vs ${afastRaw.length} no localStorage`);
            }
        } catch(e) {
            testResults.failed++;
            testResults.tests.push('❌ Erro ao validar afastamentos: ' + e.message);
        }
        
        // TESTE 6: Espaço disponível no localStorage
        try {
            const storageSize = JSON.stringify(localStorage).length;
            const maxSize = 5 * 1024 * 1024; // 5MB padrão
            const usage = ((storageSize / maxSize) * 100).toFixed(2);
            
            if (usage < 80) {
                testResults.tests.push(`✅ Espaço no localStorage adequado: ${usage}% utilizado`);
                testResults.passed++;
            } else {
                testResults.failed++;
                testResults.tests.push(`⚠️  Espaço no localStorage crítico: ${usage}% utilizado`);
            }
        } catch(e) {
            testResults.tests.push('⚠️  Não foi possível calcular espaço: ' + e.message);
        }
        
        // TESTE 7: Validação de estrutura (Departamentos)
        try {
            const depts = loadDepartments ? loadDepartments() : [];
            let structureValid = true;
            let invalidCount = 0;
            
            depts.forEach((d, idx) => {
                if (!d.id || !d.nome) {
                    structureValid = false;
                    invalidCount++;
                }
            });
            
            if (structureValid || invalidCount === 0) {
                testResults.tests.push(`✅ Estrutura de departamentos válida`);
                testResults.passed++;
            } else {
                testResults.failed++;
                testResults.tests.push(`❌ ${invalidCount} departamentos com estrutura inválida`);
            }
        } catch(e) {
            testResults.tests.push('⚠️  Erro ao validar estrutura: ' + e.message);
        }
        
        // TESTE 8: Callbacks de salvamento disponíveis
        try {
            let callbacksAvailable = [];
            if (typeof window.saveEmployees === 'function') callbacksAvailable.push('saveEmployees');
            if (typeof window.savePunches === 'function') callbacksAvailable.push('savePunches');
            if (typeof window.saveAfastamentos === 'function') callbacksAvailable.push('saveAfastamentos');
            if (typeof window.saveDepartments === 'function') callbacksAvailable.push('saveDepartments');
            
            if (callbacksAvailable.length >= 3) {
                testResults.tests.push(`✅ Callbacks disponíveis: ${callbacksAvailable.join(', ')}`);
                testResults.passed++;
            } else {
                testResults.tests.push(`⚠️  Apenas ${callbacksAvailable.length} callbacks encontrados`);
            }
        } catch(e) {
            testResults.tests.push('⚠️  Erro ao verificar callbacks: ' + e.message);
        }
        
        // TESTE 9: Persistência em tempo real (simulado)
        try {
            const testDeptName = 'TEST_DEPT_' + Date.now();
            const beforeCount = loadDepartments ? loadDepartments().length : 0;
            
            // Adicionar departamento de teste
            if (typeof addDepartment === 'function') {
                const testDept = addDepartment(testDeptName, 'Departamento de teste');
                
                setTimeout(function() {
                    const afterCount = loadDepartments ? loadDepartments().length : 0;
                    
                    if (afterCount === beforeCount + 1) {
                        testResults.tests.push(`✅ Persistência em tempo real: departamento criado e salvo`);
                        // Remover departamento de teste
                        if (typeof deleteDepartment === 'function' && testDept) {
                            deleteDepartment(testDept.id);
                        }
                    }
                }, 200);
            } else {
                testResults.tests.push('⚠️  Função addDepartment não disponível para teste');
            }
        } catch(e) {
            testResults.tests.push('⚠️  Erro no teste de persistência em tempo real: ' + e.message);
        }
        
        // Exibir resultados
        console.log('');
        testResults.tests.forEach(test => {
            console.log(test);
        });
        
        console.log('');
        console.log('==================================================');
        console.log(`%c✅ PASSOU: ${testResults.passed} | ❌ FALHOU: ${testResults.failed}`, 
            testResults.failed === 0 ? 'color: #27ae60; font-weight: bold;' : 'color: #e74c3c; font-weight: bold;');
        console.log('==================================================');
        
        return {
            summary: `Testes: ${testResults.passed}/${testResults.passed + testResults.failed} passaram`,
            details: testResults.tests,
            passed: testResults.passed,
            failed: testResults.failed
        };
    };
    
    // Função para testar salvamento manual
    window.testManualSave = function() {
        console.log('%c🔄 Executando safeSaveAll() manualmente...', 'color: #3498db;');
        if (typeof window.safeSaveAll === 'function') {
            window.safeSaveAll();
            return 'Salvo com sucesso. Verifique console para detalhes.';
        } else {
            return '❌ safeSaveAll não disponível';
        }
    };
    
    // Função para limpar teste (remover departamentos de teste)
    window.cleanupTests = function() {
        try {
            const depts = loadDepartments();
            const testDepts = depts.filter(d => d.nome.startsWith('TEST_DEPT_'));
            
            if (testDepts.length > 0) {
                console.log(`Removendo ${testDepts.length} departamentos de teste...`);
                testDepts.forEach(d => {
                    if (typeof deleteDepartment === 'function') {
                        deleteDepartment(d.id);
                    }
                });
                return `Removidos ${testDepts.length} departamentos de teste`;
            } else {
                return 'Nenhum departamento de teste encontrado';
            }
        } catch(e) {
            return '❌ Erro ao limpar testes: ' + e.message;
        }
    };
    
    console.log('%c💡 Dica: Use window.runPersistenceTests() para executar testes de persistência', 'color: #3498db;');
    console.log('%c💡 Dica: Use window.testManualSave() para forçar salvamento', 'color: #3498db;');
    console.log('%c💡 Dica: Use window.cleanupTests() para remover dados de teste', 'color: #3498db;');
})();
