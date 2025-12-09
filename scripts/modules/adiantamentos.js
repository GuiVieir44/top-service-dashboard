// ==========================================
// MÓDULO DE ADIANTAMENTOS - TOP SERVICE
// ==========================================

console.log('⏰ Módulo de adiantamentos carregado');

/**
 * Calcula adiantamentos do dia atual
 * @returns {number} Total de horas adiantadas
 */
function calculateTodayAdvancements() {
    try {
        const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        
        // Obter hoje
        const today = new Date().toISOString().split('T')[0];
        console.log('[ADIANTAMENTO] 📅 Calculando para:', today);
        
        // Pegar PRIMEIRA entrada de hoje
        const todayPunches = punches
            .filter(p => p.timestamp.split('T')[0] === today && p.type === 'Entrada')
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log('[ADIANTAMENTO] 📊 Entradas de hoje:', todayPunches.length);
        
        let totalAdiantamento = 0;
        
        // Para cada entrada de hoje
        todayPunches.forEach(punch => {
            const emp = employees.find(e => e.id == punch.employeeId);
            if (!emp) {
                console.warn('[ADIANTAMENTO] ⚠️ Funcionário não encontrado:', punch.employeeId);
                return;
            }
            
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
                const diffMinutos = Math.round(diffMs / (60 * 1000));
                
                totalAdiantamento += diffHoras;
                
                console.log(`[ADIANTAMENTO] ✅ ${emp.nome}: +${diffMinutos} min (${diffHoras.toFixed(2)}h)`);
                console.log(`[ADIANTAMENTO]    Entrada: ${String(horaEntrada).padStart(2, '0')}:${String(minEntrada).padStart(2, '0')} vs ${horaInicioStr}`);
            }
        });
        
        console.log('[ADIANTAMENTO] 📊 TOTAL DO DIA:', totalAdiantamento.toFixed(2), 'horas');
        return totalAdiantamento;
        
    } catch (e) {
        console.error('[ADIANTAMENTO] ❌ Erro ao calcular:', e);
        console.error('[ADIANTAMENTO] Stack:', e.stack);
        return 0;
    }
}

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
 * Atualiza o card de horas extras com adiantamentos
 */
function updateOverTimeCardWithAdvancements() {
    try {
        const adiantamento = calculateTodayAdvancements();
        const extraCard = document.getElementById('horas-extras-mes');
        
        if (!extraCard) {
            console.warn('[ADIANTAMENTO] ⚠️ Card horas-extras-mes não encontrado');
            return;
        }
        
        const currentValue = parseFloat(extraCard.textContent) || 0;
        const newValue = currentValue + adiantamento;
        
        extraCard.textContent = formatarTempoGlobal(newValue);
        console.log('[ADIANTAMENTO] ✅ Card atualizado de', currentValue.toFixed(2), 'para', newValue.toFixed(2), 'h');
        
    } catch (e) {
        console.error('[ADIANTAMENTO] ❌ Erro ao atualizar card:', e);
    }
}

/**
 * Recalcular adiantamentos e atualizar dashboard
 */
function refreshAdvancements() {
    console.log('[ADIANTAMENTO] 🔄 Recalculando adiantamentos...');
    updateOverTimeCardWithAdvancements();
}

console.log('✅ Funções de adiantamento prontas');
