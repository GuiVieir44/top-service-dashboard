// ==========================================
// MÓDULO DE GRÁFICOS - TOP SERVICE
// ==========================================

console.log('📊 Módulo de gráficos carregado');

let chartsInstances = [];
let lastOvertimeTotal = 0; // Armazenar último total de horas extras
let lastDelayTotal = 0;    // Armazenar último total de atrasos

/**
 * Formata horas decimais em formato "xhymin"
 * Ex: 1.5 -> "1h30min", 0.75 -> "45min"
 */
function formatarTempoGlobal(horasDecimais) {
    if (!horasDecimais || horasDecimais === 0) return '0h';
    
    const horas = Math.floor(horasDecimais);
    const minutos = Math.round((horasDecimais - horas) * 60);
    
    if (horas === 0) {
        return minutos + 'min';
    } else if (minutos === 0) {
        return horas + 'h';
    } else {
        return horas + 'h' + minutos + 'min';
    }
}

/**
 * Limpa instâncias de gráficos anteriores
 */
function destroyAllCharts() {
    chartsInstances.forEach(chart => {
        if (chart) chart.destroy();
    });
    chartsInstances = [];
}

/**
 * Gráfico 1: Pontos por Funcionário (hoje)
 */
function createPunchByEmployeeChart() {
    destroyAllCharts();
    
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    
    // Filtrar punches de hoje
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const todayPunches = punches.filter(p => {
        const punchDate = p.timestamp.split('T')[0]; // Extract YYYY-MM-DD from timestamp
        return punchDate === todayStr;
    });
    
    // Contar punches por funcionário
    const punchCount = {};
    todayPunches.forEach(p => {
        punchCount[p.employeeId] = (punchCount[p.employeeId] || 0) + 1;
    });
    
    // Mapear IDs para nomes
    const labels = Object.keys(punchCount).map(empId => {
        const emp = employees.find(e => e.id == empId);
        return emp ? emp.nome : `ID ${empId}`;
    });
    
    const data = Object.values(punchCount);
    
    const ctx = document.getElementById('chartPunchByEmployee')?.getContext('2d');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sem dados'],
            datasets: [{
                label: 'Pontos Registrados',
                data: data.length > 0 ? data : [0],
                backgroundColor: [
                    'rgba(255, 215, 0, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                ],
                borderColor: [
                    'var(--dourado)',
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#9b59b6',
                ],
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 600 },
                        padding: 15,
                    }
                },
                title: {
                    display: true,
                    text: '📊 Pontos Registrados - Hoje',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                },
                x: {
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
    
    chartsInstances.push(chart);
}

/**
 * Gráfico 2: Presença Hoje - SIMPLES E DIRETO
 * Presentes: com ponto
 * Faltas: type FALTA
 * Folgas: type FOLGA
 * Feriados: type FERIADO
 * Ausentes: resto
 */
function createPresenceTodayChart() {
    destroyAllCharts();
    
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    const absences = (window.supabaseRealtime && window.supabaseRealtime.data.absences) || [];
    
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`\n📊 DEBUG - PRESENÇA HOJE: ${today}`);
    console.log(`   Total absences no BD: ${absences.length}`);
    
    // MOSTRAR TODAS AS ABSENCES DE HOJE
    const absencesHoje = absences.filter(a => a.date === today);
    console.log(`   Absences de hoje: ${absencesHoje.length}`, absencesHoje);
    
    // MOSTRAR TODOS OS TIPOS
    absencesHoje.forEach(a => {
        console.log(`      ID: ${a.employeeId}, Type: "${a.type}", Date: ${a.date}`);
    });
    
    // DADOS
    const presentes = punches.filter(p => p.timestamp.split('T')[0] === today).map(p => p.employeeId);
    
    const faltas = absences.filter(a => {
        const match = a.date === today && (a.type === 'FALTA' || a.type === 'falta');
        if (match) console.log(`      ✅ Falta encontrada: ${a.employeeId}`);
        return match;
    }).map(a => a.employeeId);
    
    const folgas = absences.filter(a => {
        const match = a.date === today && (a.type === 'FOLGA' || a.type === 'folga');
        if (match) console.log(`      ✅ Folga encontrada: ${a.employeeId}`);
        return match;
    }).map(a => a.employeeId);
    
    const feriados = absences.filter(a => {
        const match = a.date === today && (a.type === 'FERIADO' || a.type === 'feriado');
        if (match) console.log(`      ✅ Feriado encontrado: ${a.employeeId}`);
        return match;
    }).map(a => a.employeeId);
    
    const presentesSet = new Set(presentes);
    const faltasSet = new Set(faltas);
    const folgasSet = new Set(folgas);
    const feriadosSet = new Set(feriados);
    
    const ausentes = employees.filter(e =>
        e.status === 'Ativo' &&
        !presentesSet.has(e.id) &&
        !faltasSet.has(e.id) &&
        !folgasSet.has(e.id) &&
        !feriadosSet.has(e.id)
    ).length;
    
    console.log(`\n   ✅ Presentes: ${presentesSet.size}`);
    console.log(`   ❌ Faltas: ${faltasSet.size}`);
    console.log(`   🔵 Folgas: ${folgasSet.size}`);
    console.log(`   🎉 Feriados: ${feriadosSet.size}`);
    console.log(`   🔴 Ausentes: ${ausentes}\n`);
    
    window.presenceChartData = { today, presentesSet, faltasSet, folgasSet, feriadosSet, employees };
    
    const ctx = document.getElementById('chartPresenceToday')?.getContext('2d');
    if (!ctx) {
        console.warn('❌ Canvas chartPresenceToday não encontrado');
        return;
    }
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presentes', 'Faltas', 'Folgas', 'Feriados', 'Ausentes'],
            datasets: [{
                data: [presentesSet.size, faltasSet.size, folgasSet.size, feriadosSet.size, ausentes],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',   // Verde
                    'rgba(241, 196, 15, 0.8)',   // Amarelo
                    'rgba(52, 152, 219, 0.8)',   // Azul
                    'rgba(155, 89, 182, 0.8)',   // Roxo
                    'rgba(231, 76, 60, 0.8)',    // Vermelho
                ],
                borderColor: ['#2ecc71', '#f1c40f', '#3498db', '#9b59b6', '#e74c3c'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            onClick: (evt, activeElements) => {
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    const cats = ['Presentes', 'Faltas', 'Folgas', 'Feriados', 'Ausentes'];
                    showPresenceModal(cats[idx]);
                }
            },
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 12, weight: 600 }, padding: 15 } },
                title: { display: true, text: 'Presença Hoje', font: { size: 14, weight: 'bold' }, padding: 15 }
            }
        }
    });
    
    chartsInstances.push(chart);
    console.log('✅ Gráfico criado\n');
}

function showPresenceModal(cat) {
    const d = window.presenceChartData;
    if (!d) return;
    
    let list = [];
    if (cat === 'Presentes') list = d.employees.filter(e => d.presentesSet.has(e.id));
    else if (cat === 'Faltas') list = d.employees.filter(e => d.faltasSet.has(e.id));
    else if (cat === 'Folgas') list = d.employees.filter(e => d.folgasSet.has(e.id));
    else if (cat === 'Feriados') list = d.employees.filter(e => d.feriadosSet.has(e.id));
    else if (cat === 'Ausentes') list = d.employees.filter(e => e.status === 'Ativo' && !d.presentesSet.has(e.id) && !d.faltasSet.has(e.id) && !d.folgasSet.has(e.id) && !d.feriadosSet.has(e.id));
    
    showEmployeeListModal(cat, list);
}

/**
 * Gráfico 3: Afastamentos por Tipo - COM INTERATIVIDADE
 */
function createAbsenceByTypeChart() {
    const afastamentos = (window.supabaseRealtime && window.supabaseRealtime.data.afastamentos) || [];
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    
    // Contar por tipo (corrigido: usar 'type' em vez de 'tipo')
    const typeCount = {};
    afastamentos.forEach(a => {
        const type = a.type || 'Outro';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCount);
    const data = Object.values(typeCount);
    
    const ctx = document.getElementById('chartAbsenceType')?.getContext('2d');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.length > 0 ? labels : ['Sem dados'],
            datasets: [{
                data: data.length > 0 ? data : [0],
                backgroundColor: [
                    'rgba(255, 215, 0, 0.8)',
                    'rgba(230, 126, 34, 0.8)',
                    'rgba(41, 128, 185, 0.8)',
                    'rgba(142, 68, 173, 0.8)',
                ],
                borderColor: [
                    'var(--dourado)',
                    '#e67e22',
                    '#2980b9',
                    '#8e44ad',
                ],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const type = labels[index];
                    showAbsenceDetails(type, afastamentos, employees);
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: 600 },
                        padding: 15,
                    }
                },
                title: {
                    display: true,
                    text: 'Afastamentos por Tipo',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            }
        }
    });
    
    chartsInstances.push(chart);
}

/**
 * Mostra detalhes de afastamentos em modal
 */
function showAbsenceDetails(type, afastamentos, employees) {
    const filtered = afastamentos.filter(a => (a.type || 'Outro') === type);
    const employeeIds = new Set(filtered.map(a => a.employeeId));
    const list = employees.filter(e => employeeIds.has(e.id));
    
    let html = `<div style="padding: 15px;">`;
    html += `<h3 style="margin-bottom: 15px;">Funcionários Afastados por: ${type}</h3>`;
    html += `<div style="overflow-y: auto; max-height: 400px;">`;
    
    if (list.length === 0) {
        html += `<p style="color: #999;">Nenhum funcionário afastado nesta categoria.</p>`;
    } else {
        html += `<table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr style="background: var(--dourado); color: black;">`;
        html += `<th style="padding: 10px; text-align: left;">Matrícula</th>`;
        html += `<th style="padding: 10px; text-align: left;">Nome</th>`;
        html += `<th style="padding: 10px; text-align: left;">Departamento</th>`;
        html += `</tr></thead>`;
        html += `<tbody>`;
        
        list.forEach(emp => {
            const affDetail = filtered.find(a => a.employeeId === emp.id);
            html += `<tr style="border-bottom: 1px solid #eee;">`;
            html += `<td style="padding: 10px;">${emp.matricula || '-'}</td>`;
            html += `<td style="padding: 10px;"><strong>${emp.nome}</strong></td>`;
            html += `<td style="padding: 10px;">${emp.departamento || '-'}</td>`;
            html += `</tr>`;
        });
        
        html += `</tbody></table>`;
    }
    
    html += `</div></div>`;
    
    showModal('Detalhes de Afastamento', html);
}

/**
 * Gráfico 4: Horas Extras (este mês)
 * Calcula horas extras: funcionários que trabalham MAIS que a carga horária
 */
function createOvertimeChart() {
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    const cargosDept = (window.supabaseRealtime && window.supabaseRealtime.data.cargos_departamento) || [];
    const absences = (window.supabaseRealtime && window.supabaseRealtime.data.absences) || [];
    
    console.log('[OVERTIME] 📊 Total de punches no cache:', punches.length);
    console.log('[OVERTIME] 📊 Total de employees:', employees.length);
    console.log('[OVERTIME] 📊 Total de ausências:', absences.length);
    
    // Filtrar punches deste mês
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    console.log(`[OVERTIME] 📅 Mês/Ano atual: ${currentMonth}/${currentYear}`);
    
    const monthPunches = punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    console.log('[OVERTIME] 📊 Punches deste mês:', monthPunches.length);
    if (monthPunches.length > 0) {
        console.log('[OVERTIME] 📍 Primeiros 3 punches:', monthPunches.slice(0, 3));
    }
    
    // ===== CORREÇÃO PARA HORÁRIOS NOTURNOS =====
    // Agrupar punches por funcionário e JORNADA (entrada até saída)
    // Isso permite lidar com jornadas que cruzam meia-noite
    
    const journeysByEmployee = {};
    
    // Primeiro, construir jornadas completas (entrada + saída)
    Object.values(monthPunches).forEach(p => {
        if (!journeysByEmployee[p.employeeId]) {
            journeysByEmployee[p.employeeId] = [];
        }
        journeysByEmployee[p.employeeId].push(p);
    });
    
    // Calcular horas extras por funcionário
    const overtimeByEmployee = {};
    
    Object.entries(journeysByEmployee).forEach(([employeeId, employeePunches]) => {
        const emp = employees.find(e => e.id == employeeId);
        if (!emp) return;
        
        // ✅ Buscar horário esperado do funcionário (cargo + departamento)
        let horaInicio = 8; // padrão em horas
        let horaFim = 17;
        
        if (emp.departamento && emp.cargo) {
            const departamentos = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
            const dept = departamentos.find(d => d.nome === emp.departamento);
            
            if (dept) {
                const cargos = JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
                const cargo = cargos.find(c => c.nome === emp.cargo);
                
                if (cargo) {
                    const cargosDeptLocal = JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
                    const cargoCustomizado = cargosDeptLocal.find(cd => 
                        cd.departmentId === dept.id && cd.cargoId === cargo.id
                    );
                    
                    if (cargoCustomizado) {
                        const [inicioH] = cargoCustomizado.horaInicio.split(':').map(Number);
                        const [fimH] = cargoCustomizado.horaFim.split(':').map(Number);
                        horaInicio = inicioH;
                        horaFim = fimH;
                    }
                }
            }
        }
        
        // Calcular horas esperadas por jornada
        let horasEsperadasPorJornada = Math.max(0, horaFim - horaInicio - 1);
        const ehNoturnaConfig = horaInicio >= 19 || horaFim <= 7;
        if (ehNoturnaConfig) {
            horasEsperadasPorJornada = 11; // Noturna: 12h bruto - 1h intervalo = 11h
        }
        
        // Obter horário de início do cargo
        const horaInicioStr = horaInicio + ':00';
        const [horaInicioNum, minInicio] = horaInicioStr.split(':').map(Number);
        const horarioEsperadoMs = horaInicioNum * 60 * 60 * 1000 + minInicio * 60 * 1000;
        
        // Ordenar todos os pontos por timestamp
        const sortedPunches = employeePunches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Agrupar em jornadas: entrada → saída
        const journeys = [];
        for (let i = 0; i < sortedPunches.length; i++) {
            if (sortedPunches[i].type === 'Entrada') {
                // Procurar próxima saída
                let saida = null;
                for (let j = i + 1; j < sortedPunches.length; j++) {
                    if (sortedPunches[j].type === 'Saída') {
                        saida = sortedPunches[j];
                        break;
                    }
                }
                
                if (saida) {
                    journeys.push({
                        entrada: new Date(sortedPunches[i].timestamp),
                        saida: new Date(saida.timestamp),
                        entradaDay: sortedPunches[i].timestamp.split('T')[0]
                    });
                }
            }
        }
        
        // Calcular horas por jornada (considerando que pode cruzar meia-noite)
        let totalHorasTrabalhadas = 0;
        let totalAdiantamentoMinutos = 0;
        
        journeys.forEach(journey => {
            // Horas trabalhadas nesta jornada
            const horas = (journey.saida - journey.entrada) / (1000 * 60 * 60);
            
            // Descontar intervalo de almoço (1 hora por padrão)
            const horasAjustadas = Math.max(0, horas - 1);
            totalHorasTrabalhadas += horasAjustadas;
            
            // Se esta entrada foi no dia esperado do mês, contar adiantamento
            if (journey.entradaDay.substring(0, 7) === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`) {
                const horaEntrada = journey.entrada.getHours();
                const minEntrada = journey.entrada.getMinutes();
                const horaEntradaMs = horaEntrada * 60 * 60 * 1000 + minEntrada * 60 * 1000;
                
                if (horaEntradaMs < horarioEsperadoMs) {
                    const diffMs = horarioEsperadoMs - horaEntradaMs;
                    totalAdiantamentoMinutos += Math.round(diffMs / (60 * 1000));
                }
            }
        });
        
        // ✅ NOVO: Detectar se é jornada NOTURNA (uma única jornada que cruza meia-noite)
        let ehNoturna = false;
        if (journeys.length === 1) {
            const entrada = journeys[0].entrada.getHours();
            const saida = journeys[0].saida.getHours();
            
            // Noturna = UMA jornada que entra >= 19h E sai <= 07h
            if (entrada >= 19 && saida <= 7) {
                ehNoturna = true;
            }
        }
        
        // Calcular extra: horas trabalhadas - horas esperadas (por dia trabalhado)
        const diasTrabalhados = journeys.length;
        // ✅ Se for noturno, esperado é 11h; senão, usar customizado do cargo
        let horasEsperadasTotal = horasEsperadasPorJornada * diasTrabalhados;
        if (ehNoturna) {
            horasEsperadasTotal = 11; // Uma jornada noturna = 11h
        }
        const extra = Math.max(0, totalHorasTrabalhadas - horasEsperadasTotal);
        
        // ⚠️ IMPORTANTE: NÃO somar adiantamento como hora extra
        // Adiantamento é quando chega cedo, não é trabalho extra
        // Apenas contar como extra o que foi trabalhado ALÉM do esperado
        const totalExtra = extra;
        
        if (totalExtra > 0) {
            if (!overtimeByEmployee[employeeId]) {
                overtimeByEmployee[employeeId] = {
                    name: emp.nome,
                    totalExtra: 0,
                    adiantamento: 0,
                    extra: 0,
                    faltas: 0
                };
            }
            overtimeByEmployee[employeeId].totalExtra += totalExtra;
            overtimeByEmployee[employeeId].adiantamento += (totalAdiantamentoMinutos / 60);
            overtimeByEmployee[employeeId].extra += extra;
        }
    });
    
    // Contar faltas por funcionário no mês
    absences.forEach(absence => {
        if (absence.type === 'falta') {
            const absDate = new Date(absence.date);
            if (absDate.getMonth() === currentMonth && absDate.getFullYear() === currentYear) {
                const emp = employees.find(e => e.id == absence.employeeId);
                if (emp) {
                    if (!overtimeByEmployee[absence.employeeId]) {
                        overtimeByEmployee[absence.employeeId] = {
                            name: emp.nome,
                            totalExtra: 0,
                            adiantamento: 0,
                            extra: 0,
                            faltas: 0
                        };
                    }
                    overtimeByEmployee[absence.employeeId].faltas += 1;
                }
            }
        }
    });
    
    // Filtrar funcionários com horas extras ou faltas e arredondar
    const overtimeData = Object.values(overtimeByEmployee)
        .map(d => ({
            name: d.name + (d.faltas > 0 ? ` ⚠️ ${d.faltas}F` : ''),
            hours: Math.round(d.totalExtra * 100) / 100,
            adiantamento: Math.round(d.adiantamento * 100) / 100,
            extra: Math.round(d.extra * 100) / 100,
            faltas: d.faltas
        }))
        .filter(d => d.hours > 0 || d.faltas > 0)
        .sort((a, b) => b.hours - a.hours);
    
    // Calcular e armazenar total (AGORA INCLUI ADIANTAMENTOS)
    lastOvertimeTotal = overtimeData.reduce((sum, d) => sum + d.hours, 0);
    console.log('📊 Total de horas extras (incluindo adiantamentos):', lastOvertimeTotal);
    console.log('📊 Detalhes by employee:', overtimeData);
    
    const labels = overtimeData.map(d => d.name);
    const data = overtimeData.map(d => d.hours);
    
    const ctx = document.getElementById('chartOvertime')?.getContext('2d');
    if (!ctx) return;
    
    // Se não há dados, mostrar mensagem
    if (data.length === 0) {
        const container = ctx.canvas.parentElement;
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-tertiary); font-size: 16px;">📊 Nenhuma hora extra ou falta registrada este mês</div>';
        return;
    }
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Extras',
                data: data,
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: '#e74c3c',
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 600 },
                    }
                },
                title: {
                    display: true,
                    text: '⏰ Horas Extras - Este Mês (Trabalho acima da carga horária + Adiantamentos)',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                },
                y: {
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
    
    chartsInstances.push(chart);
}

/**
 * Gráfico 5: Atrasos (este mês)
 * Calcula atrasos: funcionários que entram APÓS a hora prevista
 */
function createDelaysChart() {
    if (typeof getFormattedDelays !== 'function') {
        console.warn('Módulo atrasos não carregado');
        return;
    }
    
    const delayData = getFormattedDelays();
    console.log('📊 Dados de atrasos para gráfico:', delayData);
    
    const labels = delayData.map(d => d.name);
    const data = delayData.map(d => Math.round((d.delayMinutes / 60) * 100) / 100); // Converte para horas
    
    console.log('   Labels:', labels);
    console.log('   Data (horas):', data);
    
    // Armazenar total de atrasos
    lastDelayTotal = data.reduce((sum, d) => sum + d, 0);
    console.log('⏰ Total de atrasos armazenado:', lastDelayTotal);
    
    const ctx = document.getElementById('chartDelays')?.getContext('2d');
    if (!ctx) {
        console.warn('⚠️  Canvas chartDelays não encontrado');
        return;
    }
    
    // Se não há dados, mostrar mensagem
    if (data.length === 0) {
        console.log('   ℹ️  Nenhum atraso registrado');
        const container = ctx.canvas.parentElement;
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-tertiary); font-size: 16px;">✅ Nenhum atraso registrado este mês</div>';
        return;
    }
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas de Atraso',
                data: data,
                backgroundColor: 'rgba(241, 196, 15, 0.7)',
                borderColor: '#f39c12',
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 600 },
                    }
                },
                title: {
                    display: true,
                    text: '⏱️ Atrasos - Este Mês (Entrada após horário)',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                },
                y: {
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
    
    chartsInstances.push(chart);
    console.log('✅ Gráfico de atrasos criado com sucesso');
}

// ===== PAINEL DE AVISOS =====
let currentAlertsPage = 0;
let allAlerts = [];

/**
 * Gera avisos de funcionários faltantes, atrasados e afastados
 */
function generateAlerts() {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    const atrasos = JSON.parse(localStorage.getItem('topservice_delays_v1') || '[]');
    
    allAlerts = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Funcionários em falta hoje
    const faltasHoje = absences.filter(a => a.date === today && (a.type === 'FALTA' || a.type === 'falta'));
    faltasHoje.forEach(falta => {
        const emp = employees.find(e => e.id == falta.employeeId);
        if (emp) {
            allAlerts.push({
                tipo: 'FALTA',
                icon: '❌',
                color: '#e74c3c',
                titulo: `Falta: ${emp.nome}`,
                descricao: `${emp.matricula} - ${emp.departamento || '-'}`,
                data: today
            });
        }
    });
    
    // 2. Funcionários com atraso hoje
    const atrasadosHoje = atrasos.filter(a => a.date === today && a.totalDelayMinutes > 0);
    atrasadosHoje.slice(0, 5).forEach(atraso => {
        const emp = employees.find(e => e.id == atraso.employeeId);
        if (emp) {
            const minutos = atraso.totalDelayMinutes;
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            allAlerts.push({
                tipo: 'ATRASO',
                icon: '⏰',
                color: '#f39c12',
                titulo: `Atraso: ${emp.nome}`,
                descricao: `${emp.matricula} - Atraso: ${horas}h${mins}m`,
                data: today
            });
        }
    });
    
    // 3. Funcionários em afastamento
    const agora = new Date();
    afastamentos.forEach(afast => {
        const dataInicio = new Date(afast.dataInicio);
        const dataFim = new Date(afast.dataFim);
        
        if (dataInicio <= agora && dataFim >= agora) {
            const emp = employees.find(e => e.id == afast.funcionarioId);
            if (emp) {
                const diasRestantes = Math.ceil((dataFim - agora) / (1000 * 60 * 60 * 24));
                allAlerts.push({
                    tipo: 'AFASTAMENTO',
                    icon: '🏥',
                    color: '#9b59b6',
                    titulo: `Afastado: ${emp.nome}`,
                    descricao: `${emp.matricula} - Volta em ${diasRestantes} dia(s) (${dataFim.toLocaleDateString('pt-BR')})`,
                    data: afast.dataFim
                });
            }
        }
    });
    
    displayAlerts();
}

/**
 * Exibe os avisos com paginação
 */
function displayAlerts() {
    const container = document.getElementById('alerts-container');
    const paginationDiv = document.getElementById('alerts-pagination');
    
    if (!container) return;
    
    const itemsPerPage = 4;
    const totalPages = Math.ceil(allAlerts.length / itemsPerPage);
    
    if (allAlerts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 20px;">✅ Nenhum aviso importante no momento</p>';
        paginationDiv.style.display = 'none';
        return;
    }
    
    const start = currentAlertsPage * itemsPerPage;
    const end = start + itemsPerPage;
    const pageAlerts = allAlerts.slice(start, end);
    
    let html = '';
    pageAlerts.forEach(alert => {
        html += `
            <div style="background: var(--bg-elevated); border-left: 4px solid ${alert.color}; padding: 15px; border-radius: 6px; border: 1px solid var(--border-color);">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <span style="font-size: 1.5rem;">${alert.icon}</span>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: ${alert.color}; font-weight: 600;">${alert.titulo}</h4>
                        <p style="margin: 5px 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">${alert.descricao}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Mostrar paginação se houver mais de uma página
    if (totalPages > 1) {
        paginationDiv.style.display = 'flex';
        document.getElementById('alerts-page-info').textContent = `Página ${currentAlertsPage + 1} de ${totalPages}`;
    } else {
        paginationDiv.style.display = 'none';
    }
}

/**
 * Navega para próxima página de avisos
 */
function nextAlertsPage() {
    const itemsPerPage = 4;
    const totalPages = Math.ceil(allAlerts.length / itemsPerPage);
    if (currentAlertsPage < totalPages - 1) {
        currentAlertsPage++;
        displayAlerts();
    }
}

/**
 * Navega para página anterior de avisos
 */
function previousAlertsPage() {
    if (currentAlertsPage > 0) {
        currentAlertsPage--;
        displayAlerts();
    }
}

/**
 * Inicializa todos os gráficos no dashboard
 */
function initCharts() {
    // Aguardar rendering do DOM
    setTimeout(() => {
        try {
            console.log('🔧 Inicializando gráficos...');
            createPresenceTodayChart();
            console.log('✅ createPresenceTodayChart OK');
            createAbsenceByTypeChart();
            console.log('✅ createAbsenceByTypeChart OK');
            generateAlerts();
            console.log('✅ generateAlerts OK');
            console.log('✅ Gráficos inicializados com sucesso');
        } catch (e) {
            console.error('❌ Erro ao inicializar gráficos:', e);
            console.error('❌ Stack:', e.stack);
        }
    }, 100);
}

/**
 * Re-renderiza todos os gráficos (útil ao voltar para dashboard)
 */
function refreshCharts() {
    destroyAllCharts();
    initCharts();
}

/**
 * Mostra modal com conteúdo HTML personalizado
 */
function showModal(title, content) {
    const modalId = 'chart-modal-' + Date.now();
    
    const html = `
        <div id="${modalId}" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001;">
            <div style="background: var(--bg-secondary); border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--dourado);">
                    <h3 style="margin: 0; color: var(--text-primary);">${title}</h3>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕</button>
                </div>
                <div style="color: var(--text-primary);">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    
    // Fechar ao clicar fora
    document.getElementById(modalId).addEventListener('click', (e) => {
        if (e.target.id === modalId) {
            document.getElementById(modalId).remove();
        }
    });
}

/**
 * Mostra lista de funcionários em modal (genérico)
 */
function showEmployeeListModal(category, employees) {
    let html = `<div style="padding: 15px;">`;
    html += `<h4 style="margin-bottom: 15px; color: var(--text-primary);">${category}</h4>`;
    
    if (employees.length === 0) {
        html += `<p style="color: var(--text-tertiary);">Nenhum funcionário encontrado nesta categoria.</p>`;
    } else {
        html += `<table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr style="background: var(--dourado); color: black;">`;
        html += `<th style="padding: 10px; text-align: left;">Matrícula</th>`;
        html += `<th style="padding: 10px; text-align: left;">Nome</th>`;
        html += `<th style="padding: 10px; text-align: left;">Cargo</th>`;
        html += `<th style="padding: 10px; text-align: left;">Departamento</th>`;
        html += `</tr></thead>`;
        html += `<tbody>`;
        
        employees.forEach(emp => {
            html += `<tr style="border-bottom: 1px solid var(--bg-tertiary);">`;
            html += `<td style="padding: 10px; color: var(--text-primary);">${emp.matricula || '-'}</td>`;
            html += `<td style="padding: 10px; color: var(--text-primary);"><strong>${emp.nome}</strong></td>`;
            html += `<td style="padding: 10px; color: var(--text-primary);">${emp.cargo || '-'}</td>`;
            html += `<td style="padding: 10px; color: var(--text-primary);">${emp.departamento || '-'}</td>`;
            html += `</tr>`;
        });
        
        html += `</tbody></table>`;
    }
    
    html += `</div>`;
    
    showModal('Detalhes - ' + category, html);
}

/**
 * Calcula o total de horas extras do mês em horas
 */
function getTotalMonthlyOvertimeHours() {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const cargosDept = JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
    
    // Filtrar punches deste mês
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPunches = punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    // Agrupar punches por funcionário e dia
    const dailyPunches = {};
    monthPunches.forEach(p => {
        const day = p.timestamp.split('T')[0];
        const key = `${p.employeeId}_${day}`;
        if (!dailyPunches[key]) {
            dailyPunches[key] = { employeeId: p.employeeId, day: day, punches: [] };
        }
        dailyPunches[key].punches.push(p);
    });
    
    let totalOvertimeHours = 0;
    
    Object.values(dailyPunches).forEach(dayData => {
        const emp = employees.find(e => e.id == dayData.employeeId);
        if (!emp) return;
        
        // Obter cargo do funcionário para saber horas esperadas
        const cargoCustomizado = cargosDept.find(cd => cd.departmentId == emp.departamento);
        const horasEsperadas = cargoCustomizado ? cargoCustomizado.horasEfetivas : 8;
        
        // Calcular horas trabalhadas neste dia
        const dayPunches = dayData.punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let horasTrabalhadas = 0;
        
        // Pega pares de entrada/saída
        for (let i = 0; i < dayPunches.length - 1; i += 2) {
            if (dayPunches[i].type === 'Entrada' && dayPunches[i + 1].type === 'Saída') {
                const entrada = new Date(dayPunches[i].timestamp);
                const saida = new Date(dayPunches[i + 1].timestamp);
                const horas = (saida - entrada) / (1000 * 60 * 60);
                horasTrabalhadas += horas;
            }
        }
        
        // Calcular extra: horas trabalhadas - horas esperadas
        const extra = Math.max(0, horasTrabalhadas - horasEsperadas);
        totalOvertimeHours += extra;
    });
    
    console.log('📊 Horas extras calculadas:', totalOvertimeHours);
    return Math.round(totalOvertimeHours * 100) / 100;
}

// Versão melhorada com suporte a cargos globais
function getTotalMonthlyOvertimeHoursV2() {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const cargosDept = JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
    const cargosGlobais = JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
    
    console.log('📊 DEBUG v2: punches='+punches.length+', employees='+employees.length+', cargosDept='+cargosDept.length+', cargosGlobais='+cargosGlobais.length);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPunches = punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    console.log('  Mês tem:', monthPunches.length, 'pontos');
    
    const dailyPunches = {};
    monthPunches.forEach(p => {
        const day = p.timestamp.split('T')[0];
        const key = `${p.employeeId}_${day}`;
        if (!dailyPunches[key]) {
            dailyPunches[key] = { employeeId: p.employeeId, day: day, punches: [] };
        }
        dailyPunches[key].punches.push(p);
    });
    
    let totalOvertimeHours = 0;
    let daysProcessed = 0;
    
    Object.values(dailyPunches).forEach(dayData => {
        const emp = employees.find(e => e.id == dayData.employeeId);
        if (!emp) return;
        
        daysProcessed++;
        let horasEsperadas = 8;
        
        // Tenta cargo customizado
        const cargoCustomizado = cargosDept.find(cd => cd.departmentId == emp.departamento);
        if (cargoCustomizado && cargoCustomizado.horasEfetivas) {
            horasEsperadas = cargoCustomizado.horasEfetivas;
        } else if (emp.cargo) {
            // Trata cargos globais
            const cargoGlobal = cargosGlobais.find(c => c.nome === emp.cargo);
            if (cargoGlobal && cargoGlobal.horasDia) {
                horasEsperadas = cargoGlobal.horasDia;
            }
        }
        
        const dayPunches = dayData.punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let horasTrabalhadas = 0;
        
        for (let i = 0; i < dayPunches.length - 1; i += 2) {
            if (dayPunches[i].type === 'Entrada' && dayPunches[i + 1] && dayPunches[i + 1].type === 'Saída') {
                const entrada = new Date(dayPunches[i].timestamp);
                const saida = new Date(dayPunches[i + 1].timestamp);
                const horas = (saida - entrada) / (1000 * 60 * 60);
                horasTrabalhadas += horas;
            }
        }
        
        const extra = Math.max(0, horasTrabalhadas - horasEsperadas);
        totalOvertimeHours += extra;
    });
    
    console.log('  Dias:', daysProcessed, '-> Horas extras:', totalOvertimeHours);
    return Math.round(totalOvertimeHours * 100) / 100;
}


