// ==========================================
// ARQUIVO DE DEBUG - RASTREIA PROBLEMAS
// ==========================================

console.log('🐛 DEBUG.JS CARREGADO');

// Rastrear todos os erros não capturados
window.addEventListener('error', (event) => {
    console.error('❌ ERRO NÃO CAPTURADO:', event.error);
    console.error('📍 Stack:', event.error?.stack);
});

// Rastrear promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ PROMISE REJEITADA:', event.reason);
});

// Interceptar localStorage para ver se há problemas
const originalSetItem = localStorage.setItem;
const originalGetItem = localStorage.getItem;

// Não vamos interceptar localStorage, é muito ruído

// Rastrear quando DOMContentLoaded é disparado
let domContentLoaded = false;
document.addEventListener('DOMContentLoaded', () => {
    domContentLoaded = true;
    console.log('✅ DOMContentLoaded disparado');
});

// Verificar se a página já foi carregada
if (document.readyState === 'loading') {
    console.log('📄 Página ainda está carregando...');
} else {
    console.log('✅ Página já foi carregada');
}

// Rastrear quando window.navigationSystem é criado
Object.defineProperty(window, 'navigationSystem', {
    set: function(value) {
        console.log('🎯 window.navigationSystem foi definido:', value);
        this._navigationSystem = value;
    },
    get: function() {
        return this._navigationSystem;
    }
});

console.log('🐛 DEBUG.JS PRONTO - Rastreamento ativo');
