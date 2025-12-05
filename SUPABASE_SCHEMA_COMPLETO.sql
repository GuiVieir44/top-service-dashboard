-- ==========================================
-- SCHEMA COMPLETO SUPABASE - TOP SERVICE
-- Armazena TODOS os dados do site
-- ==========================================

-- 1. TABELA DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS departamentos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA EMPLOYEES (FUNCIONÁRIOS)
-- Armazena: id, matricula, nome, cargo, departamento, adicional, vale_alimentacao, vale_transporte, cpf, email, admissao, telefone, endereco, status
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    matricula TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    cargo TEXT,
    departamento TEXT,
    adicional TEXT,
    vale_alimentacao DECIMAL(10,2),
    vale_transporte TEXT,
    cpf TEXT,
    email TEXT,
    admissao TEXT,
    telefone TEXT,
    endereco TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA PUNCHES (PONTOS/REGISTROS DE HORA)
-- Armazena: id, employeeid, type, timestamp, status
CREATE TABLE IF NOT EXISTS punches (
    id TEXT PRIMARY KEY,
    employeeid TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employeeid) REFERENCES employees(id) ON DELETE CASCADE
);

-- 4. TABELA AFASTAMENTOS (FALTAS/AUSÊNCIAS)
-- Armazena: id, employeeid, start_date, end_date, days, type
CREATE TABLE IF NOT EXISTS afastamentos (
    id TEXT PRIMARY KEY,
    employeeid TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    days INTEGER,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employeeid) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. TABELA CARGOS (POSIÇÕES/FUNÇÕES)
-- Armazena: id, nome
CREATE TABLE IF NOT EXISTS cargos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA CONFIGURACOES (SETTINGS)
-- Armazena: chave, valor
CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT,
    tipo TEXT DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA AUSENCIAS/FALTAS
-- Armazena: id, employeeid, data, tipo
CREATE TABLE IF NOT EXISTS ausencias (
    id TEXT PRIMARY KEY,
    employeeid TEXT,
    data TEXT,
    tipo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA BANCO_HORAS (HORAS EXTRAS)
-- Armazena: id, employeeid, data, horas, tipo
CREATE TABLE IF NOT EXISTS banco_horas (
    id TEXT PRIMARY KEY,
    employeeid TEXT NOT NULL,
    data TEXT,
    horas DECIMAL(5,2),
    tipo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employeeid) REFERENCES employees(id) ON DELETE CASCADE
);

-- 9. TABELA ADIANTAMENTOS
-- Armazena: id, employeeid, data, valor, status
CREATE TABLE IF NOT EXISTS adiantamentos (
    id TEXT PRIMARY KEY,
    employeeid TEXT NOT NULL,
    data TEXT NOT NULL,
    valor DECIMAL(10,2),
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employeeid) REFERENCES employees(id) ON DELETE CASCADE
);

-- 10. TABELA USERS (USUÁRIOS/LOGINS)
-- Armazena: id, nome, email, senha, role
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT,
    role TEXT DEFAULT 'user',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. TABELA FERIAS (FÉRIAS)
-- Armazena: id, employeeid, data_inicio, data_fim, dias
CREATE TABLE IF NOT EXISTS ferias (
    id TEXT PRIMARY KEY,
    employeeid TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    dias INTEGER,
    ano INTEGER,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employeeid) REFERENCES employees(id) ON DELETE CASCADE
);

-- 12. TABELA RELATORIOS (HISTÓRICO DE RELATÓRIOS GERADOS)
-- Armazena: id, tipo, employeeid, mes, ano, dados
CREATE TABLE IF NOT EXISTS relatorios (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    employeeid TEXT,
    mes INTEGER,
    ano INTEGER,
    dados JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. TABELA CARGO_DEPARTAMENTO (CUSTOMIZAÇÃO DE CARGOS POR DEPARTAMENTO)
-- Armazena: id, departamento, cargo
CREATE TABLE IF NOT EXISTS cargo_departamento (
    id TEXT PRIMARY KEY,
    departamento TEXT NOT NULL,
    cargo TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_punches_employeeid ON punches(employeeid);
CREATE INDEX IF NOT EXISTS idx_afastamentos_employeeid ON afastamentos(employeeid);
CREATE INDEX IF NOT EXISTS idx_employees_matricula ON employees(matricula);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_punches_timestamp ON punches(timestamp);
CREATE INDEX IF NOT EXISTS idx_ferias_employeeid ON ferias(employeeid);
CREATE INDEX IF NOT EXISTS idx_banco_horas_employeeid ON banco_horas(employeeid);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_employeeid ON adiantamentos(employeeid);
CREATE INDEX IF NOT EXISTS idx_ausencias_employeeid ON ausencias(employeeid);

-- Habilitar RLS (Row Level Security) - Todos podem ler/escrever (ajustar conforme necessário)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE adiantamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_departamento ENABLE ROW LEVEL SECURITY;

-- Criar policies para permitir acesso anônimo
CREATE POLICY "Allow anonymous read" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON employees FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON punches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON punches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON punches FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON punches FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON afastamentos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON afastamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON afastamentos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON afastamentos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON departamentos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON departamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON departamentos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON departamentos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON cargos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON cargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON cargos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON cargos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON configuracoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON configuracoes FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON ausencias FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON ausencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON ausencias FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON banco_horas FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON banco_horas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON banco_horas FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON adiantamentos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON adiantamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON adiantamentos FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON ferias FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON ferias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON ferias FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON ferias FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON relatorios FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON relatorios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON relatorios FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON relatorios FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON cargo_departamento FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON cargo_departamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON cargo_departamento FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON cargo_departamento FOR DELETE USING (true);
