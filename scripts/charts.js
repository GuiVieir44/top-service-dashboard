// ==========================================
// MÓDULO DE GRÁFICOS - TOP SERVICE
// ==========================================

console.log('📊 Módulo de gráficos carregado');

let chartsInstances = [];

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
 * Gráfico 1: Pontos por Funcionário (últimos 7 dias)
 */
function createPunchByEmployeeChart() {
    destroyAllCharts();
    
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    // Filtrar punches dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPunches = punches.filter(p => {
        const punchDate = new Date(p.timestamp);
        return punchDate >= sevenDaysAgo;
    });
    
    // Contar punches por funcionário
    const punchCount = {};
    recentPunches.forEach(p => {
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
                    text: '📊 Pontos Registrados - Últimos 7 Dias',
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
 * Gráfico 2: Presença Hoje (Entrada/Saída)
 */
function createPresenceTodayChart() {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    // Filtrar ponches de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today);
    
    // Contar Entradas e Saídas
    const entries = todayPunches.filter(p => p.type === 'Entrada').length;
    const exits = todayPunches.filter(p => p.type === 'Saída').length;
    const absent = employees.length - entries;
    
    const ctx = document.getElementById('chartPresenceToday')?.getContext('2d');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['✅ Presentes', '❌ Ausentes', '🚪 Saídas'],
            datasets: [{
                data: [entries, absent, exits],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                ],
                borderColor: [
                    '#2ecc71',
                    '#e74c3c',
                    '#3498db',
                ],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                    text: '👥 Presença Hoje',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            }
        }
    });
    
    chartsInstances.push(chart);
}

/**
 * Gráfico 3: Afastamentos por Tipo
 */
function createAbsenceByTypeChart() {
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    
    // Contar por tipo
    const typeCount = {};
    afastamentos.forEach(a => {
        typeCount[a.tipo] = (typeCount[a.tipo] || 0) + 1;
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
                    text: '🏖️ Afastamentos por Tipo',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                }
            }
        }
    });
    
    chartsInstances.push(chart);
}

/**
 * Gráfico 4: Horas Extras (este mês)
 */
function createOvertimeChart() {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    // Filtrar punches deste mês
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPunches = punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    // Calcular horas por funcionário (simplificado)
    const hoursMap = {};
    monthPunches.forEach(p => {
        if (!hoursMap[p.employeeId]) {
            hoursMap[p.employeeId] = { entries: 0, exits: 0 };
        }
        if (p.type === 'Entrada') hoursMap[p.employeeId].entries += 1;
        else hoursMap[p.employeeId].exits += 1;
    });
    
    // Calcular horas extras (simplificado: 1 par entrada/saída = 8h, acima disso é extra)
    const overtimeData = Object.entries(hoursMap).map(([empId, data]) => {
        const pairs = Math.min(data.entries, data.exits);
        const normalHours = pairs * 8;
        const extraHours = Math.max(0, (data.entries + data.exits) - (pairs * 2)) * 4; // simplificado
        return {
            name: employees.find(e => e.id == empId)?.nome || `ID ${empId}`,
            hours: extraHours
        };
    }).filter(d => d.hours > 0);
    
    const labels = overtimeData.map(d => d.name);
    const data = overtimeData.map(d => d.hours);
    
    const ctx = document.getElementById('chartOvertime')?.getContext('2d');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sem dados'],
            datasets: [{
                label: 'Horas Extras',
                data: data.length > 0 ? data : [0],
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
                    text: '⏰ Horas Extras - Este Mês',
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
 * Inicializa todos os gráficos no dashboard
 */
function initCharts() {
    // Aguardar rendering do DOM
    setTimeout(() => {
        try {
            createPunchByEmployeeChart();
            createPresenceTodayChart();
            createAbsenceByTypeChart();
            createOvertimeChart();
            console.log('✅ Gráficos inicializados com sucesso');
        } catch (e) {
            console.error('❌ Erro ao inicializar gráficos:', e);
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
