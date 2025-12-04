# 🧪 TESTE: Cálculo de Adiantamentos e Horas Extras

## 📋 O que foi modificado

### 1. **scripts/relatorios-departamento-complexo.js**
- ✅ Agora detecta **ADIANTAMENTOS** (entrada antes da hora)
- ✅ Conta adiantamentos como **HORA EXTRA**
- ✅ Calcula horas extras de SAÍDA também

**Mudanças:**
- Adicionado rastreamento de `adiantamentoMinutos`
- Adicionado `horaFim` para validação de saída
- Horas extras = Adiantamentos + Tempo extra na saída
- Novo campo: `adiantamentoMinutos` (debugar)

### 2. **scripts/atrasos.js**
- ✅ Agora calcula **ADIANTAMENTOS** também
- ✅ Separa detalhes por tipo: `atraso` vs `adiantamento`
- ✅ Adicionado campo `totalAdvanceMinutes` por funcionário

---

## 🎯 Como Testar

### Teste 1: Relatório de Departamento

1. **Abra o Dashboard**
2. Vá para **Relatórios** > **Por Departamento**
3. Selecione um departamento
4. Clique **"Gerar Relatório"**
5. Procure por um funcionário que entrou antes da hora
6. Verifique se `Horas Extra` aumentou

**Console (F12):**
```javascript
// Você verá logs como:
// [ADIANTAMENTO] João Silva - 2024-11-27: +15 min (entrada 07:45 vs esperado 08:00)
// [EXTRA SAÍDA] João Silva - 2024-11-27: +0.75h (trabalhou 8.75h vs 8h esperadas)
```

---

### Teste 2: Criar Dados de Teste

Se quiser testar manualmente, adicione um ponto antes da hora:

```javascript
// No Console (F12), execute:

// Supondo que hoje é 2024-11-27 e você entra às 08:00
// Vou registrar uma entrada às 07:45 (15 minutos de adiantamento)

const novoPonto = {
    timestamp: new Date('2024-11-27T07:45:00').toISOString(),
    type: 'Entrada',
    employeeId: 1 // ID de algum funcionário
};

// Adicione ao localStorage
const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
punches.push(novoPonto);
localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));

// Agora teste o relatório
```

---

### Teste 3: Verificar Logs no Console

Abra o Console (F12) e procure por:

```
✅ [ADIANTAMENTO] João Silva - 2024-11-27: +15 min
✅ [ATRASO] Maria Santos - 2024-11-27: +30 min
✅ [EXTRA SAÍDA] Pedro Costa - 2024-11-27: +0.5h
```

---

## 📊 Regra de Cálculo

### Entrada ANTES da hora
```
Hora esperada: 08:00
Entrada real: 07:45
Adiantamento: 08:00 - 07:45 = 15 minutos
Resultado: +0.25h de HORA EXTRA ⭐
```

### Entrada DEPOIS da hora
```
Hora esperada: 08:00
Entrada real: 08:30
Atraso: 08:30 - 08:00 = 30 minutos
Resultado: +0.5h de ATRASO ⚠️
```

### Saída DEPOIS do horário esperado
```
Horário esperado: 08:00 até 17:00 (8h)
Saída real: 17:30
Horas trabalhadas: 9.5h
Extras de saída: 9.5h - 8h = 0.5h de HORA EXTRA ⭐
```

### Cálculo Final
```
Horas Extras TOTAL = Adiantamentos + Extras de Saída
                   = 0.25h + 0.5h = 0.75h ⭐
```

---

## 🔍 Campos Monitorados

### No relatório por departamento:
- ✅ `adiantamentoMinutos` - Novidade! Tracks advancement
- ✅ `horasExtras` - Inclui adiantamentos + saída extra
- ✅ `atrasoMinutos` - Entradas atrasadas

### Detalhes de logs:
```javascript
// Cada ponto registra:
{
    employeeId: 1,
    employeeName: "João Silva",
    date: "2024-11-27",
    expectedTime: "08:00",
    actualTime: "07:45",
    advanceMinutes: 15,      // ← NOVO
    type: "adiantamento"     // ← NOVO: 'atraso' | 'adiantamento'
}
```

---

## ⚠️ Comportamento Esperado

### Para entrada no dia 27 às 07:45 (15 min antes)

**No Relatório:**
- ✅ Atrasos: 0h (nenhum atraso)
- ✅ Horas Extra: +0.25h (adiantamento)
- ✅ Status: VERDE (hora extra)

**No Console:**
```
[ADIANTAMENTO] Você registrou 15 minutos de adiantamento
```

**NO BANCO DE HORAS:**
- ❌ NÃO diminui do banco (como pedido)
- ✅ Apenas mostra na análise diária

---

## 🚀 Próximos Passos

1. **Teste hoje** com seus dados reais
2. **Verifique os logs** (F12 > Console)
3. **Confirme se** aparece "+X minutos" como HORA EXTRA
4. Se tiver dúvidas, compartilhe os logs comigo

---

## 📞 Suporte

Se o adiantamento **NÃO** aparecer como hora extra:
1. Abra F12 (Console)
2. Procure por `[ADIANTAMENTO]` nos logs
3. Compartilhe a mensagem de erro
4. Verifique se o horário de entrada está correto

