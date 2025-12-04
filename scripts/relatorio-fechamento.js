// ==========================================
// RELATÓRIO DE FECHAMENTO POR DEPARTAMENTO
// ==========================================

console.log('📊 Relatório de Fechamento carregado!');

/**
 * Calcula saldo de hora extra + atraso para um funcionário em um período
 * ✅ VERSÃO CORRIGIDA: Usa lógica de JORNADAS (não entrada/saída)
 */
function calculateEmployeeBalance(employeeId, startDate, endDate) {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const employee = employees.find(e => e.id === employeeId);
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    
    if (!employee) {
        console.warn(`⚠️  Funcionário ${employeeId} não encontrado`);
        return { horaExtraHoras: 0, horaExtraMinutos: 0, atrasoHoras: 0, atrasoMinutos: 0 };
    }
    
    console.log(`\n📊 Calculando balance para: ${employee.nome} (${employeeId}) de ${startDate} a ${endDate}`);
    
    // Buscar horário esperado do funcionário (cargo + departamento)
    let horaInicio = 8; // padrão em horas
    let horaFim = 17;
    
    if (employee.departamento && employee.cargo) {
        const departamentos = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
        const dept = departamentos.find(d => d.nome === employee.departamento);
        
        if (dept) {
            const cargos = JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
            const cargo = cargos.find(c => c.nome === employee.cargo);
            
            if (cargo) {
                const cargosDept = JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
                const cargoCustomizado = cargosDept.find(cd => 
                    cd.departmentId === dept.id && cd.cargoId === cargo.id
                );
                
                if (cargoCustomizado) {
                    const [inicioH] = cargoCustomizado.horaInicio.split(':').map(Number);
                    const [fimH] = cargoCustomizado.horaFim.split(':').map(Number);
                    horaInicio = inicioH;
                    horaFim = fimH;
                    console.log(`   ✅ Cargo customizado: ${employee.cargo} em ${employee.departamento}: ${cargoCustomizado.horaInicio} às ${cargoCustomizado.horaFim}`);
                }
            }
        }
    }
    
    console.log(`   Horário esperado: ${horaInicio}:00 às ${horaFim}:00`);
    
    // Calcular horas esperadas por jornada
    // Se for noturna (horaInicio >= 19 E horaFim < 7): 11h - 1h intervalo = esperadas
    // Se for diurna normal: horaFim - horaInicio - 1h intervalo
    let horasEsperadasPorJornada = Math.max(0, horaFim - horaInicio - 1);
    const ehNoturnaConfig = horaInicio >= 19 || horaFim <= 7; // Config é noturna
    if (ehNoturnaConfig) {
        horasEsperadasPorJornada = 11; // Noturna: 12h bruto - 1h intervalo = 11h
    }
    
    // Filtrar punches do período
    const periodPunches = punches.filter(p => {
        if (String(p.employeeId) !== String(employeeId)) return false;
        const pDate = p.timestamp.split('T')[0];
        return pDate >= startDate && pDate <= endDate;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`   Pontos do período: ${periodPunches.length}`);
    
    if (periodPunches.length === 0) {
        return { horaExtraHoras: 0, horaExtraMinutos: 0, atrasoHoras: 0, atrasoMinutos: 0 };
    }
    
    // ✅ NOVO: Construir JORNADAS completas (não agrupar por dia)
    const journeys = [];
    for (let i = 0; i < periodPunches.length; i++) {
        if (periodPunches[i].type === 'Entrada') {
            let saida = null;
            for (let j = i + 1; j < periodPunches.length; j++) {
                if (periodPunches[j].type === 'Saída') {
                    saida = periodPunches[j];
                    break;
                }
            }
            if (saida) {
                journeys.push({
                    entrada: new Date(periodPunches[i].timestamp),
                    saida: new Date(saida.timestamp)
                });
            }
        }
    }
    
    // ✅ Agrupar jornadas por dia de trabalho (pela entrada)
    const journeysByDay = {};
    const punchsByDay = {};  // Também agrupar todos os pontos por dia para calcular atraso corretamente
    
    journeys.forEach(j => {
        const dia = j.entrada.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!journeysByDay[dia]) {
            journeysByDay[dia] = [];
        }
        journeysByDay[dia].push(j);
    });
    
    // Agrupar todos os pontos por dia também
    periodPunches.forEach(p => {
        const dia = p.timestamp.split('T')[0];
        if (!punchsByDay[dia]) {
            punchsByDay[dia] = [];
        }
        punchsByDay[dia].push(p);
    });
    
    // ✅ Se não há jornadas mas há pontos, ainda pode haver atraso
    // Calcular atraso primeiro (independente de jornadas)
    let totalAtrasoMinutos = 0;
    
    Object.keys(punchsByDay).forEach(dia => {
        const pontosDodia = punchsByDay[dia] || [];
        
        if (pontosDodia.length > 0) {
            const pontosOrdenados = pontosDodia.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const primeiroPonto = new Date(pontosOrdenados[0].timestamp);
            const horaPonto = primeiroPonto.getHours();
            const minutoPonto = primeiroPonto.getMinutes();
            const minutosAbsPonto = horaPonto * 60 + minutoPonto;
            const minutosEsperados = horaInicio * 60;
            
            console.log(`📅 ${dia} - Primeiro ponto: ${String(horaPonto).padStart(2, '0')}:${String(minutoPonto).padStart(2, '0')} (${minutosAbsPonto}min), Esperado: ${horaInicio}:00 (${minutosEsperados}min)`);
            
            if (minutosAbsPonto > minutosEsperados) {
                const atrasoMin = minutosAbsPonto - minutosEsperados;
                totalAtrasoMinutos += atrasoMin;
                console.log(`   ⏰ ATRASO: ${atrasoMin}min (total: ${totalAtrasoMinutos}min)`);
            }
        }
    });
    
    // Se não há jornadas, retorna apenas o atraso
    if (journeys.length === 0) {
        return {
            horaExtraHoras: 0,
            horaExtraMinutos: 0,
            atrasoHoras: Math.floor(totalAtrasoMinutos / 60),
            atrasoMinutos: totalAtrasoMinutos % 60
        };
    }
    
    // ✅ Calcular extra e atraso por dia
    let totalHorasTrabalhadas = 0;
    let totalHorasEsperadas = 0;
    
    Object.keys(journeysByDay).forEach(dia => {
        const journeysDodia = journeysByDay[dia];
        
        // Horas trabalhadas neste dia
        let horasDiaTrabalho = 0;
        journeysDodia.forEach(j => {
            const horas = (j.saida - j.entrada) / (1000 * 60 * 60);
            const horasAjustadas = Math.max(0, horas - 1); // Desconta 1h intervalo
            horasDiaTrabalho += horasAjustadas;
        });
        
        // Usar horas esperadas customizadas do funcionário
        totalHorasTrabalhadas += horasDiaTrabalho;
        totalHorasEsperadas += horasEsperadasPorJornada;
    });
    
    const extraHoras = totalHorasTrabalhadas - totalHorasEsperadas;
    
    // Converter para horas e minutos
    const totalExtraMinutos = Math.round(Math.max(0, extraHoras) * 60);
    
    const result = {
        horaExtraHoras: Math.floor(totalExtraMinutos / 60),
        horaExtraMinutos: totalExtraMinutos % 60,
        atrasoHoras: Math.floor(totalAtrasoMinutos / 60),
        atrasoMinutos: totalAtrasoMinutos % 60
    };
    
    console.log(`   📋 Resultado final: Extra=${result.horaExtraHoras}h${result.horaExtraMinutos}m, Atraso=${result.atrasoHoras}h${result.atrasoMinutos}m (${totalAtrasoMinutos}min total atraso)`);
    
    return result;
}

/**
 * Conta faltas e feriados para um funcionário em um período
 */
function countAbsences(employeeId, startDate, endDate) {
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let faltas = 0;
    let feriados = 0;
    
    absences.forEach(a => {
        if (a.employeeId === employeeId) {
            const aDate = new Date(a.date + 'T00:00:00');
            if (aDate >= start && aDate <= end) {
                if (a.type === 'falta') faltas++;
                else if (a.type === 'feriado') feriados++;
            }
        }
    });
    
    return { faltas, feriados };
}

/**
 * Conta dias de afastamento
 */
function countAfastamentos(employeeId, startDate, endDate) {
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    let diasAfastado = 0;
    
    console.log(`📊 countAfastamentos: employeeId=${employeeId}, startDate=${startDate}, endDate=${endDate}`);
    console.log(`   Afastamentos encontrados: ${afastamentos.length}`);
    
    afastamentos.forEach(a => {
        // Comparar com Number e também com String
        const empIdMatch = a.employeeId === employeeId || Number(a.employeeId) === Number(employeeId);
        
        if (empIdMatch) {
            // Suporta ambas as formas: dataInicio/dataFim e start/end
            const dataInicioStr = a.dataInicio || a.start;
            const dataFimStr = a.dataFim || a.end;
            
            if (!dataInicioStr || !dataFimStr) {
                console.warn(`   ⚠️ Afastamento sem datas: ${JSON.stringify(a)}`);
                return;
            }
            
            const dataInicio = new Date(dataInicioStr + 'T00:00:00');
            const dataFim = new Date(dataFimStr + 'T23:59:59');
            
            console.log(`   ✓ Afastamento encontrado: ${dataInicioStr} até ${dataFimStr}`);
            
            // Calcula interseção entre período do afastamento e período de análise
            const periodoInicio = new Date(Math.max(dataInicio.getTime(), start.getTime()));
            const periodoFim = new Date(Math.min(dataFim.getTime(), end.getTime()));
            
            if (periodoInicio <= periodoFim) {
                const dias = Math.floor((periodoFim - periodoInicio) / (1000 * 60 * 60 * 24)) + 1;
                diasAfastado += dias;
                console.log(`      Dias contados: ${dias}`);
            }
        }
    });
    
    console.log(`   ✅ Total de dias afastado: ${diasAfastado}`);
    return diasAfastado;
}

/**
 * Conta dias normais (sem faltas, feriados, folgas, afastamentos)
 */
function countNormalDays(employeeId, startDate, endDate) {
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    let normalDays = 0;
    
    // Contar todos os dias do período
    const allDays = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        allDays.push(dateStr);
    }
    
    // Verificar cada dia
    allDays.forEach(dateStr => {
        let isNormal = true;
        
        // Verificar se é falta/feriado/folga
        const absence = absences.find(a => a.employeeId === employeeId || Number(a.employeeId) === Number(employeeId)) 
            ? absences.find(a => (a.employeeId === employeeId || Number(a.employeeId) === Number(employeeId)) && a.date === dateStr)
            : null;
        
        if (absence) {
            isNormal = false;
        }
        
        // Verificar se está em afastamento
        if (isNormal) {
            const afastamento = afastamentos.find(a => {
                const empIdMatch = a.employeeId === employeeId || Number(a.employeeId) === Number(employeeId);
                if (!empIdMatch) return false;
                const dataInicio = a.dataInicio || a.start;
                const dataFim = a.dataFim || a.end;
                return dateStr >= dataInicio && dateStr <= dataFim;
            });
            
            if (afastamento) {
                isNormal = false;
            }
        }
        
        if (isNormal) {
            normalDays++;
        }
    });
    
    return normalDays;
}

/**
 * Calcula vale alimentação (dias normais × valor do cadastro)
 */
function calculateValeAlimentacao(employeeId, startDate, endDate, valeAlimentacaoCadastro) {
    if (!valeAlimentacaoCadastro || Number(valeAlimentacaoCadastro) === 0) {
        return { dias: 0, valor: 0, total: 0 };
    }
    
    const diasNormais = countNormalDays(employeeId, startDate, endDate);
    const valeValue = Number(valeAlimentacaoCadastro);
    const totalVale = diasNormais * valeValue;
    
    return {
        dias: diasNormais,
        valor: valeValue,
        total: totalVale
    };
}

/**
 * Gera o HTML da tabela de fechamento por departamento
 */
function generateClosingReportHTML(departmentName, startDate, endDate) {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const deptEmployees = employees.filter(e => e.departamento === departmentName && e.status !== 'Inativo');
    
    console.log(`📊 Gerando relatório para: ${departmentName}`);
    console.log(`   Período: ${startDate} até ${endDate}`);
    console.log(`   Funcionários no departamento: ${deptEmployees.length}`);
    
    if (deptEmployees.length === 0) {
        return `<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhum funcionário encontrado neste departamento</p>`;
    }
    
    let html = `
        <div style="display: flex; gap: 10px; margin-bottom: 20px; padding: 15px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 1px solid #3498db;">
            <button id="btn-export-pdf" style="padding: 12px 20px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: background 0.3s;" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">📄 Baixar PDF</button>
            <button id="btn-export-excel" style="padding: 12px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: background 0.3s;" onmouseover="this.style.background='#229954'" onmouseout="this.style.background='#27ae60'">📊 Baixar Excel</button>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; border: 1px solid var(--border-color);">
                <thead>
                    <tr style="background: var(--bg-secondary);">
                        <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Funcionário</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Cargo</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Afastamento (dias)</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Faltas</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Feriados</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Adicional</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Hora Extra</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Atraso</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Vale Alimentação</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Vale Transporte</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    deptEmployees.forEach(emp => {
        console.log(`\n👤 Processando: ${emp.nome} (ID: ${emp.id}, type: ${typeof emp.id})`);
        const balance = calculateEmployeeBalance(emp.id, startDate, endDate);
        const absences = countAbsences(emp.id, startDate, endDate);
        const afastamento = countAfastamentos(emp.id, startDate, endDate);
        
        // Calcular vale alimentação (dias normais × valor)
        const valeAlimCalc = calculateValeAlimentacao(emp.id, startDate, endDate, emp.valeAlimentacao);
        const valeAlimentacaoDisplay = valeAlimCalc.total > 0 
            ? `R$ ${valeAlimCalc.total.toFixed(2).replace('.', ',')} (${valeAlimCalc.dias}×${valeAlimCalc.valor.toFixed(2).replace('.', ',')})`
            : '-';
        
        const adicional = emp.adicional || '-';
        const valeTransporte = emp.valeTransporte || '-';
        
        const horaExtraStr = balance.horaExtraHoras > 0 ? `${balance.horaExtraHoras}h${balance.horaExtraMinutos}m` : '-';
        const atrasoStr = balance.atrasoHoras > 0 || balance.atrasoMinutos > 0 ? `${balance.atrasoHoras}h${balance.atrasoMinutos}m` : '-';
        
        console.log(`📊 ${emp.nome} (${emp.id}): Extra=${balance.horaExtraHoras}h${balance.horaExtraMinutos}m, Atraso=${balance.atrasoHoras}h${balance.atrasoMinutos}m`);
        
        // Destacar linha se há afastamento
        const rowBgColor = afastamento > 0 ? 'rgba(231, 76, 60, 0.1)' : 'transparent';
        
        html += `
            <tr style="border-bottom: 1px solid var(--border-color); background: ${rowBgColor};">
                <td style="padding: 10px; border: 1px solid var(--border-color);">${emp.nome}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${emp.cargo || '-'}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; background: ${afastamento > 0 ? 'rgba(231, 76, 60, 0.2)' : 'transparent'}; font-weight: ${afastamento > 0 ? '600' : 'normal'}; color: ${afastamento > 0 ? '#e74c3c' : 'var(--text-primary)'};">${afastamento}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; background: ${absences.faltas > 0 ? 'rgba(243, 156, 18, 0.1)' : 'transparent'}; font-weight: ${absences.faltas > 0 ? '600' : 'normal'}; color: ${absences.faltas > 0 ? '#f39c12' : 'var(--text-primary)'};">${absences.faltas}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; background: ${absences.feriados > 0 ? 'rgba(155, 89, 182, 0.1)' : 'transparent'}; font-weight: ${absences.feriados > 0 ? '600' : 'normal'}; color: ${absences.feriados > 0 ? '#9b59b6' : 'var(--text-primary)'};">${absences.feriados}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${adicional}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: #27ae60; font-weight: ${balance.horaExtraHoras > 0 ? '600' : 'normal'};">${horaExtraStr}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: #e74c3c; font-weight: ${balance.atrasoHoras > 0 ? '600' : 'normal'};">${atrasoStr}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-size: 0.8em;">${valeAlimentacaoDisplay}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${valeTransporte}</td>
            </tr>
        `;
    });
    
    // Totais
    let totalAfastamento = 0;
    let totalFaltas = 0;
    let totalFeriados = 0;
    let totalExtraHoras = 0;
    let totalExtraMinutos = 0;
    let totalAtrasoHoras = 0;
    let totalAtrasoMinutos = 0;
    let totalValeAlimentacao = 0;
    
    deptEmployees.forEach(emp => {
        const balance = calculateEmployeeBalance(emp.id, startDate, endDate);
        const absences = countAbsences(emp.id, startDate, endDate);
        const afastamento = countAfastamentos(emp.id, startDate, endDate);
        const valeAlimCalc = calculateValeAlimentacao(emp.id, startDate, endDate, emp.valeAlimentacao);
        
        totalAfastamento += afastamento;
        totalFaltas += absences.faltas;
        totalFeriados += absences.feriados;
        totalExtraHoras += balance.horaExtraHoras;
        totalExtraMinutos += balance.horaExtraMinutos;
        totalAtrasoHoras += balance.atrasoHoras;
        totalAtrasoMinutos += balance.atrasoMinutos;
        totalValeAlimentacao += valeAlimCalc.total;
    });
    
    // Converter minutos extras em horas
    totalExtraHoras += Math.floor(totalExtraMinutos / 60);
    totalExtraMinutos = totalExtraMinutos % 60;
    totalAtrasoHoras += Math.floor(totalAtrasoMinutos / 60);
    totalAtrasoMinutos = totalAtrasoMinutos % 60;
    
    const totalExtraStr = totalExtraHoras > 0 ? `${totalExtraHoras}h${totalExtraMinutos}m` : '-';
    const totalAtrasoStr = totalAtrasoHoras > 0 || totalAtrasoMinutos > 0 ? `${totalAtrasoHoras}h${totalAtrasoMinutos}m` : '-';
    
    html += `
            <tr style="background: var(--bg-secondary); font-weight: 600;">
                <td style="padding: 10px; border: 1px solid var(--border-color);" colspan="2">TOTAIS</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${totalAfastamento}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: ${totalFaltas > 0 ? '#f39c12' : 'var(--text-primary)'};">${totalFaltas}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: ${totalFeriados > 0 ? '#9b59b6' : 'var(--text-primary)'};">${totalFeriados}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">-</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: #27ae60;">${totalExtraStr}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: #e74c3c;">${totalAtrasoStr}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-size: 0.8em; color: ${totalValeAlimentacao > 0 ? '#16a085' : 'var(--text-primary)'};">R$ ${totalValeAlimentacao.toFixed(2).replace('.', ',')}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">-</td>
            </tr>
        </tbody>
            </table>
        </div>
    `;
    
    return html;
}

/**
 * FUNÇÕES DE EXPORTAÇÃO - DIRETO NO RELATORIO-FECHAMENTO
 */

function exportarFechamentoExcel(departmentName, startDate, endDate) {
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const deptEmployees = employees.filter(e => e.departamento === departmentName && e.status !== 'Inativo');
        
        const dados = [];
        dados.push(['TOP SERVICE - SISTEMA DE GESTÃO DE PONTO']);
        dados.push(['RELATÓRIO DE FECHAMENTO MENSAL']);
        dados.push([]);
        dados.push([`DEPARTAMENTO: ${departmentName}`]);
        dados.push([`PERÍODO: ${startDate} à ${endDate}`]);
        dados.push([`DATA: ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`]);
        dados.push([]);
        dados.push(['FUNCIONÁRIO', 'CARGO', 'AFASTAMENTO', 'FALTAS', 'FERIADOS', 'ADICIONAL', 'HORAS EXTRAS', 'ATRASOS', 'VALE REFEIÇÃO', 'VALE TRANSPORTE']);
        
        let totalAfastamento = 0, totalFaltas = 0, totalFeriados = 0;
        let totalExtraHoras = 0, totalExtraMinutos = 0;
        let totalAtrasoHoras = 0, totalAtrasoMinutos = 0;
        let totalValeAlimentacao = 0, totalValeTransporte = 0;
        let totalAdicional = 0;
        
        deptEmployees.forEach(emp => {
            const balance = calculateEmployeeBalance(emp.id, startDate, endDate);
            const absences = countAbsences(emp.id, startDate, endDate);
            const afastamento = countAfastamentos(emp.id, startDate, endDate);
            const valeAlimCalc = calculateValeAlimentacao(emp.id, startDate, endDate, emp.valeAlimentacao);
            
            const valeAlim = valeAlimCalc.total > 0 ? valeAlimCalc.total : 0;
            const valeTransp = emp.valeTransporte ? parseFloat(emp.valeTransporte) : 0;
            const adicionalVal = emp.adicional ? parseFloat(emp.adicional) : 0;
            
            dados.push([
                emp.nome,
                emp.cargo || '—',
                afastamento,
                absences.faltas,
                absences.feriados,
                adicionalVal,
                `${balance.horaExtraHoras}h${balance.horaExtraMinutos}m`,
                `${balance.atrasoHoras}h${balance.atrasoMinutos}m`,
                valeAlim,
                valeTransp
            ]);
            
            totalAfastamento += afastamento;
            totalFaltas += absences.faltas;
            totalFeriados += absences.feriados;
            totalExtraHoras += balance.horaExtraHoras;
            totalExtraMinutos += balance.horaExtraMinutos;
            totalAtrasoHoras += balance.atrasoHoras;
            totalAtrasoMinutos += balance.atrasoMinutos;
            totalValeAlimentacao += valeAlim;
            totalValeTransporte += valeTransp;
            totalAdicional += adicionalVal;
        });
        
        totalExtraHoras += Math.floor(totalExtraMinutos / 60);
        totalExtraMinutos = totalExtraMinutos % 60;
        totalAtrasoHoras += Math.floor(totalAtrasoMinutos / 60);
        totalAtrasoMinutos = totalAtrasoMinutos % 60;
        
        dados.push(['═ TOTAIS ═', '', totalAfastamento, totalFaltas, totalFeriados, totalAdicional, `${totalExtraHoras}h${totalExtraMinutos}m`, `${totalAtrasoHoras}h${totalAtrasoMinutos}m`, totalValeAlimentacao, totalValeTransporte]);
        
        const ws = XLSX.utils.aoa_to_sheet(dados);
        ws['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];
        
        // Estilos básicos
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
        
        for (let c = 0; c < 10; c++) {
            const titleCell = XLSX.utils.encode_cell({ r: 0, c: c });
            if (ws[titleCell]) {
                ws[titleCell].s = {
                    font: { bold: true, size: 16, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '0D3B66' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fechamento');
        
        const filename = `Relatorio_Fechamento_${departmentName}_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        showToast(`📊 Excel baixado: ${filename}`, 'success');
    } catch (e) {
        console.error('❌ Erro ao exportar Excel:', e);
        showToast('Erro ao exportar Excel: ' + e.message, 'error');
    }
}

function exportarFechamentoPDF(departmentName, startDate, endDate) {
    try {
        const elemento = document.getElementById('closing-report-result');
        if (!elemento) {
            showToast('Relatório não encontrado', 'error');
            return;
        }
        
        html2canvas(elemento, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            pdf.setFontSize(16);
            pdf.text(`Relatório de Fechamento - ${departmentName}`, pageWidth / 2, 15, { align: 'center' });
            
            pdf.setFontSize(11);
            pdf.text(`Período: ${startDate} até ${endDate}`, pageWidth / 2, 22, { align: 'center' });
            
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
            
            const filename = `Relatorio_Fechamento_${departmentName}_${Date.now()}.pdf`;
            pdf.save(filename);
            
            showToast(`📄 PDF baixado: ${filename}`, 'success');
        }).catch(err => {
            console.error('Erro ao gerar PDF:', err);
            showToast('Erro ao gerar PDF', 'error');
        });
    } catch (e) {
        console.error('Erro:', e);
        showToast('Erro: ' + e.message, 'error');
    }
}

/**
 * Inicializa o módulo de relatório de fechamento
 */
function initClosingReportModule() {
    console.log('🎯 Inicializando módulo de Relatório de Fechamento');
    
    // Buscar elemento container
    const container = document.getElementById('relatorios-content');
    
    if (!container) {
        console.warn('⚠️ Container de relatórios não encontrado');
        return;
    }
    
    const departments = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    
    console.log(`   Departamentos encontrados: ${departments.length}`);
    console.log(`   Afastamentos no localStorage: ${afastamentos.length}`);
    console.log(`   Afastamentos:`, afastamentos);
    
    if (departments.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhum departamento encontrado. Cadastre departamentos antes de gerar relatórios.</p>`;
        return;
    }
    
    // Criar interface
    let html = `
        <div style="padding: 20px;">
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end;">
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 5px;">Departamento:</label>
                    <select id="closing-report-department" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.9em;">
                        <option value="">Selecione um departamento</option>
                        ${departments.map(d => `<option value="${d.nome}">${d.nome}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 5px;">Data Inicial:</label>
                    <input type="date" id="closing-report-start" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.9em;">
                </div>
                
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 5px;">Data Final:</label>
                    <input type="date" id="closing-report-end" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font-size: 0.9em;">
                </div>
                
                <button id="closing-report-generate" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9em;">🔄 Gerar Relatório</button>
            </div>
            
            <div id="closing-report-result" style="background: var(--bg-secondary); padding: 20px; border-radius: 4px; border: 1px solid var(--border-color); overflow-x: auto;">
                <p style="text-align: center; color: var(--text-secondary);">Selecione os filtros e clique em "Gerar Relatório"</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Setup event listeners
    const deptSelect = document.getElementById('closing-report-department');
    const startInput = document.getElementById('closing-report-start');
    const endInput = document.getElementById('closing-report-end');
    const generateBtn = document.getElementById('closing-report-generate');
    
    // Definir data padrão (mês atual)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    startInput.value = firstDay.toISOString().split('T')[0];
    endInput.value = lastDay.toISOString().split('T')[0];
    
    generateBtn.addEventListener('click', () => {
        const department = deptSelect.value;
        const startDate = startInput.value;
        const endDate = endInput.value;
        
        if (!department) {
            alert('Por favor, selecione um departamento');
            return;
        }
        
        if (!startDate || !endDate) {
            alert('Por favor, preencha as datas');
            return;
        }
        
        const reportHTML = generateClosingReportHTML(department, startDate, endDate);
        document.getElementById('closing-report-result').innerHTML = reportHTML;
        
        // Adicionar event listeners aos botões de exportação
        setTimeout(() => {
            const pdfBtn = document.getElementById('btn-export-pdf');
            const excelBtn = document.getElementById('btn-export-excel');
            
            if (pdfBtn) {
                pdfBtn.onclick = () => exportarFechamentoPDF(department, startDate, endDate);
            }
            
            if (excelBtn) {
                excelBtn.onclick = () => exportarFechamentoExcel(department, startDate, endDate);
            }
        }, 50);
    });
    
    console.log('✅ Módulo de Relatório de Fechamento inicializado');
}

// Exportar função para navigation.js
window.initClosingReportModule = initClosingReportModule;
