# 🚀 Guia Rápido - Relatório de Banco de Horas

## 📋 Resumo do Que Foi Implementado

O sistema agora consegue:
1. ✅ **Pegar o banco de horas registrado em cada cargo**
2. ✅ **Linkar com os pontos (entrada/saída) de cada funcionário**
3. ✅ **Calcular automaticamente horas extras e atrasos**
4. ✅ **Gerar relatório mensal completo** com saldo de banco de horas

---

## ⚡ Começar em 30 Segundos

### 1️⃣ Abra o navegador console (F12)

### 2️⃣ Crie dados de teste
```javascript
window.createDemoData()
```

### 3️⃣ Vá para "Relatórios" na sidebar

### 4️⃣ Visualize o relatório mensal!

---

## 📊 O Que Mostra no Relatório

Para cada funcionário, você vê:

| Campo | O que significa |
|-------|-----------------|
| **Dias** | Quantos dias com pontos registrados |
| **Trabalhado** | Total de horas que trabalhou no mês |
| **Esperado** | Total que deveria trabalhar |
| **Extras** | Horas que excedeu o esperado |
| **Atrasos** | Horas que faltaram |
| **Banco Anterior** | Saldo que tinha no começo do mês |
| **Novo Banco** | Saldo atualizado (anterior + extras - atrasos) |

---

## 🔍 Exemplo Prático

Suponha João que trabalha como **Desenvolvedor** (8 horas/dia):

```
Pontos registrados:
- Segunda: 08:00 → 17:00 = 9 horas (1 hora extra)
- Terça: 08:30 → 17:00 = 8,5 horas (30 min extra)
- Quarta: 08:00 → 16:00 = 8 horas (normal)
- Quinta: 08:00 → 17:30 = 9,5 horas (1,5 hora extra)
- Sexta: 09:00 → 17:00 = 8 horas (normal)

No relatório aparecerá:
✅ Trabalhado: 43 horas
✅ Esperado: 40 horas
✅ Extras: +3 horas
✅ Se banco anterior era +5h → Novo banco: +8h
```

---

## 📍 Arquivos Criados/Modificados

### ✨ **Novos Arquivos:**

1. **`scripts/relatorio-ponto.js`** (256 linhas)
   - Funções de cálculo de banco de horas
   - Integra pontos com cargos
   - Gera relatórios mensais

2. **`scripts/demo-data.js`** (194 linhas)
   - Cria dados de teste automático
   - Inclui funcionários, cargos e pontos

3. **`scripts/test-relatorio.js`** (332 linhas)
   - Testes e validação
   - Debugging e benchmarks

### 🔄 **Modificados:**

1. **`scripts/relatorios.js`**
   - Adicionadas funções para renderizar novo relatório
   - Integração com exportação CSV

2. **`scripts/navigation.js`**
   - Adicionada inicialização de `initMonthlyBalanceReportModule`

3. **`index.html`**
   - Novo seção na página de Relatórios
   - Adicionados novos scripts
   - Adicionados controles de mês e botões

---

## 🎯 Fluxo Técnico

```
Funcionário + Cargo + Pontos
      ↓
relatorio-ponto.js calcula:
  • Agrupa pontos em pares (entrada/saída)
  • Calcula horas por dia
  • Compara com cargo (horasDia)
  • Gera balanço (extras/atrasos)
      ↓
Resultado exibido em tabela
      ↓
Pode exportar para CSV
```

---

## 🧪 Testar Tudo

### Verificar integração completa:
```javascript
window.testSystemIntegration()
```

### Testar pipeline de cálculo:
```javascript
window.testCalculationPipeline()
```

### Executar suite completa:
```javascript
window.runAllTests()
```

---

## 💾 Dados Persistem em

- `localStorage['topservice_punches_v1']` - Pontos
- `localStorage['topservice_employees_v1']` - Funcionários
- `localStorage['topservice_cargos_v1']` - Cargos com banco de horas

---

## 📱 Como Registrar Pontos Manualmente

Se não quer usar dados demo:

1. Vá para **"Registrar Ponto"**
2. Selecione funcionário
3. Clique na sequência:
   - **Entrada** (8:00)
   - **RF 1** (12:00 - saída almoço)
   - **RF 2** (13:00 - volta almoço)
   - **Saída** (17:00)

O sistema calcula automaticamente: 8h + 0h = 8h (padrão)

---

## ❓ FAQ

**P: Cadê as horas extras no Dashboard?**
R: Estão no card "Horas Extras" e "Atrasos Totais" no Dashboard principal.

**P: Como o sistema sabe se fez hora extra?**
R: Compara as horas trabalhadas (de entrada/saída) com as horas do cargo.

**P: E se houver feriado?**
R: Por enquanto não filtra. Deve ser feito manualmente ou será adicionado em próximas versões.

**P: Pode editar o banco de horas?**
R: Sim, via "Cargos" → clique em "Editar".

**P: Onde exporta para CSV?**
R: Botão "📥 Exportar CSV" na seção de Relatório Mensal.

---

## 🎓 Documentação Completa

Para documentação técnica detalhada:
📄 **RELATORIO_BANCO_HORAS_README.md**

---

## ✅ Checklist de Uso

- [ ] Criar dados demo: `window.createDemoData()`
- [ ] Verificar se aparece na página "Relatórios"
- [ ] Clicar em "Gerar" para atualizar
- [ ] Exportar CSV para verificar
- [ ] Fazer testes: `window.runAllTests()`
- [ ] Registrar pontos manualmente se quiser
- [ ] Verificar Dashboard se mostra métricas

---

**🎉 Sistema pronto para usar!**

Qualquer dúvida, abra o console (F12) e rode os testes.
