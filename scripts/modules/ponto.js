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

        // 🔥 SYNC INSTANTÂNEO COM SUPABASE
        if (typeof window.supabaseSync !== 'undefined' && typeof window.supabaseSync.syncAllData === 'function') {
            window.supabaseSync.syncAllData().catch(e => console.error('Erro no sync:', e));
        }
        
        console.log('✅ Pontos salvos e sincronizados -', punches.length, 'registros');
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
    const now = new Date();
    const punchId = 'punch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const punch = {
        id: punchId,
        employeeId: employeeId,
        type: type,
        timestamp: now.toISOString(),
        rf: rf
    };

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando ponto para Supabase...');
        return window.supabaseRealtime.insert('punches', punch)
            .then(result => {
                console.log('%c[PUNCH] ✅ Ponto registrado via Supabase', 'color: #27ae60;', result);
                renderPunches(); // A UI será atualizada pelo listener, mas forçamos para feedback imediato
                return result;
            })
            .catch(err => {
                console.error('❌ Erro ao registrar ponto via Supabase:', err);
                showToast('Erro ao registrar ponto.', 'error');
                throw err;
            });
    } else {
        // Fallback
        console.warn('⚠️ Supabase não disponível. Usando localStorage.');
        const punches = loadPunches();
        punches.push(punch);
        savePunches(punches);
        renderPunches();
        return Promise.resolve(punch);
    }
}

function deletePunch(id) {
    if (!confirm('Confirma exclusão deste registro de ponto?')) return;

    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo ponto do Supabase...');
        window.supabaseRealtime.remove('punches', id)
            .then(() => {
                showToast('Registro excluído!', 'success');
                renderPunches();
            })
            .catch(err => {
                console.error('❌ Erro ao excluir ponto via Supabase:', err);
                showToast('Erro ao excluir registro.', 'error');
            });
    } else {
        // Fallback
        const idStr = String(id);
        const punches = loadPunches().filter(p => String(p.id) !== idStr);
        savePunches(punches);
        renderPunches();
    }
}

// NOVA FUNÇÃO: Atualizar registro de ponto
function updatePunch(id, newType, newTimestamp) {
    const punchData = { type: newType, timestamp: newTimestamp };

    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        console.log('☁️ Atualizando ponto no Supabase...');
        return window.supabaseRealtime.update('punches', id, punchData)
            .then(updatedPunch => {
                renderPunches();
                return updatedPunch;
            })
            .catch(err => {
                console.error('❌ Erro ao atualizar ponto via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback
        const punches = loadPunches();
        const idStr = String(id);
        const index = punches.findIndex(p => String(p.id) === idStr);

        if (index === -1) {
            return Promise.reject('Registro não encontrado');
        }

        punches[index] = { ...punches[index], ...punchData };
        savePunches(punches);
        renderPunches();
        return Promise.resolve(punches[index]);
    }
}

// NOVA FUNÇÃO: Abrir modal de edição de ponto
function openEditPunchModal(id) {
    var punches = loadPunches();
    var idStr = String(id);
    var punch = punches.find(function(p) { return String(p.id) === idStr; });
    
    if (!punch) {
        showToast('Registro não encontrado', 'error');
        return;
    }
    
    // Formatar data/hora para o input datetime-local
    var dt = new Date(punch.timestamp);
    var localDateTime = dt.getFullYear() + '-' + 
        String(dt.getMonth() + 1).padStart(2, '0') + '-' + 
        String(dt.getDate()).padStart(2, '0') + 'T' + 
        String(dt.getHours()).padStart(2, '0') + ':' + 
        String(dt.getMinutes()).padStart(2, '0');
    
    var modalHTML = `
        <div class="modal-overlay" onclick="this.remove()" id="modal-edit-punch">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Editar Registro de Ponto</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-edit-punch').remove()">×</button>
                </div>
                
                <div class="modal-section" style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Tipo:</label>
                        <select id="edit-punch-type" 
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="Entrada" ${punch.type === 'Entrada' ? 'selected' : ''}>Entrada</option>
                            <option value="Saída" ${punch.type === 'Saída' ? 'selected' : ''}>Saída</option>
                            <option value="Folga" ${punch.type === 'Folga' ? 'selected' : ''}>Folga</option>
                            <option value="Falta" ${punch.type === 'Falta' ? 'selected' : ''}>Falta</option>
                            <option value="Feriado" ${punch.type === 'Feriado' ? 'selected' : ''}>Feriado</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Data/Hora:</label>
                        <input type="datetime-local" id="edit-punch-datetime" value="${localDateTime}"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="document.getElementById('modal-edit-punch').remove()" 
                                style="padding: 10px 20px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 6px; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="saveEditPunch('${id}')" 
                                style="padding: 10px 20px; border: none; background: #3498db; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
function saveEditPunch(id) {
    var newType = document.getElementById('edit-punch-type').value;
    var newDatetime = document.getElementById('edit-punch-datetime').value;
    
    if (!newType || !newDatetime) {
        showToast('Preencha todos os campos', 'warning');
        return;
    }
    
    var newTimestamp = new Date(newDatetime).toISOString();
    
    updatePunch(id, newType, newTimestamp)
        .then(updated => {
            if (updated) {
                showToast('Registro atualizado!', 'success');
                const modal = document.getElementById('modal-edit-punch');
                if (modal) modal.remove();
            }
        })
        .catch(() => {
            showToast('Erro ao atualizar registro', 'error');
        });
}       document.getElementById('modal-edit-punch').remove();
    } else {
        showToast('Erro ao atualizar registro', 'error');
    }
}

// Expor funções globalmente
window.updatePunch = updatePunch;
window.openEditPunchModal = openEditPunchModal;
window.saveEditPunch = saveEditPunch;

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
                       '<td style="padding:8px;border:1px solid #e6e6e6;text-align:center;">' +
                       '<button style="background:#f39c12;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;margin-right:4px;" onclick="openEditPunchModal(\'' + p.id + '\')">Editar</button>' +
                       '<button style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" onclick="deletePunch(\'' + p.id + '\')">Excluir</button></td>';
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
    function handlePunchClick(type, rf) {
        var selectEl = document.getElementById('punch-employee-select');
        var empId = selectEl?.value;
        
        if (!empId) {
            showToast('Selecione um funcionário antes de registrar o ponto.', 'warning');
            return;
        }

        registerPunch(empId, type, rf)
            .then(() => {
                showToast(type + ' registrada com sucesso!', 'success');
            })
            .catch(err => {
                console.error('Erro ao registrar ponto:', err);
                showToast('Erro ao registrar ponto.', 'error');
            });
    }       console.error('Erro ao registrar ponto:', err);
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
