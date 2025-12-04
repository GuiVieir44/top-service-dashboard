# 📊 Relatório de Banco de Horas - Documentação

## Visão Geral

O sistema agora integra de forma completa:
- **Cargos com banco de horas**: Cada cargo tem horas por dia e banco de horas configurável
- **Pontos de entrada/saída**: Rastreamento completo com suporte a pausas (almoço)
- **Cálculo automático de horas**: Compara horas trabalhadas com o esperado do cargo
- **Relatório mensal detalhado**: Mostra atrasos, horas extras e saldo de banco de horas por funcionário

---

## 🔧 Como Funciona

### 1. **Estrutura de Dados**

#### Cargos (cargos.js)
```javascript
{
    id: 1,
    nome: "Desenvolvedor",
    horasDia: 8,           // Horas esperadas por dia
    bancoHoras: 5          // Saldo atual (pode ser negativo)
}
```

#### Funcionários (data.js)
```javascript
{
    id: 1,
    nome: "João Silva",
    cargo: "Desenvolvedor",      // Nome do cargo
    departamento: "TI",
    // ... outros campos
}
```

#### Pontos (ponto.js)
```javascript
{
    id: 123456789,
    employeeId: 1,
    type: "Entrada" | "Saída",   // Tipo do ponto
    timestamp: "2024-11-19T08:15:00.000Z",
    rf: "RF -" | "RF 1" | "RF 2"  // RF - (entrada/saída), RF 1 (almoço saída), RF 2 (almoço entrada)
}
```

### 2. **Fluxo de Cálculo**

```
Funcionário + Cargo + Pontos do Mês
        ↓
Agrupar pontos em pares (Entrada/Saída)
        ↓
Calcular horas trabalhadas por dia
        ↓
Comparar com horas esperadas do cargo
        ↓
Gerar balanço (extras/atrasos/saldo)
```

### 3. **Funções Principais**

#### Em `relatorio-ponto.js`:

**`getPunchesForEmployee(employeeId, startDate, endDate)`**
- Obtém pontos de um funcionário em um período
- Retorna array ordenado cronologicamente

**`groupPunchesIntoPairs(punches)`**
- Agrupa punches em pares Entrada/Saída
- Calcula horas trabalhadas por dia
- Retorna array com pares e horas

**`calculateDailyBalance(employeeId, date)`**
- Calcula balanço de um dia específico
- Retorna: horas trabalhadas, esperadas, diferença, tipo (extra/atraso/normal)

**`calculateMonthlyBalance(employeeId, month)`**
- Calcula balanço completo do mês
- Inclui: dias trabalhados, totais de extras/atrasos, novo saldo de banco
- Retorna: todos os detalhes + balanços diários

**`generateMonthlyReport(month)`**
- Gera relatório de TODOS os funcionários do mês
- Retorna array com balanços mensais

**`renderMonthlyReport(month, containerId)`**
- Renderiza relatório em HTML formatado
- Inclui tabela com totalizadores

---

## 📱 Como Usar

### **Passo 1: Gerar Dados de Demo** (Opcional)

Se não tem dados ainda, use:

```javascript
// No console do navegador:
window.createDemoData()
```

Ou clique no botão "📊 Gerar Dados Demo" (canto inferior direito)

### **Passo 2: Registrar Pontos**

Na página "Registrar Ponto":
1. Selecione o funcionário
2. Clique em "Entrada" (primeira vez)
3. Clique em "RF 1" (saída para almoço)
4. Clique em "RF 2" (volta do almoço)
5. Clique em "Saída" (final do dia)

**Exemplo:**
```
08:00 - Entrada
12:00 - RF 1 (Saída almoço)
13:00 - RF 2 (Volta almoço)
17:00 - Saída
```
Total: 9 horas (1 hora extra se cargo é 8h/dia)

### **Passo 3: Visualizar Relatório**

Na página "Relatórios":
1. Vá para a seção "📊 Relatório Mensal - Banco de Horas"
2. Selecione o mês (padrão: mês atual)
3. Clique em "Gerar" para atualizar
4. Clique em "📥 Exportar CSV" para baixar

---

## 📊 Entendendo o Relatório

### Colunas da Tabela:

| Coluna | Significado |
|--------|------------|
| **Matrícula** | ID do funcionário |
| **Nome** | Nome completo |
| **Cargo** | Posição na empresa |
| **Dias** | Dias com pontos registrados |
| **Trabalhado** | Total de horas trabalhadas no mês |
| **Esperado** | Total de horas que deveria trabalhar |
| **Extras** | Horas trabalhadas além do esperado |
| **Atrasos** | Horas faltantes em relação ao esperado |
| **Banco Anterior** | Saldo de banco antes do mês |
| **Novo Banco** | Saldo atualizado (anterior + extras - atrasos) |

### Exemplo de Interpretação:

```
João Silva | 20 dias | 160h | 160h | +8h | 0h | +5h | +13h

Interpretação:
✅ Trabalhou 160 horas (o esperado)
✅ Fez 8 horas extras
✅ Novo banco de horas: +13h (5h anterior + 8h do mês)
```

---

## 🔧 Configurando Cargos

### **Opção 1: Via Interface**

1. Vá para "Cargos" (em Configurações ou no menu)
2. Clique em "Adicionar Novo"
3. Preencha: Nome, Horas/Dia
4. Sistema pede banco de horas inicial

### **Opção 2: Via Console** (Programático)

```javascript
// Adicionar novo cargo
addCargo("Consultor", 10); // 10 horas por dia

// Obter cargo
const cargo = getCargoByName("Consultor");
console.log(cargo);
// {id: 5, nome: "Consultor", horasDia: 10, bancoHoras: 0}
```

---

## 📈 Integrando com Dashboard

As métricas do dashboard são atualizadas automaticamente:

- **Horas Extras do Mês**: Soma de todas as horas extras de todos os funcionários
- **Atrasos do Mês**: Soma de todos os atrasos

Essas métricas vêm de:
```javascript
// Em charts.js - calculado pelos gráficos
let lastOvertimeTotal = 0;    // Horas extras totais
let lastDelayTotal = 0;       // Atrasos totais

// Em navigation.js - exibido no dashboard
document.getElementById('horas-extras-mes').textContent = lastOvertimeTotal + 'h';
document.getElementById('atrasos-mes').textContent = lastDelayTotal + 'h';
```

---

## 🐛 Debugging

### Testar Cálculos Manualmente:

```javascript
// No console:
window.debugRelatorios()

// Isso mostra:
// - Balanço mensal de cada funcionário
// - Balanço de hoje para cada funcionário
// - Relatório geral
```

### Verificar Pontos de um Funcionário:

```javascript
// Obter todos os pontos do funcionário ID 1
const punches = window.getPunchesForEmployee(1);
console.log(punches);

// Agrupar em pares
const pairs = window.groupPunchesIntoPairs(punches);
console.log(pairs);
```

### Ver Balanço de um Dia:

```javascript
// Balanço do funcionário 1 em 19/11/2024
const balance = window.calculateDailyBalance(1, new Date(2024, 10, 19));
console.log(balance);
// {
//   horasTrabalhadas: 9,
//   horasEsperadas: 8,
//   diferenca: 1,
//   tipo: "extra"
// }
```

---

## 📝 Notas Técnicas

### **Cálculo de Horas Trabalhadas:**
- Agrupa ponches em pares Entrada/Saída
- Ignora pausas (RF 1/RF 2 são apenas marcações)
- Usa timestamps ISO para precisão

### **Dias Considerados:**
- Apenas dias úteis (segunda a sexta)
- Apenas dias com movimento de ponto
- Comparados com a configuração do cargo

### **Banco de Horas:**
- Armazenado por cargo (global)
- Calculado como: `banco anterior + extras - atrasos`
- Persiste em localStorage

### **Performance:**
- Cálculos são executados sob demanda
- Gráficos armazenam totais em variáveis globais
- Relatório gera todos os dados ao visualizar

---

## 🚀 Próximas Melhorias

- [ ] Exportar relatório em PDF
- [ ] Filtro por departamento no relatório
- [ ] Histórico de banco de horas
- [ ] Alertas automáticos para atrasos
- [ ] Integração com sistema de aprovações
- [ ] Visualização por período customizado

---

## 📞 Suporte

Qualquer problema, verifique:

1. Console do navegador (F12 → Abas "Console" e "Aplicativo")
2. localStorage contém dados: `topservice_punches_v1`, `topservice_employees_v1`, `topservice_cargos_v1`
3. Execute `window.debugRelatorios()` para diagnóstico

---

**Versão:** 1.0.0  
**Última Atualização:** 19 de Novembro de 2024
