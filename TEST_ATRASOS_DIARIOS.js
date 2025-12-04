// ==========================================
// TESTE: RELATÓRIO DE ATRASOS E HORAS EXTRAS DIÁRIOS
// ==========================================
// Execute no console do navegador para testar

console.log('%c🧪 TESTE: Relatório de Atrasos e Horas Extras Diários', 'color: #3498db; font-size: 16px; font-weight: bold;');

// PASSO 1: Verificar se as funções existem
console.log('%c✓ Verificando funções...', 'color: #2ecc71; font-weight: bold;');
console.log('generateDailyDelayReport:', typeof generateDailyDelayReport === 'function' ? '✅ Existe' : '❌ Falta');
console.log('renderDailyDelayReport:', typeof renderDailyDelayReport === 'function' ? '✅ Existe' : '❌ Falta');

// PASSO 2: Criar dados de teste
console.log('%c✓ Criando dados de teste...', 'color: #2ecc71; font-weight: bold;');
window.createDemoData();
console.log('✅ Demo data criada!');

// PASSO 3: Gerar relatório de hoje
console.log('%c✓ Gerando relatório de hoje...', 'color: #2ecc71; font-weight: bold;');
const hoje = new Date();
const relatorioHoje = generateDailyDelayReport(hoje);
console.log(`Registros encontrados: ${relatorioHoje.length}`);
console.table(relatorioHoje);

// PASSO 4: Agrupar por tipo
console.log('%c✓ Resumo por tipo...', 'color: #2ecc71; font-weight: bold;');
const atrasos = relatorioHoje.filter(r => r.tipo === 'atraso');
const extras = relatorioHoje.filter(r => r.tipo === 'extra');
const normais = relatorioHoje.filter(r => r.tipo === 'normal');

console.log('📊 RESUMO:');
console.log(`   🔴 Atrasos: ${atrasos.length} funcionários`);
console.log(`   🟢 Extras: ${extras.length} funcionários`);
console.log(`   ⚪ Normais: ${normais.length} funcionários`);

// PASSO 5: Renderizar no dashboard
console.log('%c✓ Renderizando no dashboard...', 'color: #2ecc71; font-weight: bold;');
const container = document.getElementById('daily-delay-table');
if (container) {
    renderDailyDelayReport(hoje);
    console.log('✅ Renderizado com sucesso!');
    console.log('📍 Localização: ID "daily-delay-table"');
} else {
    console.log('❌ Container "daily-delay-table" não encontrado');
}

// PASSO 6: Testar com outras datas
console.log('%c✓ Testando com outras datas...', 'color: #2ecc71; font-weight: bold;');
for (let i = 0; i < 5; i++) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const rel = generateDailyDelayReport(data);
    console.log(`${data.toLocaleDateString('pt-BR')}: ${rel.length} registros`);
}

console.log('%c✅ TESTE COMPLETO!', 'color: #27ae60; font-size: 14px; font-weight: bold;');
console.log('%cPróximos passos:', 'color: #f39c12; font-weight: bold;');
console.log('1. Abra o Dashboard (primeira página)');
console.log('2. Procure a seção "Atrasos e Horas Extras"');
console.log('3. Selecione uma data no input');
console.log('4. Clique no botão "🔄 Gerar"');
console.log('5. Veja as tabelas com atrasos (amarelo) e extras (verde)');
