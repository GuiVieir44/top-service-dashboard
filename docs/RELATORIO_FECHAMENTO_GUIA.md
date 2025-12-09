# 📊 GUIA - RELATÓRIO DE FECHAMENTO POR DEPARTAMENTO

## ✅ Funcionalidade Implementada

Foi criado um **Relatório de Fechamento Completo por Departamento** com todas as colunas solicitadas.

## 📍 Como Acessar

1. Clique na aba **"Relatórios"** na navegação lateral
2. Navegue até a seção **"📊 Relatório de Fechamento"**
3. Selecione um departamento e o período desejado
4. Clique em **"🔄 Gerar Relatório"**

## 📋 Colunas da Tabela

| Coluna | Origem | Descrição |
|--------|--------|-----------|
| **Funcionário** | Cadastro | Nome do funcionário |
| **Cargo** | Cadastro (campo "cargo") | Cargo registrado no sistema |
| **Afastamento (dias)** | Aba Afastamentos | Quantidade de dias em afastamento dentro do período |
| **Faltas** | Consulta de Ponto | Quantidade de faltas marcadas |
| **Feriados** | Consulta de Ponto | Quantidade de feriados marcados |
| **Adicional** | Cadastro (benefícios) | Tipo de adicional (Noturno, Insalubridade 20%, Insalubridade 40%) |
| **Hora Extra** | Cálculo | Tempo total em horas e minutos |
| **Atraso** | Cálculo | Tempo total em horas e minutos |
| **Vale Alimentação** | Cadastro (benefícios) | Valor em R$ |
| **Vale Transporte** | Cadastro (benefícios) | Optante / Não Optante |

## 🧮 Cálculos Utilizados

### Hora Extra
- **Entrada Antecipada**: se primeira entrada < horaInicio (e.g., 07:00 vs 08:00) = minutos de antecedência
- **Saída Atrasada**: se última saída > horaFim (e.g., 18:00 vs 17:00) = minutos de atraso
- **Total**: soma dos dois valores em horas e minutos

### Atraso
- **Apenas primeira entrada** do dia
- Se primeira entrada > horaInicio = minutos de atraso
- Total em horas e minutos

## 📊 Totalizações

Ao final da tabela, há uma linha **TOTAIS** que soma:
- ✅ Dias de afastamento (todos os funcionários)
- ✅ Total de faltas
- ✅ Total de feriados
- ✅ Total de hora extra (em horas:minutos)
- ✅ Total de atraso (em horas:minutos)

## 🎨 Formatação Visual

- **Faltas**: destacadas em laranja (#f39c12)
- **Feriados**: destacadas em roxo (#9b59b6)
- **Hora Extra**: em verde (#27ae60)
- **Atraso**: em vermelho (#e74c3c)

## 💾 Dados Utilizados

O relatório puxa dados de:
- `topservice_employees_v1` - cadastro de funcionários
- `topservice_absences_v1` - faltas e feriados
- `topservice_afastamentos_v1` - afastamentos
- `topservice_punches_v1` - pontos de entrada/saída

## ⏰ Período Padrão

Por padrão, o relatório gera para o **mês atual** (1º até último dia do mês).
Você pode alterar o período usando os campos de data.

## 🚀 Exemplo de Uso

1. Departamento: "RH"
2. Data Inicial: 01/11/2025
3. Data Final: 30/11/2025
4. Clique em "Gerar Relatório"

**Resultado**: Tabela com todos os funcionários do RH, suas informações completas, e os cálculos de presença, faltas e horas.

## ✨ Recursos Adicionais

- ✅ Cálculo automático de saldo (hora extra - atraso)
- ✅ Cores dinâmicas respeitando tema claro/escuro
- ✅ Filtro por departamento
- ✅ Período customizável
- ✅ Totalizações automáticas
- ✅ Apenas funcionários ativos são inclusos

---

**Status**: ✅ Totalmente funcional
**Última atualização**: 27/11/2025
