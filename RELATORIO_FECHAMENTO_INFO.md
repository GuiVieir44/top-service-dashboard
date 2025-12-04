# 📋 INFORMAÇÕES PARA RELATÓRIO DE FECHAMENTO

## Data de Criação
27 de Novembro de 2025

## 🎯 OBJETIVO
Criar relatório de fechamento mensal/período com dados completos de cada funcionário incluindo:
- Horas trabalhadas
- Adiantamentos
- Atrasos
- Extras
- Valores de benefícios

---

## 📊 DADOS DE FUNCIONÁRIO DISPONÍVEIS

Cada funcionário tem os seguintes dados armazenados em `topservice_employees_v1`:

```javascript
{
  id: number,
  matricula: string,           // Matrícula única
  nome: string,                // Nome completo
  cargo: string,               // Cargo do funcionário
  departamento: string,        // Departamento
  cpf: string,                 // CPF formatado
  email: string,               // Email
  admissao: string,            // Data de admissão (YYYY-MM-DD)
  telefone: string,            // Telefone formatado
  endereco: string,            // Endereço
  status: string,              // Ativo, Desligado, Férias, Afastado
  
  // NOVOS CAMPOS PARA FECHAMENTO
  adicional: string,           // "Adicional Noturno", "Insalubridade 20%", "Insalubridade 40%", ""
  valeAlimentacao: number,     // Valor diário em R$ (ex: 25.50)
  valeTransporte: string,      // "Optante", "Não Optante", ""
  horaInicio: string           // Hora de início (HH:MM) - importante para cálculo de adiantamentos
}
```

---

## ⏱️ DADOS DE PONTO DISPONÍVEIS

Armazenados em `topservice_punches_v1`:

```javascript
{
  id: number,
  employeeId: number,
  type: string,                // "Entrada" ou "Saída"
  timestamp: string,           // ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
  rf: string                   // "RF 1", "RF 2", "RF -", null
}
```

---

## 📈 CÁLCULOS JÁ IMPLEMENTADOS

### 1. ADIANTAMENTOS (Entrada antes da hora esperada)
**Arquivo:** `scripts/relatorio-ponto.js`
**Função:** `calculateDailyBalance(employeeId, date)`

Retorna:
```javascript
{
  adiantamentoMinutos: number,     // Minutos de adiantamento
  adiantamentoHoras: number,       // Convertido em horas (ex: 0.25)
  tipo: 'adiantamento'|'extra'|'atraso'|'normal'
}
```

**Lógica:**
- Compara primeiro ponto de entrada do dia com `emp.horaInicio`
- Se entrada < horaInicio → calcula diferença em minutos
- Marca como tipo "adiantamento"

**Exemplo:** 
- Funcionário esperado 08:00, entrada 07:45 = 15 minutos de adiantamento

---

### 2. HORAS EXTRAS
**Função:** `calculateDailyBalance(employeeId, date)`

Retorna:
```javascript
{
  horasTrabalhadas: number,        // Total horas do dia
  horasEsperadas: number,          // 8h padrão ou configurado no cargo
  diferenca: number,               // Diferença absoluta
  tipo: 'extra' (se diferenca > 0)
}
```

---

### 3. ATRASOS
**Arquivo:** `scripts/atrasos.js`
**Função:** `calculateMonthlyDelays(employeeId, month)`

Retorna array com:
```javascript
{
  tipo: 'atraso'|'adiantamento',
  minutos: number,
  horas: number,
  data: string,
  horaEntrada: string,
  expectedTime: string
}
```

---

## 🔗 FUNÇÕES IMPORTANTES PARA FECHAMENTO

### Função 1: `calculateDailyBalance(employeeId, date)`
**Arquivo:** `scripts/relatorio-ponto.js` (linha 98)
```javascript
// Calcular balanço de um dia específico
const balance = calculateDailyBalance(1, new Date('2025-11-27'));
console.log(balance);
// Retorna: { horasTrabalhadas, horasEsperadas, diferenca, adiantamentoMinutos, tipo, ... }
```

### Função 2: `generateDailyDelayReport(date)`
**Arquivo:** `scripts/relatorio-ponto.js` (linha 437)
```javascript
// Gera relatório diário com todos os funcionários
const report = generateDailyDelayReport(new Date('2025-11-27'));
// Filtra por tipo:
const extras = report.filter(r => r.tipo === 'extra' || r.tipo === 'adiantamento');
const delays = report.filter(r => r.tipo === 'atraso');
```

### Função 3: `getEmployees()`
**Arquivo:** `scripts/data.js`
```javascript
// Obter todos os funcionários
const employees = getEmployees();
// Cada employee tem todos os dados acima
```

### Função 4: `getPunchesForEmployee(employeeId, startDate, endDate)`
**Arquivo:** `scripts/relatorio-ponto.js` (linha 17)
```javascript
// Obter punches de um funcionário em um período
const punches = getPunchesForEmployee(1, new Date('2025-11-01'), new Date('2025-11-30'));
```

---

## 💰 CÁLCULOS PARA IMPLEMENTAR NO FECHAMENTO

### Vale Alimentação por Período
```javascript
// Dias trabalhados × Vale Alimentação Diário
const diasTrabalhados = /* contar dias com ponto */;
const valeAlimentacaoTotal = emp.valeAlimentacao * diasTrabalhados;
// Exemplo: 20 dias × R$ 25,50 = R$ 510,00
```

### Vale Transporte Indicador
```javascript
// Apenas indicador: Optante ou Não Optante
// Não há cálculo automático, só registro
// Usar em relatório para filtrar/diferenciar
```

### Adicionais
```javascript
// Registrar qual tipo o funcionário recebe
// Valores específicos serão definidos na empresa
// Exemplo: Noturno +20%, Insalubridade 20%
```

---

## 🗂️ ESTRUTURA DO RELATÓRIO SUGERIDO

```
RELATÓRIO DE FECHAMENTO
=====================

Período: 01/11/2025 a 30/11/2025
Data Geração: 27/11/2025

FUNCIONÁRIO
===========
Matrícula: 001
Nome: João Silva
Cargo: Gerente
Departamento: TI
CPF: 123.456.789-00

HORAS
=====
Dias Trabalhados: 20
Horas Trabalhadas: 160h
Horas Esperadas: 160h
Horas Extras: 5h
Atrasos: 2h
Adiantamentos: 3h (0.5h, 0.75h, etc.)

BENEFÍCIOS
==========
Vale Alimentação: R$ 510,00 (20 dias × R$ 25,50)
Vale Transporte: Optante

ADICIONAIS
==========
Tipo: Insalubridade 20%
Valor Base: R$ 2.000,00
Insalubridade: R$ 400,00

RESUMO FINANCEIRO
=================
Salário Base: R$ 2.000,00
Insalubridade: R$ 400,00
Vale Alimentação: R$ 510,00
(Descontos e outros cálculos aqui)
TOTAL: R$ ...
```

---

## 🔑 CHAVES DO LOCALSTORAGE DISPONÍVEIS

```javascript
'topservice_employees_v1'       // Array de funcionários
'topservice_punches_v1'         // Array de pontos
'topservice_departamentos_v1'   // Array de departamentos
'topservice_cargos_v1'          // Array de cargos
'topservice_afastamentos_v1'    // Array de afastamentos
```

---

## ⚙️ PRÓXIMOS PASSOS PARA FECHAMENTO

1. **Criar nova página/modal:** `fechamento` no navigation.js
2. **Selecionar período:** Data início e fim
3. **Selecionar funcionário(s):** Um ou todos
4. **Gerar relatório:** Coletar dados de:
   - `calculateDailyBalance()` para cada dia
   - `getEmployeeById()` para dados pessoais/benefícios
   - Contar dias com ponto
   - Calcular totais
5. **Exibir/Exportar:** HTML para impressão ou PDF

---

## 📝 OBSERVAÇÕES IMPORTANTES

- **Adiantamentos são positivos** (funcionário chegou cedo)
- **Atrasos são negativos** (funcionário chegou atrasado)
- **Horas extras** são calculadas como: horas trabalhadas - 8h
- **Vale alimentação** precisa de contagem de dias trabalhados
- **Vale transporte** é apenas indicador (Optante/Não Optante)
- **Adicionais** são valores percentuais sobre o salário

---

## 🎓 EXEMPLOS DE USO

### Exemplo 1: Relatório de um funcionário para novembro
```javascript
const emp = getEmployeeById(1);
const month = new Date(2025, 10); // Novembro (0-indexed)

const diasTrabalhados = [];
for (let d = 1; d <= 30; d++) {
  const date = new Date(2025, 10, d);
  const balance = calculateDailyBalance(1, date);
  if (balance && balance.horasTrabalhadas > 0) {
    diasTrabalhados.push({date, balance});
  }
}

const totalExtras = diasTrabalhados.reduce((sum, d) => {
  return sum + (d.balance.tipo === 'extra' ? d.balance.diferenca : 0);
}, 0);

const totalAdiantamentos = diasTrabalhados.reduce((sum, d) => {
  return sum + (d.balance.adiantamentoHoras || 0);
}, 0);

const valeAlimentacaoTotal = emp.valeAlimentacao * diasTrabalhados.length;

console.log({
  funcionario: emp.nome,
  diasTrabalhados: diasTrabalhados.length,
  totalExtras,
  totalAdiantamentos,
  valeAlimentacaoTotal,
  valeTransporte: emp.valeTransporte,
  adicional: emp.adicional
});
```

---

## 📞 INFORMAÇÕES CRÍTICAS

✅ **Todos esses dados estão funcionando e testados**
✅ **Armazenados em localStorage** - persistem entre sessões
✅ **Prontos para integração no relatório de fechamento**
✅ **Formatação em Real (R$)** - já implementada
✅ **Cálculos de adiantamentos, extras, atrasos** - já funcionando

