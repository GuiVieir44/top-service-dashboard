// ==========================================
// DEBUG: CALCULAR HORAS EXTRAS CORRETAMENTE
// ==========================================
// Verifica se a lógica está certa

console.log('🔍 DEBUG DE HORAS EXTRAS - TESTE REAL\n');

/**
 * Calcula horas extras de um funcionário manualmente
 */
function debugHorasExtrasFunc(matricula) {
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        const emp = employees.find(e => e.matricula === matricula);
        if (!emp) {
            console.error(`❌ Funcionário ${matricula} não encontrado`);
            return;
        }
        
        console.log(`👤 Funcionário: ${emp.nome} (${matricula})`);
        console.log(`🏢 Departamento: ${emp.departamento}`);
        console.log(`⏰ Hora início: ${emp.horaInicio || '08:00'}`);
        
        // Filtrar punches de novembro
        const empPunches = punches.filter(p => {
            const date = new Date(p.timestamp);
            return date.getMonth() === 10 && 
                   date.getFullYear() === 2025 && 
                   String(p.employeeId) === String(emp.id);
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log(`\n📊 Total de punches: ${empPunches.length}\n`);
        
        // Construir jornadas
        const journeys = [];
        for (let i = 0; i < empPunches.length; i++) {
            if (empPunches[i].type === 'Entrada') {
                let saida = null;
                for (let j = i + 1; j < empPunches.length; j++) {
                    if (empPunches[j].type === 'Saída') {
                        saida = empPunches[j];
                        break;
                    }
                }
                if (saida) {
                    journeys.push({
                        entrada: new Date(empPunches[i].timestamp),
                        saida: new Date(saida.timestamp)
                    });
                }
            }
        }
        
        console.log(`\n📋 DETALHES DE CADA JORNADA:\n`);
        
        let totalHoras = 0;
        let totalAdiantamento = 0;
        const horasEsperadas = 8;
        
        journeys.forEach((j, idx) => {
            const horas = (j.saida - j.entrada) / (1000 * 60 * 60);
            const horasAjustadas = Math.max(0, horas - 1); // Desconta intervalo
            totalHoras += horasAjustadas;
            
            // Verificar adiantamento
            const horaEntrada = j.entrada.getHours();
            const minEntrada = j.entrada.getMinutes();
            const [horaEsp, minEsp] = (emp.horaInicio || '08:00').split(':').map(Number);
            
            let adiantamento = 0;
            if (horaEntrada < horaEsp || (horaEntrada === horaEsp && minEntrada < minEsp)) {
                const diff = (horaEsp * 60 + minEsp) - (horaEntrada * 60 + minEntrada);
                adiantamento = diff / 60;
                totalAdiantamento += adiantamento;
            }
            
            console.log(`Jornada ${idx + 1}:`);
            console.log(`  Entrada: ${j.entrada.toLocaleString('pt-BR')}`);
            console.log(`  Saída:   ${j.saida.toLocaleString('pt-BR')}`);
            console.log(`  Duração bruta: ${horas.toFixed(2)}h`);
            console.log(`  Menos intervalo (1h): ${horasAjustadas.toFixed(2)}h`);
            if (adiantamento > 0) {
                console.log(`  ⏰ Adiantamento: ${adiantamento.toFixed(2)}h`);
            }
            console.log('');
        });
        
        console.log(`\n📊 CÁLCULO FINAL:\n`);
        console.log(`  Total de jornadas: ${journeys.length}`);
        console.log(`  Total horas trabalhadas: ${totalHoras.toFixed(2)}h`);
        console.log(`  Horas esperadas (${horasEsperadas}h × ${journeys.length}): ${(horasEsperadas * journeys.length).toFixed(2)}h`);
        console.log(`  Adiantamento: ${totalAdiantamento.toFixed(2)}h`);
        
        const extra = totalHoras - (horasEsperadas * journeys.length);
        const totalComAdiantamento = extra + totalAdiantamento;
        
        console.log(`\n  ❓ Extra (sem adiantamento): ${Math.max(0, extra).toFixed(2)}h`);
        console.log(`  ❓ Total com adiantamento: ${Math.max(0, totalComAdiantamento).toFixed(2)}h`);
        
        console.log(`\n💡 DIAGNÓSTICO:`);
        if (extra < 0) {
            console.log(`  ✅ Funcionário trabalhou MENOS que o esperado`);
            console.log(`  📌 Falta: ${Math.abs(extra).toFixed(2)}h`);
        } else if (extra === 0 && totalAdiantamento === 0) {
            console.log(`  ✅ PERFEITO! Trabalhou exatamente as horas esperadas`);
        } else if (totalComAdiantamento > 0) {
            console.log(`  ⚠️ Tem hora extra (pode incluir adiantamento)`);
            if (totalAdiantamento > 0) {
                console.log(`  ⏰ ${totalAdiantamento.toFixed(2)}h são de ADIANTAMENTO`);
                console.log(`  ⚠️ ${extra.toFixed(2)}h são de EXTRA REAL`);
            }
        }
        
        return {
            funcionario: emp.nome,
            matricula: matricula,
            jornadas: journeys.length,
            totalHoras: totalHoras,
            esperadas: horasEsperadas * journeys.length,
            adiantamento: totalAdiantamento,
            extra: Math.max(0, extra),
            totalComAdiantamento: Math.max(0, totalComAdiantamento)
        };
        
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

/**
 * Lista TODOS os funcionários com hora extra
 */
function listaTodosComHoraExtra() {
    console.log('\n🔍 FUNCIONÁRIOS COM HORA EXTRA:\n');
    
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        const resultados = [];
        
        for (const emp of employees) {
            const empPunches = punches.filter(p => {
                const date = new Date(p.timestamp);
                return date.getMonth() === 10 && 
                       date.getFullYear() === 2025 && 
                       String(p.employeeId) === String(emp.id);
            }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (empPunches.length === 0) continue;
            
            // Construir jornadas
            const journeys = [];
            for (let i = 0; i < empPunches.length; i++) {
                if (empPunches[i].type === 'Entrada') {
                    let saida = null;
                    for (let j = i + 1; j < empPunches.length; j++) {
                        if (empPunches[j].type === 'Saída') {
                            saida = empPunches[j];
                            break;
                        }
                    }
                    if (saida) {
                        journeys.push({
                            entrada: new Date(empPunches[i].timestamp),
                            saida: new Date(saida.timestamp)
                        });
                    }
                }
            }
            
            if (journeys.length === 0) continue;
            
            let totalHoras = 0;
            journeys.forEach(j => {
                const horas = (j.saida - j.entrada) / (1000 * 60 * 60);
                const horasAjustadas = Math.max(0, horas - 1);
                totalHoras += horasAjustadas;
            });
            
            const horasEsperadas = 8;
            const extra = totalHoras - (horasEsperadas * journeys.length);
            
            if (extra > 0) {
                resultados.push({
                    'Matrícula': emp.matricula,
                    'Nome': emp.nome,
                    'Jornadas': journeys.length,
                    'Horas': totalHoras.toFixed(2),
                    'Esperado': (horasEsperadas * journeys.length),
                    'Extra': extra.toFixed(2)
                });
            }
        }
        
        console.table(resultados);
        
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

// ===== AUTO EXECUTAR =====
console.log('='.repeat(60));
debugHorasExtrasFunc('008');
console.log('='.repeat(60));
console.log('\n📌 FUNÇÕES:\n');
console.log('  debugHorasExtrasFunc("008") - Debug detalhado');
console.log('  listaTodosComHoraExtra() - Lista todos com extra');
