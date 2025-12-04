// ==========================================
// TESTE COMPLETO - MELHORIAS DE SALVAMENTO
// Execute no console: window.testAllImprovements()
// ==========================================

(function() {
    window.testAllImprovements = function() {
        console.clear();
        console.log('%c🧪 TESTE COMPLETO - MELHORIAS DE SALVAMENTO', 'color: #3498db; font-size: 16px; font-weight: bold;');
        console.log('==================================================');
        
        let results = {
            passed: 0,
            failed: 0,
            tests: []
        };

        // ===== TESTE 1: Validação Pós-Salvamento =====
        try {
            console.log('\n📌 TESTE 1: Validação Pós-Salvamento');
            
            // Testar se função de validação existe
            if (typeof window.safeSaveAll === 'function') {
                results.passed++;
                results.tests.push('✅ Função safeSaveAll disponível');
            } else {
                results.failed++;
                results.tests.push('❌ Função safeSaveAll não encontrada');
            }

            // Testar salvamento com verificação
            const testData = { test: 'data', timestamp: Date.now() };
            localStorage.setItem('test_validation', JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem('test_validation'));
            
            if (retrieved && retrieved.test === 'data') {
                results.passed++;
                results.tests.push('✅ Validação básica de salvamento funcionando');
            } else {
                results.failed++;
                results.tests.push('❌ Validação básica falhou');
            }
            
            localStorage.removeItem('test_validation');
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao testar validação: ' + e.message);
        }

        // ===== TESTE 2: Feedback Visual (Save Indicator) =====
        try {
            console.log('\n📌 TESTE 2: Indicador Visual de Salvamento');
            
            if (typeof window.showSaveIndicator === 'function') {
                results.passed++;
                results.tests.push('✅ Função showSaveIndicator disponível');
                
                // Testar se o indicador está visível
                const indicator = document.getElementById('save-indicator');
                if (indicator) {
                    results.passed++;
                    results.tests.push('✅ Elemento save-indicator encontrado no DOM');
                } else {
                    results.failed++;
                    results.tests.push('⚠️ save-indicator não está no DOM (será criado ao salvar)');
                }
            } else {
                results.failed++;
                results.tests.push('❌ showSaveIndicator não disponível');
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao testar indicador visual: ' + e.message);
        }

        // ===== TESTE 3: Debouncing =====
        try {
            console.log('\n📌 TESTE 3: Debouncing de Salvamentos');
            
            // Verificar se funções de debounce existem
            if (typeof window.scheduleSaveEmployees === 'function' || typeof window.scheduleDebouncedsave === 'function') {
                results.passed++;
                results.tests.push('✅ Sistema de debouncing implementado');
                
                // Testar se scheduling funciona
                const beforeTime = Date.now();
                if (typeof window.scheduleDebouncedsave === 'function') {
                    window.scheduleDebouncedsave();
                    results.passed++;
                    results.tests.push('✅ Agendamento de salvamento funciona');
                } else {
                    results.failed++;
                    results.tests.push('⚠️ scheduleSaveEmployees encontrado mas scheduleDebouncedsave não');
                }
            } else {
                results.failed++;
                results.tests.push('❌ Sistema de debouncing não encontrado');
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao testar debouncing: ' + e.message);
        }

        // ===== TESTE 4: Sincronização de Variáveis Globais =====
        try {
            console.log('\n📌 TESTE 4: Sincronização de Variáveis Globais');
            
            let syncTests = 0;
            let syncFailed = 0;

            // Testar employees
            if (typeof window.employees !== 'undefined') {
                syncTests++;
                if (Array.isArray(window.employees)) {
                    results.passed++;
                    results.tests.push(`✅ window.employees sincronizado (${window.employees.length} registros)`);
                } else {
                    syncFailed++;
                    results.failed++;
                    results.tests.push('❌ window.employees não é array');
                }
            } else {
                results.failed++;
                results.tests.push('⚠️ window.employees não declarado (será sincronizado ao usar)');
            }

            // Testar punches
            if (typeof window.punches !== 'undefined') {
                syncTests++;
                if (Array.isArray(window.punches)) {
                    results.passed++;
                    results.tests.push(`✅ window.punches sincronizado (${window.punches.length} registros)`);
                } else {
                    syncFailed++;
                    results.failed++;
                    results.tests.push('❌ window.punches não é array');
                }
            } else {
                results.failed++;
                results.tests.push('⚠️ window.punches não declarado (será sincronizado ao usar)');
            }

            // Testar afastamentos
            if (typeof window.afastamentos !== 'undefined') {
                syncTests++;
                if (Array.isArray(window.afastamentos)) {
                    results.passed++;
                    results.tests.push(`✅ window.afastamentos sincronizado (${window.afastamentos.length} registros)`);
                } else {
                    syncFailed++;
                    results.failed++;
                    results.tests.push('❌ window.afastamentos não é array');
                }
            } else {
                results.failed++;
                results.tests.push('⚠️ window.afastamentos não declarado (será sincronizado ao usar)');
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao testar sincronização: ' + e.message);
        }

        // ===== TESTE 5: Tratamento de Quota =====
        try {
            console.log('\n📌 TESTE 5: Tratamento de Quota');
            
            if (typeof window.getStorageUsage === 'function') {
                results.passed++;
                results.tests.push('✅ Função getStorageUsage disponível');
                
                const usage = window.getStorageUsage();
                results.passed++;
                results.tests.push(`✅ Storage Usage: ${usage.percent.toFixed(1)}% em uso`);
                
                if (usage.percent < 80) {
                    results.passed++;
                    results.tests.push(`✅ Quota OK (${usage.percent.toFixed(1)}% < 80%)`);
                } else if (usage.percent < 100) {
                    results.passed++;
                    results.tests.push(`⚠️ Aviso: ${usage.percent.toFixed(1)}% em uso (próximo do limite)`);
                } else {
                    results.failed++;
                    results.tests.push(`❌ CRÍTICO: ${usage.percent.toFixed(1)}% em uso (EXCEDIDO)`);
                }
            } else {
                results.failed++;
                results.tests.push('❌ getStorageUsage não disponível');
            }

            // Testar funções de limpeza
            if (typeof window.cleanupOldData === 'function') {
                results.passed++;
                results.tests.push('✅ Função cleanupOldData disponível');
            } else {
                results.failed++;
                results.tests.push('⚠️ cleanupOldData não disponível (em configuracoes.js)');
            }

            if (typeof window.getStorageInfo === 'function') {
                results.passed++;
                results.tests.push('✅ Função getStorageInfo disponível');
            } else {
                results.failed++;
                results.tests.push('⚠️ getStorageInfo não disponível (em configuracoes.js)');
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao testar tratamento de quota: ' + e.message);
        }

        // ===== TESTE 6: localStorage Geral =====
        try {
            console.log('\n📌 TESTE 6: localStorage Disponível');
            
            localStorage.setItem('test_key', 'test_value');
            const retrieved = localStorage.getItem('test_key');
            localStorage.removeItem('test_key');
            
            if (retrieved === 'test_value') {
                results.passed++;
                results.tests.push('✅ localStorage funcional e acessível');
            } else {
                results.failed++;
                results.tests.push('❌ localStorage não funcional');
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ localStorage indisponível: ' + e.message);
        }

        // ===== TESTE 7: Módulos Carregados =====
        try {
            console.log('\n📌 TESTE 7: Módulos Carregados');
            
            const requiredFunctions = [
                'saveEmployees',
                'loadEmployees',
                'savePunches',
                'loadPunches',
                'saveAfastamentos',
                'loadAfastamentos'
            ];
            
            let loadedCount = 0;
            requiredFunctions.forEach(fn => {
                if (typeof window[fn] === 'function') {
                    loadedCount++;
                }
            });
            
            if (loadedCount === requiredFunctions.length) {
                results.passed++;
                results.tests.push(`✅ Todos os ${loadedCount} módulos carregados`);
            } else {
                results.failed++;
                results.tests.push(`⚠️ ${loadedCount}/${requiredFunctions.length} módulos carregados`);
            }
        } catch(e) {
            results.failed++;
            results.tests.push('❌ Erro ao verificar módulos: ' + e.message);
        }

        // ===== EXIBIR RESULTADOS =====
        console.log('\n' + '==================================================');
        console.log('%c📊 RESULTADOS DOS TESTES', 'color: #e74c3c; font-size: 14px; font-weight: bold;');
        console.log('==================================================');
        
        results.tests.forEach(test => console.log(test));
        
        console.log('\n' + '==================================================');
        if (results.failed === 0) {
            console.log(`%c✅ TODOS OS TESTES PASSARAM! (${results.passed}/${results.passed})`, 'color: #27ae60; font-weight: bold; font-size: 14px;');
        } else {
            console.log(`%c⚠️ ALGUNS TESTES FALHARAM (${results.passed}/${results.passed + results.failed})`, 'color: #f39c12; font-weight: bold; font-size: 14px;');
        }
        console.log('==================================================\n');

        // ===== RESUMO FINAL =====
        return {
            total: results.passed + results.failed,
            passed: results.passed,
            failed: results.failed,
            success: results.failed === 0,
            tests: results.tests
        };
    };

    console.log('%c✅ Teste completo carregado. Execute: window.testAllImprovements()', 'color: #27ae60; font-weight: bold;');
})();
