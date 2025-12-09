# 🚀 Guia Rápido: Atrasos e Horas Extras Diários

## ⚡ Começar Rapidinho

### 1️⃣ Abra o Dashboard
- Clique em **Dashboard** na sidebar
- Role a página para baixo (após os cards de métrica)

### 2️⃣ Procure a Seção
- Título: **"Atrasos e Horas Extras"**
- Descrição: "Análise diária de atrasos e horas extras"

### 3️⃣ Selecione uma Data
- Use o input de data (calendário)
- Por padrão mostra hoje

### 4️⃣ Clique em "Gerar"
- Botão azul com ícone 🔄
- A tabela vai atualizar com os dados

## 📋 O que Você Vê

### Tabela Amarela 🟡
- **Título**: ⏰ Atrasos
- **Quem aparece**: Funcionários que trabalharam MENOS que o esperado
- **Exemplo**: João trabalhou 7h mas deveria trabalhar 8h → Atraso de 1h

### Tabela Verde 🟢
- **Título**: ⭐ Horas Extras
- **Quem aparece**: Funcionários que trabalharam MAIS que o esperado
- **Exemplo**: Maria trabalhou 9h mas deveria trabalhar 8h → Extra de 1h

### Totalizadores
- Cada tabela tem um linha de **TOTAL** em destaque
- Mostra quantas horas de atraso/extra no total do dia

## 💡 Dicas Úteis

### Para Testar com Dados de Demo
1. Abra o Console (F12)
2. Execute: `window.createDemoData()`
3. Recarregue a página (F5)
4. Volte ao Dashboard

### Para Ver Dados no Console
```javascript
// Ver dados de hoje
generateDailyDelayReport(new Date())

// Ver dados de uma data
generateDailyDelayReport(new Date('2025-11-19'))
```

### Para Atualizar Manualmente
```javascript
renderDailyDelayReport(new Date())
```

## 📊 Exemplo Real

**Data: 19 de Novembro de 2025**

**🔴 Atrasos (2 funcionários)**
```
João Silva    (Dev)      - Trabalhou 7h, esperado 8h   → -1h
Pedro Costa   (QA)       - Trabalhou 7.5h, esperado 8h → -0.5h
TOTAL                                                     -1.5h
```

**🟢 Horas Extras (2 funcionários)**
```
Maria Santos  (Analista) - Trabalhou 9h, esperado 8h   → +1h
Ana Silva     (PM)       - Trabalhou 9.5h, esperado 8h → +1.5h
TOTAL                                                     +2.5h
```

## ❌ Se Nada Aparecer

### Problema: "Nenhum ponto registrado"
**Solução**: 
- Tem funcionários cadastrados?
- Tem pontos registrados para essa data?
- Tente gerar dados de demo: `window.createDemoData()`

### Problema: Tabela em branco
**Solução**:
- Abra o Console (F12)
- Procure por mensagens de erro (vermelho)
- Se tiver erro, anote e comunique

### Problema: Botão não funciona
**Solução**:
- Recarregue a página (F5)
- Verifique se tem dados cadastrados
- Tente no console: `renderDailyDelayReport(new Date())`

## 🔧 Configurações Avançadas

### Adicionar em Outro Container
No console:
```javascript
renderDailyDelayReport(new Date(), 'seu-container-id')
```

### Renderizar com Data Customizada
```javascript
const minhaData = new Date('2025-11-15');
renderDailyDelayReport(minhaData);
```

### Ver Dados Estruturados
```javascript
const dados = generateDailyDelayReport();
console.table(dados);
```

## 📞 Suporte

Se tiver problema:
1. Abra o Console (F12)
2. Execute: `window.debugTopService()`
3. Procure por mensagens de erro
4. Copie as mensagens de erro e comunique

---

**Última atualização**: 19 de Novembro de 2025
**Versão**: 1.0.0
**Status**: ✅ Pronto para uso
