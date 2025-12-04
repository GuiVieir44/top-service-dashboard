// ==========================================
// MÓDULO DE REGISTRO DE PONTO - TOP SERVICE
// ==========================================

// Key used in localStorage
var PUNCH_KEY = 'topservice_punches_v1';

// ===== DEBOUNCING =====
let savePunchesTimeout = null;
const PUNCH_SAVE_DELAY = 300; // ms

/**
 * Agenda salvamento de punches com debounce
 */
function scheduleSavePunches(punches) {
    if (savePunchesTimeout) {
        clearTimeout(savePunchesTimeout);
    }
    
    savePunchesTimeout = setTimeout(() => {
        performSavePunches(punches);
    }, PUNCH_SAVE_DELAY);
}

/**
 * Executa salvamento real de punches
 */
function performSavePunches(punches) {
    try {
        localStorage.setItem(PUNCH_KEY, JSON.stringify(punches));
        window.punches = punches; // Sincronizar global
        
        // Notificar persistência global
        if (typeof window.scheduleDebouncedsave === 'function') {
            window.scheduleDebouncedsave();
        }
        
        console.log('✅ Pontos salvos com debounce -', punches.length, 'registros');
    } catch (e) {
        console.error('Erro ao salvar punches:', e);
    }
}

function loadPunches() {
    try {
        return JSON.parse(localStorage.getItem(PUNCH_KEY) || '[]');
    } catch (e) {
        console.error('Erro ao carregar punches:', e);
        return [];
    }
}

function savePunches(punches) {
    // Usar debounce
    scheduleSavePunches(punches);
}

// ===== NOVO: Calcular adiantamentos do dia =====
function calculateTodayAdvancements() {
    try {
        const punches = loadPunches();
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        
        // Obter hoje
        const today = new Date().toISOString().split('T')[0];
        console.log('[ADIANTAMENTO] 📅 Calculando para:', today);
        
        // Pegar punches de hoje
        const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today && p.type === 'Entrada');
        console.log('[ADIANTAMENTO] 📊 Entradas de hoje:', todayPunches.length);
        
        let totalAdiantamento = 0;
        
        // Para cada entrada de hoje
        todayPunches.forEach(punch => {
            const emp = employees.find(e => e.id == punch.employeeId);
            if (!emp) return;
            
            const horaInicioStr = emp.horaInicio || '08:00';
            const [horaEsperada, minEsperada] = horaInicioStr.split(':').map(Number);
            const expectedMs = horaEsperada * 60 * 60 * 1000 + minEsperada * 60 * 1000;
            
            const entrada = new Date(punch.timestamp);
            const horaEntrada = entrada.getHours();
            const minEntrada = entrada.getMinutes();
            const actualMs = horaEntrada * 60 * 60 * 1000 + minEntrada * 60 * 1000;
            
            // Se entrou ANTES, é adiantamento
            if (actualMs < expectedMs) {
                const diffMs = expectedMs - actualMs;
                const diffHoras = diffMs / (1000 * 60 * 60);
                totalAdiantamento += diffHoras;
                console.log(`[ADIANTAMENTO] ${emp.nome}: +${(diffHoras * 60).toFixed(0)} min`);
            }
        });
        
        console.log('[ADIANTAMENTO] ✅ Total:', totalAdiantamento.toFixed(2), 'horas');
        return totalAdiantamento;
    } catch (e) {
        console.error('[ADIANTAMENTO] ❌ Erro:', e);
        return 0;
    }
}

function registerPunch(employeeId, type, rf = null) {
    var punches = loadPunches();
    var now = new Date();
    var punch = {
        id: Date.now(),
        employeeId: employeeId,
        type: type,
        timestamp: now.toISOString(),
        rf: rf
    };
    punches.push(punch);
    
    try {
        savePunches(punches);
        var saved = loadPunches();
        if (saved.some(p => p.id === punch.id)) {
            console.log('%c[PUNCH] ✅ Ponto registrado', 'color: #27ae60;', punch);
            
            // Atualizar adiantamentos se for entrada
            if (type === 'Entrada') {
                console.log('[PUNCH] 🔄 Atualizando análise de dados...');
                
                // Atualizar card do dashboard
                if (typeof updateOverTimeCardWithAdvancements === 'function') {
                    updateOverTimeCardWithAdvancements();
                }
                
                // Atualizar tabela de análise de dados
                setTimeout(() => {
                    const today = new Date();
                    if (typeof refreshExtrasReportTable === 'function') {
                        console.log('[PUNCH] 📊 Recarregando tabela de extras...');
                        refreshExtrasReportTable(today);
                    }
                }, 150);
            }
        }
    } catch (e) {
        console.error('[PUNCH] ❌ Erro:', e);
        throw e;
    }
    
    renderPunches();
    setTimeout(() => savePunches(punches), 100);
}

function deletePunch(id) {
    if (!confirm('Confirma exclusão deste registro de ponto?')) return;
    var punches = loadPunches().filter(function(p){ return p.id !== id; });
    savePunches(punches);
    // Garantir persistência
    setTimeout(() => savePunches(punches), 100);
    renderPunches();
}

function formatDateTimeISO(iso) {
    try {
        var d = new Date(iso);
        return d.toLocaleString('pt-BR');
    } catch (e) {
        return iso;
    }
}

function renderPunches() {
    var tbody = document.getElementById('punch-list-body');
    if (!tbody) return;
    var punches = loadPunches();

    // show latest first
    punches = punches.slice().reverse();

    tbody.innerHTML = '';

    if (punches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#666;">Nenhum registro de ponto encontrado.</td></tr>';
        return;
    }

    punches.forEach(function(p){
        var empName = p.employeeId;
        if (typeof getEmployeeById === 'function') {
            var emp = getEmployeeById(p.employeeId);
            if (emp) empName = emp.matricula + ' - ' + emp.nome;
        }
        
        // Determinar status e cor
        let statusHtml = '';
        let statusColor = '#2ecc71';
        let statusText = '✓ Normal';
        
        if (p.type === 'Folga') {
            statusColor = '#3498db';
            statusText = '🌴 Folga';
        } else if (p.type === 'Falta') {
            statusColor = '#f39c12';
            statusText = '⚠️ Falta';
        } else if (p.type === 'Feriado') {
            statusColor = '#9b59b6';
            statusText = '🎉 Feriado';
        } else if (p.type === 'Entrada' || p.type === 'Saída') {
            statusColor = '#2ecc71';
            statusText = '✓ Normal';
        }
        
        statusHtml = '<span style="background: ' + statusColor + '; color: white; padding: 4px 8px; border-radius: 3px; font-size: 0.8em; font-weight: 600;">' + statusText + '</span>';
        
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="padding:8px;border:1px solid #e6e6e6;">' + empName + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + p.type + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;">' + statusHtml + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;">' + formatDateTimeISO(p.timestamp) + '</td>' +
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;"><button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deletePunch(' + p.id + ')">Excluir</button></td>';
        tbody.appendChild(tr);
    });
}

function initPunchModule() {
    // populate employee select if present
    var select = document.getElementById('punch-employee-select');
    if (select && typeof getEmployees === 'function') {
        var emps = getEmployees();
        if (emps && emps.length > 0) {
            select.innerHTML = emps.map(function(e){ return '<option value="' + e.id + '">' + e.matricula + ' - ' + e.nome + '</option>'; }).join('');
        } else {
            select.innerHTML = '<option value="0">Sem funcionários</option>';
        }
    }

    // Função auxiliar para registrar ponto
    function handlePunchClick(type, rf) {
        var selectEl = document.getElementById('punch-employee-select');
        var empId = parseInt(selectEl && selectEl.value, 10) || 0;
        
        if (!empId) {
            showToast('Selecione um funcionário antes de registrar o ponto.', 'warning');
            return;
        }

        try {
            registerPunch(empId, type, rf);
            showToast(type + ' registrada com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao registrar ponto:', err);
            showToast('Erro ao registrar ponto.', 'error');
        }
    }

    // Botão Entrada
    var btnEntrada = document.getElementById('punch-entrada-btn');
    if (btnEntrada && !btnEntrada.dataset.bound) {
        btnEntrada.dataset.bound = '1';
        btnEntrada.addEventListener('click', function(e){
            if (btnEntrada.disabled) return;
            btnEntrada.disabled = true;
            handlePunchClick('Entrada', 'RF -');
            setTimeout(function(){ btnEntrada.disabled = false; }, 600);
        });
    }

    // Botão RF 1 (almoço)
    var btnRf1 = document.getElementById('punch-rf1-btn');
    if (btnRf1 && !btnRf1.dataset.bound) {
        btnRf1.dataset.bound = '1';
        btnRf1.addEventListener('click', function(e){
            if (btnRf1.disabled) return;
            btnRf1.disabled = true;
            handlePunchClick('Saída', 'RF 1');
            setTimeout(function(){ btnRf1.disabled = false; }, 600);
        });
    }

    // Botão RF 2 (almoço)
    var btnRf2 = document.getElementById('punch-rf2-btn');
    if (btnRf2 && !btnRf2.dataset.bound) {
        btnRf2.dataset.bound = '1';
        btnRf2.addEventListener('click', function(e){
            if (btnRf2.disabled) return;
            btnRf2.disabled = true;
            handlePunchClick('Entrada', 'RF 2');
            setTimeout(function(){ btnRf2.disabled = false; }, 600);
        });
    }

    // Botão Saída
    var btnSaida = document.getElementById('punch-saida-btn');
    if (btnSaida && !btnSaida.dataset.bound) {
        btnSaida.dataset.bound = '1';
        btnSaida.addEventListener('click', function(e){
            if (btnSaida.disabled) return;
            btnSaida.disabled = true;
            handlePunchClick('Saída', 'RF -');
            setTimeout(function(){ btnSaida.disabled = false; }, 600);
        });
    }

    // Botão Folga
    var btnFolga = document.getElementById('punch-folga-btn');
    if (btnFolga && !btnFolga.dataset.bound) {
        btnFolga.dataset.bound = '1';
        btnFolga.addEventListener('click', function(e){
            if (btnFolga.disabled) return;
            btnFolga.disabled = true;
            handlePunchClick('Folga', 'folga');
            setTimeout(function(){ btnFolga.disabled = false; }, 600);
        });
    }

    // Botão Falta
    var btnFalta = document.getElementById('punch-falta-btn');
    if (btnFalta && !btnFalta.dataset.bound) {
        btnFalta.dataset.bound = '1';
        btnFalta.addEventListener('click', function(e){
            if (btnFalta.disabled) return;
            btnFalta.disabled = true;
            handlePunchClick('Falta', 'falta');
            setTimeout(function(){ btnFalta.disabled = false; }, 600);
        });
    }

    // Botão Feriado
    var btnFeriado = document.getElementById('punch-feriado-btn');
    if (btnFeriado && !btnFeriado.dataset.bound) {
        btnFeriado.dataset.bound = '1';
        btnFeriado.addEventListener('click', function(e){
            if (btnFeriado.disabled) return;
            btnFeriado.disabled = true;
            handlePunchClick('Feriado', 'feriado');
            setTimeout(function(){ btnFeriado.disabled = false; }, 600);
        });
    }

    renderPunches();
}
