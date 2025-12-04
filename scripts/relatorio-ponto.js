// ==========================================
// MÓDULO DE RELATÓRIO DE PONTOS - TOP SERVICE
// ==========================================
// Vincula dados de ponto com banco de horas dos cargos para gerar análises

console.log('🔧 Módulo de relatório de pontos carregado');

/**
 * Obtém os pontos de um funcionário em um intervalo de datas
 * @param {number} employeeId - ID do funcionário
 * @param {Date} startDate - Data inicial (opcional)
 * @param {Date} endDate - Data final (opcional)
 * @returns {Array} Array de pontos filtrados
 */
function getPunchesForEmployee(employeeId, startDate = null, endDate = null) {
    try {
        const punches = typeof loadPunches === 'function' ? loadPunches() : [];
        
        let filtered = punches.filter(p => p.employeeId === employeeId);
        
        if (startDate || endDate) {
            filtered = filtered.filter(p => {
                const punchDate = new Date(p.timestamp);
                if (startDate && punchDate < startDate) return false;
                if (endDate && punchDate > endDate) return false;
                return true;
            });
        }
        
        return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (e) {
        console.error('Erro ao obter pontos do funcionário:', e);
        return [];
    }
}

/**
 * Agrupa punches em pares de Entrada/Saída para calcular horas trabalhadas
 * @param {Array} punches - Array de punches
 * @returns {Array} Array com pares {entrada, saida, horasTrabalhadas}
 */
function groupPunchesIntoPairs(punches) {
    try {
        const pairs = [];
        let entrada = null;
        let rf1 = null; // Saída para almoço
        
        punches.forEach(punch => {
            const type = punch.type || '';
            const rf = punch.rf || '';
            
            // Entrada principal
            if (type === 'Entrada' && !rf1) {
                entrada = punch;
            }
            // Saída para almoço (RF 1)
            else if (type === 'Saída' && rf === 'RF 1' && entrada) {
                rf1 = punch;
            }
            // Entrada após almoço (RF 2)
            else if (type === 'Entrada' && rf === 'RF 2' && rf1) {
                // Registra pausa do almoço
                entrada = punch; // Continua com nova entrada
                rf1 = null;
            }
            // Saída do dia
            else if (type === 'Saída' && (rf === 'RF -' || !rf) && entrada) {
                const entradaTime = new Date(entrada.timestamp);
                const saidaTime = new Date(punch.timestamp);
                const diffMs = saidaTime - entradaTime;
                const diffHours = diffMs / (1000 * 60 * 60);
                
                pairs.push({
                    entrada: entrada.timestamp,
                    saida: punch.timestamp,
                    horasTrabalhadas: Math.round(diffHours * 100) / 100,
                    data: entradaTime.toLocaleDateString('pt-BR')
                });
                
                entrada = null;
                rf1 = null;
            }
        });
        
        return pairs;
    } catch (e) {
        console.error('Erro ao agrupar punches:', e);
        return [];
    }
}

/**
 * Calcula horas extras/atrasos para um funcionário em uma data específica
 * @param {number} employeeId - ID do funcionário
 * @param {Date} date - Data a analisar
 * @returns {Object} {horasTrabalhadas, horasEsperadas, diferenca, tipo}
 */
function calculateDailyBalance(employeeId, date = null) {
    try {
        if (!date) date = new Date();
        
        // Obter funcionário e seu cargo
        const emp = typeof getEmployeeById === 'function' ? getEmployeeById(employeeId) : null;
        if (!emp) {
            console.warn('Funcionário não encontrado:', employeeId);
            return null;
        }
        
        // Obter informações do cargo
        let horasEsperadas = 8; // Padrão
        let cargoInfo = null;
        let horaInicio = '08:00'; // Hora padrão de início
        
        if (emp.cargo) {
            // Tentar obter cargo customizado do departamento
            if (emp.departamento && typeof getCargosByDepartment === 'function') {
                const cargosDepto = getCargosByDepartment(emp.departamento);
                cargoInfo = cargosDepto.find(c => 
                    c.cargoNome?.toLowerCase() === emp.cargo.toLowerCase() ||
                    c.id?.toString() === emp.cargo
                );
            }
            
            // Se não encontrou customizado, busca cargo global
            if (!cargoInfo && typeof getCargoByName === 'function') {
                cargoInfo = getCargoByName(emp.cargo);
            }
            
            if (cargoInfo && cargoInfo.horasEfetivas) {
                horasEsperadas = cargoInfo.horasEfetivas;
            } else if (cargoInfo && cargoInfo.horasDia) {
                horasEsperadas = cargoInfo.horasDia;
            }
        }
        
        // Obter hora de início do funcionário
        if (emp.horaInicio) {
            horaInicio = emp.horaInicio;
        }
        
        // Obter punches do dia
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const dayPunches = getPunchesForEmployee(employeeId, startOfDay, endOfDay);
        const pairs = groupPunchesIntoPairs(dayPunches);
        
        console.log(`[DEBUG] ${emp.nome} - Punches: ${dayPunches.length}, Pairs: ${pairs.length}`);
        
        // Somar horas trabalhadas do dia
        let horasTrabalhadas = 0;
        let adiantamentoMinutos = 0;
        let atrasoMinutos = 0;
        let horaExtraMinutos = 0;
        
        // Verificar se há ausência (falta ou feriado) neste dia
        const dateStr = date.toISOString().split('T')[0];
        const absence = typeof getAbsenceForDay === 'function' ? getAbsenceForDay(employeeId, dateStr) : null;
        
        pairs.forEach((pair, index) => {
            horasTrabalhadas += pair.horasTrabalhadas;
            
            // PRIMEIRA ENTRADA - Detectar ADIANTAMENTO ou ATRASO
            if (index === 0 && pair.entrada) {
                const entradaHora = new Date(pair.entrada);
                const [esperadoHora, esperadoMinuto] = horaInicio.split(':').map(Number);
                
                const horaEsperada = new Date(entradaHora);
                horaEsperada.setHours(esperadoHora, esperadoMinuto, 0, 0);
                
                console.log(`[DEBUG] Entrada: ${entradaHora.toLocaleTimeString('pt-BR')} | Esperado: ${horaInicio}`);
                
                // Se entrada foi antes da hora esperada = ADIANTAMENTO
                if (entradaHora < horaEsperada) {
                    adiantamentoMinutos = Math.floor((horaEsperada - entradaHora) / 60000);
                    console.log(`[DEBUG] ✅ ADIANTAMENTO: ${adiantamentoMinutos} minutos`);
                } 
                // Se entrada foi depois da hora esperada = ATRASO
                else if (entradaHora > horaEsperada) {
                    atrasoMinutos = Math.floor((entradaHora - horaEsperada) / 60000);
                    console.log(`[DEBUG] ⚠️ ATRASO: ${atrasoMinutos} minutos`);
                } else {
                    console.log(`[DEBUG] ❌ Entrada no horário esperado`);
                }
            }
            
            // ÚLTIMA SAÍDA - Detectar HORA EXTRA na saída
            if (index === pairs.length - 1 && pair.saida) {
                const saidaHora = new Date(pair.saida);
                const [esperadoHoraFim, esperadoMinutoFim] = (emp.horaFim || '17:00').split(':').map(Number);
                
                const horaEsperadaFim = new Date(saidaHora);
                horaEsperadaFim.setHours(esperadoHoraFim, esperadoMinutoFim, 0, 0);
                
                console.log(`[DEBUG] Saída: ${saidaHora.toLocaleTimeString('pt-BR')} | Esperado: ${emp.horaFim || '17:00'}`);
                
                // Se saída foi depois da hora esperada = HORA EXTRA
                if (saidaHora > horaEsperadaFim) {
                    horaExtraMinutos = Math.floor((saidaHora - horaEsperadaFim) / 60000);
                    console.log(`[DEBUG] ⏰ HORA EXTRA: ${horaExtraMinutos} minutos`);
                }
            }
        });
        
        // Calcular diferença
        const diferenca = horasTrabalhadas - horasEsperadas;
        let tipo = 'normal';
        
        if (absence) {
            tipo = absence.type === 'falta' ? 'falta' : 'feriado';
            console.log(`[DEBUG] Tipo determinado: ${tipo.toUpperCase()}`);
        } else if (atrasoMinutos > 0) {
            tipo = 'atraso';
            console.log(`[DEBUG] Tipo determinado: ATRASO`);
        } else if (adiantamentoMinutos > 0) {
            tipo = 'adiantamento';
            console.log(`[DEBUG] Tipo determinado: ADIANTAMENTO`);
        } else if (horaExtraMinutos > 0) {
            tipo = 'extra';
            console.log(`[DEBUG] Tipo determinado: HORA EXTRA`);
        } else if (diferenca > 0) {
            tipo = 'extra';
        } else if (diferenca < 0) {
            tipo = 'atraso';
        }
        
        return {
            employeeId: employeeId,
            data: date,
            horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
            horasEsperadas: horasEsperadas,
            diferenca: Math.round(Math.abs(diferenca) * 100) / 100,
            adiantamentoMinutos: adiantamentoMinutos,
            adiantamentoHoras: Math.round((adiantamentoMinutos / 60) * 100) / 100,
            atrasoMinutos: atrasoMinutos,
            atrasoHoras: Math.round((atrasoMinutos / 60) * 100) / 100,
            horaExtraMinutos: horaExtraMinutos,
            horaExtraHoras: Math.round((horaExtraMinutos / 60) * 100) / 100,
            tipo: tipo,
            absence: absence,
            pairs: pairs,
            cargoInfo: cargoInfo
        };
    } catch (e) {
        console.error('Erro ao calcular balanço diário:', e);
        return null;
    }
}

/**
 * Calcula balanço mensal completo para um funcionário
 * @param {number} employeeId - ID do funcionário
 * @param {Date} month - Mês a analisar (qualquer dia do mês)
 * @returns {Object} Relatório mensal detalhado
 */
function calculateMonthlyBalance(employeeId, month = null) {
    try {
        if (!month) month = new Date();
        
        const emp = typeof getEmployeeById === 'function' ? getEmployeeById(employeeId) : null;
        if (!emp) return null;
        
        // Calcular primeiro e último dia do mês
        const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        // Calcular balanço para cada dia
        const dailyBalances = [];
        let totalTrabalhado = 0;
        let totalEsperado = 0;
        let totalExtras = 0;
        let totalAtrasos = 0;
        let totalFaltas = 0;
        let totalFeriados = 0;
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            // Pular fins de semana (sábado 6, domingo 0)
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue;
            }
            
            const dayBalance = calculateDailyBalance(employeeId, new Date(d));
            
            if (dayBalance) {
                // Contar faltas e feriados
                if (dayBalance.tipo === 'falta') {
                    totalFaltas++;
                } else if (dayBalance.tipo === 'feriado') {
                    totalFeriados++;
                } else if (dayBalance.horasTrabalhadas > 0) {
                    // Apenas incluir se teve movimento de ponto
                    dailyBalances.push(dayBalance);
                    totalTrabalhado += dayBalance.horasTrabalhadas;
                    totalEsperado += dayBalance.horasEsperadas;
                    
                    if (dayBalance.tipo === 'extra') {
                        totalExtras += dayBalance.diferenca;
                    } else if (dayBalance.tipo === 'atraso') {
                        totalAtrasos += dayBalance.diferenca;
                    }
                }
            }
        }
        
        // Obter banco de horas do cargo
        let bancoHoras = 0;
        if (emp.cargo && typeof getCargoByName === 'function') {
            const cargo = getCargoByName(emp.cargo);
            if (cargo && cargo.bancoHoras !== undefined) {
                bancoHoras = cargo.bancoHoras;
            }
        }
        
        // Calcular novo banco de horas
        const novosBancoHoras = bancoHoras + totalExtras - totalAtrasos;
        
        return {
            employeeId: employeeId,
            nomeFunc: emp.nome,
            matricula: emp.matricula,
            cargo: emp.cargo,
            departamento: emp.departamento,
            mes: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            mesPeriodo: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
            totalDias: dailyBalances.length,
            totalTrabalhado: Math.round(totalTrabalhado * 100) / 100,
            totalEsperado: Math.round(totalEsperado * 100) / 100,
            totalExtras: Math.round(totalExtras * 100) / 100,
            totalAtrasos: Math.round(totalAtrasos * 100) / 100,
            totalFaltas: totalFaltas,
            totalFeriados: totalFeriados,
            bancoHorasAnterior: bancoHoras,
            novosBancoHoras: Math.round(novosBancoHoras * 100) / 100,
            dailyBalances: dailyBalances
        };
    } catch (e) {
        console.error('Erro ao calcular balanço mensal:', e);
        return null;
    }
}

/**
 * Gera relatório geral de todos os funcionários para um mês
 * @param {Date} month - Mês a analisar
 * @returns {Array} Array com balanços mensais de todos os funcionários
 */
function generateMonthlyReport(month = null) {
    try {
        if (!month) month = new Date();
        
        const employees = typeof getEmployees === 'function' ? getEmployees() : [];
        const report = [];
        
        employees.forEach(emp => {
            const balance = calculateMonthlyBalance(emp.id, month);
            if (balance) {
                report.push(balance);
            }
        });
        
        return report;
    } catch (e) {
        console.error('Erro ao gerar relatório mensal:', e);
        return [];
    }
}

/**
 * Formata relatório para exibição em tabela
 * @param {Object} balance - Objeto retornado por calculateMonthlyBalance
 * @returns {string} HTML da linha da tabela
 */
function formatBalanceRow(balance) {
    if (!balance) return '';
    
    const classe = balance.totalExtras > 0 ? 'class="row-extra"' : (balance.totalAtrasos > 0 ? 'class="row-atraso"' : '');
    
    return `
        <tr ${classe}>
            <td>${balance.matricula}</td>
            <td>${balance.nomeFunc}</td>
            <td>${balance.cargo}</td>
            <td>${balance.totalDias}</td>
            <td>${balance.totalTrabalhado}h</td>
            <td>${balance.totalEsperado}h</td>
            <td style="color:#27ae60;font-weight:bold;">+${balance.totalExtras}h</td>
            <td style="color:#e74c3c;font-weight:bold;">${balance.totalAtrasos}h</td>
            <td style="color:#f39c12;font-weight:bold;">⚠️ ${balance.totalFaltas}</td>
            <td style="color:#9b59b6;font-weight:bold;">🎉 ${balance.totalFeriados}</td>
            <td style="color:#3498db;font-weight:bold;">${balance.bancoHorasAnterior >= 0 ? '+' : ''}${balance.bancoHorasAnterior}h</td>
            <td style="color:#9b59b6;font-weight:bold;">${balance.novosBancoHoras >= 0 ? '+' : ''}${balance.novosBancoHoras}h</td>
        </tr>
    `;
}

/**
 * Renderiza relatório mensal em tabela HTML
 * @param {Date} month - Mês a renderizar
 * @param {string} containerId - ID do container para renderizar
 */
function renderMonthlyReport(month = null, containerId = 'report-table') {
    try {
        if (!month) month = new Date();
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container de relatório não encontrado:', containerId);
            return;
        }
        
        const report = generateMonthlyReport(month);
        
        if (report.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <h3 style="color:#999;margin-bottom:20px;">📭 Nenhum dado de ponto encontrado</h3>
                    <p style="margin-bottom:20px;">Para gerar o relatório, você precisa:</p>
                    <ol style="text-align:left;display:inline-block;margin-bottom:20px;">
                        <li>✅ Ter funcionários cadastrados</li>
                        <li>✅ Ter cargos com banco de horas configurados</li>
                        <li>✅ Registrar pontos de entrada/saída</li>
                    </ol>
                    <p style="color:#3498db;font-weight:bold;">💡 Para testar, abra o console (F12) e execute:</p>
                    <p style="background:#f0f0f0;padding:10px;border-radius:4px;font-family:monospace;margin-top:10px;">window.createDemoData()</p>
                </div>
            `;
            return;
        }
        
        const monthStr = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        let html = `
            <div style="margin-bottom:20px;">
                <h3>Relatório de Pontos - ${monthStr}</h3>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <thead>
                    <tr style="background:#2c3e50;color:white;">
                        <th style="padding:10px;border:1px solid #34495e;">Matrícula</th>
                        <th style="padding:10px;border:1px solid #34495e;">Funcionário</th>
                        <th style="padding:10px;border:1px solid #34495e;">Cargo</th>
                        <th style="padding:10px;border:1px solid #34495e;">Dias</th>
                        <th style="padding:10px;border:1px solid #34495e;">Trabalhado</th>
                        <th style="padding:10px;border:1px solid #34495e;">Esperado</th>
                        <th style="padding:10px;border:1px solid #34495e;">Extras</th>
                        <th style="padding:10px;border:1px solid #34495e;">Atrasos</th>
                        <th style="padding:10px;border:1px solid #34495e;">Faltas</th>
                        <th style="padding:10px;border:1px solid #34495e;">Feriados</th>
                        <th style="padding:10px;border:1px solid #34495e;">Banco Anterior</th>
                        <th style="padding:10px;border:1px solid #34495e;">Novo Banco</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        report.forEach(balance => {
            html += formatBalanceRow(balance);
        });
        
        // Totalizadores
        const totalizadores = report.reduce((acc, balance) => ({
            totalTrabalhado: acc.totalTrabalhado + balance.totalTrabalhado,
            totalEsperado: acc.totalEsperado + balance.totalEsperado,
            totalExtras: acc.totalExtras + balance.totalExtras,
            totalAtrasos: acc.totalAtrasos + balance.totalAtrasos,
            totalFaltas: acc.totalFaltas + balance.totalFaltas,
            totalFeriados: acc.totalFeriados + balance.totalFeriados
        }), { totalTrabalhado: 0, totalEsperado: 0, totalExtras: 0, totalAtrasos: 0, totalFaltas: 0, totalFeriados: 0 });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="background:#ecf0f1;font-weight:bold;">
                        <td colspan="4" style="padding:10px;border:1px solid #34495e;text-align:right;">TOTAL:</td>
                        <td style="padding:10px;border:1px solid #34495e;">${totalizadores.totalTrabalhado}h</td>
                        <td style="padding:10px;border:1px solid #34495e;">${totalizadores.totalEsperado}h</td>
                        <td style="padding:10px;border:1px solid #34495e;color:#27ae60;">+${totalizadores.totalExtras}h</td>
                        <td style="padding:10px;border:1px solid #34495e;color:#e74c3c;">${totalizadores.totalAtrasos}h</td>
                        <td style="padding:10px;border:1px solid #34495e;color:#f39c12;">⚠️ ${totalizadores.totalFaltas}</td>
                        <td style="padding:10px;border:1px solid #34495e;color:#9b59b6;">🎉 ${totalizadores.totalFeriados}</td>
                        <td colspan="2" style="padding:10px;border:1px solid #34495e;"></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.innerHTML = html;
    } catch (e) {
        console.error('Erro ao renderizar relatório:', e);
    }
}

/**
 * Gera relatório de atrasos e horas extras DIÁRIOS para todos os funcionários
 * @param {Date} date - Data a analisar (se não informada, usa hoje)
 * @returns {Array} Array com {matricula, nome, cargo, tipo, horas}
 */
function generateDailyDelayReport(date = null) {
    try {
        if (!date) date = new Date();
        
        const employees = typeof getEmployees === 'function' ? getEmployees() : [];
        const report = [];
        
        employees.forEach(emp => {
            const dayBalance = calculateDailyBalance(emp.id, date);
            
            if (dayBalance && dayBalance.horasTrabalhadas > 0) {
                report.push({
                    id: emp.id,
                    matricula: emp.matricula,
                    nome: emp.nome,
                    cargo: emp.cargo,
                    departamento: emp.departamento,
                    horasTrabalhadas: dayBalance.horasTrabalhadas,
                    horasEsperadas: dayBalance.horasEsperadas,
                    diferenca: dayBalance.diferenca,
                    tipo: dayBalance.tipo
                });
            }
        });
        
        return report;
    } catch (e) {
        console.error('Erro ao gerar relatório de atrasos diários:', e);
        return [];
    }
}

/**
 * Renderiza tabela de atrasos e horas extras diários
 * @param {Date} date - Data a renderizar
 * @param {string} containerId - ID do container
 */
function renderDailyDelayReport(date = null, containerId = 'daily-delay-table') {
    try {
        if (!date) date = new Date();
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container de relatório diário não encontrado:', containerId);
            return;
        }
        
        const report = generateDailyDelayReport(date);
        
        if (report.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:30px;color:#999;">
                    <p>📭 Nenhum ponto registrado para ${date.toLocaleDateString('pt-BR')}</p>
                </div>
            `;
            return;
        }
        
        const dateStr = date.toLocaleDateString('pt-BR');
        
        // Separar atrasos e horas extras
        const atrasos = report.filter(r => r.tipo === 'atraso');
        const extras = report.filter(r => r.tipo === 'extra');
        
        let html = `
            <div style="margin-bottom:20px;">
                <h3>Atrasos e Horas Extras - ${dateStr}</h3>
            </div>
        `;
        
        // Tabela de Atrasos
        if (atrasos.length > 0) {
            html += `
                <div style="margin-bottom:30px;">
                    <h4 style="color:#e74c3c;margin-bottom:10px;">⏰ Atrasos (${atrasos.length})</h4>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:20px;">
                        <thead>
                            <tr style="background:#fff3cd;color:#856404;">
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:left;">Matrícula</th>
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:left;">Funcionário</th>
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:left;">Cargo</th>
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:right;">Trabalhado</th>
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:right;">Esperado</th>
                                <th style="padding:10px;border:1px solid #ffeeba;text-align:right;">Atraso</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            let totalAtrasado = 0;
            atrasos.forEach(item => {
                totalAtrasado += item.diferenca;
                html += `
                    <tr style="background:#fffdf7;border-bottom:1px solid #ffeeba;">
                        <td style="padding:10px;border:1px solid #ffeeba;">${item.matricula}</td>
                        <td style="padding:10px;border:1px solid #ffeeba;">${item.nome}</td>
                        <td style="padding:10px;border:1px solid #ffeeba;">${item.cargo}</td>
                        <td style="padding:10px;border:1px solid #ffeeba;text-align:right;font-weight:bold;">${item.horasTrabalhadas}h</td>
                        <td style="padding:10px;border:1px solid #ffeeba;text-align:right;">${item.horasEsperadas}h</td>
                        <td style="padding:10px;border:1px solid #ffeeba;text-align:right;color:#e74c3c;font-weight:bold;">-${item.diferenca}h</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                        <tfoot>
                            <tr style="background:#e74c3c;color:white;font-weight:bold;">
                                <td colspan="5" style="padding:10px;border:1px solid #c0392b;text-align:right;">TOTAL ATRASADO:</td>
                                <td style="padding:10px;border:1px solid #c0392b;text-align:right;">-${totalAtrasado}h</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }
        
        // Tabela de Horas Extras
        if (extras.length > 0) {
            html += `
                <div style="margin-bottom:30px;">
                    <h4 style="color:#27ae60;margin-bottom:10px;">⭐ Horas Extras (${extras.length})</h4>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <thead>
                            <tr style="background:#d4edda;color:#155724;">
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:left;">Matrícula</th>
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:left;">Funcionário</th>
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:left;">Cargo</th>
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:right;">Trabalhado</th>
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:right;">Esperado</th>
                                <th style="padding:10px;border:1px solid #c3e6cb;text-align:right;">Extra</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            let totalExtra = 0;
            extras.forEach(item => {
                totalExtra += item.diferenca;
                html += `
                    <tr style="background:#f1f9f6;border-bottom:1px solid #c3e6cb;">
                        <td style="padding:10px;border:1px solid #c3e6cb;">${item.matricula}</td>
                        <td style="padding:10px;border:1px solid #c3e6cb;">${item.nome}</td>
                        <td style="padding:10px;border:1px solid #c3e6cb;">${item.cargo}</td>
                        <td style="padding:10px;border:1px solid #c3e6cb;text-align:right;font-weight:bold;">${item.horasTrabalhadas}h</td>
                        <td style="padding:10px;border:1px solid #c3e6cb;text-align:right;">${item.horasEsperadas}h</td>
                        <td style="padding:10px;border:1px solid #c3e6cb;text-align:right;color:#27ae60;font-weight:bold;">+${item.diferenca}h</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                        <tfoot>
                            <tr style="background:#27ae60;color:white;font-weight:bold;">
                                <td colspan="5" style="padding:10px;border:1px solid #229954;text-align:right;">TOTAL EXTRA:</td>
                                <td style="padding:10px;border:1px solid #229954;text-align:right;">+${totalExtra}h</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (e) {
        console.error('Erro ao renderizar relatório diário:', e);
    }
}

/**
 * Função de debug para testar cálculos
 */
window.debugRelatorios = function() {
    console.log('=== DEBUG RELATÓRIOS ===');
    
    const employees = typeof getEmployees === 'function' ? getEmployees() : [];
    console.log('Funcionários:', employees.length);
    
    employees.slice(0, 3).forEach(emp => {
        console.log(`\n--- ${emp.nome} ---`);
        const balance = calculateMonthlyBalance(emp.id);
        console.log('Balanço mensal:', balance);
        
        const dayBalance = calculateDailyBalance(emp.id);
        console.log('Balanço de hoje:', dayBalance);
    });
    
    const report = generateMonthlyReport();
    console.log('\nRelatório geral:', report);
};

console.log('✅ Módulo de relatório de pontos pronto');
