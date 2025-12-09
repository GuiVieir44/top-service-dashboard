// ==========================================
// MÓDULO DE AUSÊNCIAS - TOP SERVICE
// ==========================================
// Gerencia faltas e feriados dos funcionários

console.log('📋 Arquivo ausencias.js carregado!');

/**
 * Salva ausência (falta ou feriado)
 */
function saveAbsence(employeeId, date, type) {
    const newAbsence = {
        id: 'aus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        employeeId: Number(employeeId),
        date: date,
        type: type // 'falta' ou 'feriado'
    };

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        console.log('☁️ Enviando ausência para Supabase...');
        return window.supabaseRealtime.insert('ausencias', newAbsence)
            .catch(err => {
                console.error('❌ Erro ao salvar ausência via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback foi removido pois a aplicação agora depende do Supabase.
        console.error('Supabase não está disponível. Não foi possível salvar a ausência.');
        return Promise.reject('Supabase not available');
    }
}

/**
 * Remove ausência
 */
function removeAbsence(employeeId, date) {
    const absences = (window.supabaseRealtime && window.supabaseRealtime.data.ausencias) || [];
    const absenceToRemove = absences.find(a => a.employeeId == employeeId && a.date === date);

    if (!absenceToRemove) {
        console.warn(`Ausência não encontrada para remoção: func ${employeeId} em ${date}`);
        return Promise.resolve();
    }

    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        console.log('🗑️ Removendo ausência do Supabase...');
        return window.supabaseRealtime.remove('ausencias', absenceToRemove.id)
            .catch(err => {
                console.error('❌ Erro ao remover ausência via Supabase:', err);
                throw err;
            });
    } else {
        // Fallback foi removido.
        console.error('Supabase não está disponível. Não foi possível remover a ausência.');
        return Promise.reject('Supabase not available');
    }
}

/**
 * Obtém ausência de um dia específico
 */
function getAbsenceForDay(employeeId, date) {
    const absences = (window.supabaseRealtime && window.supabaseRealtime.data.ausencias) || [];
    return absences.find(a => a.employeeId == employeeId && a.date === date);
}

/**
 * Obtém todas as ausências de um funcionário
 */
function getAbsencesByEmployee(employeeId, startDate = null, endDate = null) {
    const absences = (window.supabaseRealtime && window.supabaseRealtime.data.ausencias) || [];
    let filtered = absences.filter(a => a.employeeId == employeeId);
    
    if (startDate && endDate) {
        filtered = filtered.filter(a => a.date >= startDate && a.date <= endDate);
    }
    
    return filtered;
}

/**
 * Conta faltas em um período
 */
function countAbsencesByType(employeeId, type, startDate, endDate) {
    const absences = getAbsencesByEmployee(employeeId, startDate, endDate);
    return absences.filter(a => a.type === type).length;
}

/**
 * Marca ausência rapidamente (falta, feriado ou folga) sem abrir modal
 */
function markAbsenceQuick(employeeId, date, type, currentAbsenceType = '') {
    const actionPromise = currentAbsenceType === type
        ? removeAbsence(employeeId, date)
        : saveAbsence(employeeId, date, type);

    const typeLabel = type === 'falta' ? 'Falta' : type === 'feriado' ? 'Feriado' : 'Folga';
    const actionLabel = currentAbsenceType === type ? 'removida' : 'marcada';

    actionPromise
        .then(() => {
            showToast(`${typeLabel} ${actionLabel} com sucesso!`, 'success');
            if (typeof refreshPunchTable === 'function') {
                refreshPunchTable();
            }
        })
        .catch(err => {
            console.error(`Erro ao marcar/remover ausência rápida:`, err);
            showToast(`Erro ao ${currentAbsenceType === type ? 'remover' : 'marcar'} ${typeLabel}.`, 'error');
        });
}

/**
 * Abre modal para marcar falta/feriado
 */
function openMarkAbsenceModal(employeeId, dateStr, currentAbsence = null) {
    const modalId = 'mark-absence-modal-' + Date.now();
    
    const dateParts = dateStr.split('-');
    const displayDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('pt-BR');
    
    // Buscar nome do funcionário
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    const emp = employees.find(e => e.id == employeeId);
    const empName = emp ? emp.nome : `Funcionário ${employeeId}`;
    
    let html = `
        <div id="${modalId}" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); padding: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 1.2em; font-weight: 600;">Marcar Ausência</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 0.95em;">
                    <strong>${empName}</strong><br>
                    <span style="color: #999;">${displayDate}</span>
                </p>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <button type="button" class="btn-falta" style="flex: 1; padding: 15px; background: #f39c12; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">
                        ⚠️ Falta
                    </button>
                    <button type="button" class="btn-feriado" style="flex: 1; padding: 15px; background: #9b59b6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">
                        🎉 Feriado
                    </button>
                </div>
                
                ${currentAbsence ? `
                    <button type="button" class="btn-remove" style="width: 100%; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 10px; transition: all 0.3s;">
                        🗑️ Remover ${currentAbsence.type === 'falta' ? 'Falta' : 'Feriado'}
                    </button>
                ` : ''}
                
                <button type="button" class="btn-cancel" style="width: 100%; padding: 10px; background: #ecf0f1; color: #333; border: 1px solid #bdc3c7; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    const modal = modalDiv.firstElementChild;
    // Event listeners
    modal.querySelector('.btn-falta').addEventListener('click', () => {
        saveAbsence(employeeId, dateStr, 'falta')
            .then(() => {
                modal.remove();
                showToast('Falta marcada com sucesso!', 'success');
                if (typeof refreshPunchTable === 'function') refreshPunchTable();
            })
            .catch(() => showToast('Erro ao marcar falta.', 'error'));
    });
    
    modal.querySelector('.btn-feriado').addEventListener('click', () => {
        saveAbsence(employeeId, dateStr, 'feriado')
            .then(() => {
                modal.remove();
                showToast('Feriado marcado com sucesso!', 'success');
                if (typeof refreshPunchTable === 'function') refreshPunchTable();
            })
            .catch(() => showToast('Erro ao marcar feriado.', 'error'));
    });
    
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    if (currentAbsence) {
        modal.querySelector('.btn-remove').addEventListener('click', () => {
            removeAbsence(employeeId, dateStr)
                .then(() => {
                    modal.remove();
                    const typeLabel = currentAbsence.type === 'falta' ? 'Falta' : 'Feriado';
                    showToast(`${typeLabel} removida com sucesso!`, 'success');
                    if (typeof refreshPunchTable === 'function') refreshPunchTable();
                })
                .catch(() => showToast('Erro ao remover ausência.', 'error'));
        });
    }       refreshPunchTable();
        });
    }
    
    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

console.log('✅ Módulo de ausências carregado');
