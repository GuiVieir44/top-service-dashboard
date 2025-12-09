// ==========================================
// PERSISTÊNCIA CENTRAL - DESABILITADO
// Este arquivo foi desabilitado em favor da sincronização em tempo real com o Supabase.
// A lógica de salvamento em localStorage foi substituída por chamadas diretas
// à API do Supabase (window.supabaseRealtime) nos respectivos módulos.
// Manter este arquivo vazio previne a execução de código legado que poderia
// causar conflitos de dados.
// ==========================================

console.warn('Legacy persistence.js loaded but is disabled. All data persistence is now handled by Supabase modules.');

(function(){
    // Todas as funções de persistência foram desabilitadas.
    window.safeSaveAll = () => console.warn('safeSaveAll() is deprecated.');
    window.getStorageUsage = () => ({ used: 0, limit: 0, percent: 0 });
    window.scheduleDebouncedsave = () => console.warn('scheduleDebouncedsave() is deprecated.');
    window.startAutoSave = () => console.warn('startAutoSave() is deprecated.');
    window.stopAutoSave = () => {};
    window.getSaveStats = () => ({});

    // Remover event listeners para evitar chamadas desnecessárias
    window.removeEventListener('beforeunload', window.safeSaveAll);
    document.removeEventListener('visibilitychange', window.safeSaveAll);
    window.removeEventListener('dataChanged', window.scheduleDebouncedsave);
})();
