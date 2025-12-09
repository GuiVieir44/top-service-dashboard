## CHECKLIST DE ALINHAMENTO - SUPABASE SYNC v2

### ✅ VERIFICAÇÃO DE COMPATIBILIDADE

#### 1. EMPLOYEES (Funcionários)
**App (localStorage)**:
- id, matricula, nome, cargo, departamento, adicional
- **valeAlimentacao**, **valeTransporte**, cpf, email, admissao, telefone, endereco, status

**Supabase (SQL)**:
- id, matricula, nome, cargo, departamento, adicional
- **vale_alimentacao**, **vale_transporte**, cpf, email, admissao, telefone, endereco, status

**Sync-Completo.js**:
- ✅ Upload: Envia `vale_alimentacao` (normalizado de `valeAlimentacao`)
- ✅ Download: Retorna `valeAlimentacao` (normalizado de `vale_alimentacao`)
- **STATUS**: ALINHADO

---

#### 2. PUNCHES (Registros de Hora)
**App (localStorage)**:
- id, **employeeId**, type, timestamp, status

**Supabase (SQL)**:
- id, **employeeid**, type, timestamp, status

**Sync-Completo.js**:
- ✅ Upload: Envia `employeeid` (normalizado de `employeeId`)
- ✅ Download: Retorna `employeeId` (normalizado de `employeeid`)
- **STATUS**: ALINHADO

---

#### 3. AFASTAMENTOS (Ausências)
**App (localStorage)**:
- id, **employeeId**, **startDate**, **endDate**, days, type

**Supabase (SQL)**:
- id, **employeeid**, **start_date**, **end_date**, days, type

**Sync-Completo.js**:
- ✅ Upload: Envia `employeeid`, `start_date`, `end_date` (normalizados)
- ✅ Download: Retorna `employeeId`, `startDate`, `endDate` (normalizados)
- **STATUS**: ALINHADO

---

#### 4. AUSENCIAS (Faltas)
**App (localStorage)**:
- id, **employeeId**, data, tipo, observacoes

**Supabase (SQL)**:
- id, **employeeid**, data, tipo, observacoes

**Sync-Completo.js**:
- ✅ Upload: Normaliza `employeeId` → `employeeid`
- ✅ Download: Normaliza `employeeid` → `employeeId`
- **STATUS**: ALINHADO

---

#### 5. DEPARTAMENTOS
**App (window.departamentos)**:
- id, name, description

**Supabase (SQL)**:
- id, name, description

**Sync-Completo.js**:
- ✅ Campos diretos, sem normalização necessária
- **STATUS**: ALINHADO

---

#### 6. CARGOS
**App (localStorage: topservice_cargos_v1)**:
- id, nome

**Supabase (SQL)**:
- id, nome

**Sync-Completo.js**:
- ✅ Campos diretos, sem normalização necessária
- **STATUS**: ALINHADO

---

#### 7. USERS
**App (localStorage: topservice_users_v1)**:
- id, nome, email, senha, role, ativo

**Supabase (SQL)**:
- id, nome, email, senha, role, ativo

**Sync-Completo.js**:
- ✅ Mapeamento direto
- **STATUS**: ALINHADO

---

#### 8. CONFIGURACOES (Settings)
**App (localStorage: SETTINGS_KEY)**:
- Armazenado como objeto JSON

**Supabase (SQL)**:
- Tabela: id, chave, valor, tipo

**Sync-Completo.js**:
- ✅ Converte objeto → array de registros
- ✅ Serializa valores para JSON string
- **STATUS**: ALINHADO

---

### ✅ FLUXO COMPLETO

#### Upload (Sync):
```
App (camelCase) → Normalizado (snake_case) → Supabase ✅
```

#### Download:
```
Supabase (snake_case) → Normalizado (camelCase) → App ✅
```

---

### ✅ TRATAMENTO DE ERROS

| Erro | Ação | Status |
|------|------|--------|
| 400 (Bad Request) | Log error, continua próximo item | ✅ |
| 409 (Conflict/Duplicado) | Tenta UPDATE em vez de INSERT | ✅ |
| Outros | Log error, continua próximo item | ✅ |

---

### ✅ INICIALIZAÇÃO

Ordem de execução:
1. ✅ Verificar conexão (1000ms)
2. ✅ Download dos dados remotos (2000ms)
3. ✅ Upload dos dados locais (3000ms)

---

## CONCLUSÃO

### ✅ TUDO ESTÁ ALINHADO!

- Campos do app ↔ SQL: SINCRONIZADOS
- Nomes camelCase ↔ snake_case: NORMALIZADOS
- Upload/Download: BIDIRECIONAIS
- Tratamento de erros: COMPLETO
- Inicialização: AUTOMÁTICA

### 🚀 PRONTO PARA USAR!

Execute no console:
```javascript
supabaseSync.syncAllData()
```

Ou simplesmente recarregue a página (faz download + upload automático).
