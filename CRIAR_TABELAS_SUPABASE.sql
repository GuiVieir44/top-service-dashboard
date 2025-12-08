-- =====================================================
-- CRIAR TABELAS SUPABASE - TOP SERVICE
-- Execute este SQL no Editor SQL do Supabase
-- =====================================================

-- 1. TABELA EMPLOYEES (funcionários)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    matricula TEXT,
    nome TEXT,
    cpf TEXT,
    cargo TEXT,
    departamento TEXT,
    email TEXT,
    status TEXT DEFAULT 'Ativo',
    admissao TEXT,
    telefone TEXT,
    endereco TEXT,
    "horaInicio" TEXT DEFAULT '08:00',
    "horaFim" TEXT DEFAULT '17:00',
    adicional TEXT,
    "valeAlimentacao" TEXT,
    "valeTransporte" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS departamentos (
    id TEXT PRIMARY KEY,
    name TEXT,
    nome TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA CARGOS
CREATE TABLE IF NOT EXISTS cargos (
    id TEXT PRIMARY KEY,
    nome TEXT,
    "horasDia" NUMERIC,
    "bancoHoras" NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA PUNCHES (registros de ponto)
CREATE TABLE IF NOT EXISTS punches (
    id TEXT PRIMARY KEY,
    employeeid TEXT,
    type TEXT,
    timestamp TEXT,
    status TEXT,
    rf TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA AFASTAMENTOS
CREATE TABLE IF NOT EXISTS afastamentos (
    id TEXT PRIMARY KEY,
    "employeeId" TEXT,
    type TEXT,
    start TEXT,
    "end" TEXT,
    motivo TEXT,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA AUSENCIAS (faltas e feriados)
CREATE TABLE IF NOT EXISTS ausencias (
    id TEXT PRIMARY KEY,
    "employeeId" INTEGER,
    date TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA FERIAS
CREATE TABLE IF NOT EXISTS ferias (
    id TEXT PRIMARY KEY,
    "employeeId" TEXT,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    dias INTEGER,
    status TEXT DEFAULT 'Programada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA ADIANTAMENTOS
CREATE TABLE IF NOT EXISTS adiantamentos (
    id TEXT PRIMARY KEY,
    "employeeId" TEXT,
    data TEXT,
    valor NUMERIC,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HABILITAR RLS (Row Level Security) - Permitir acesso
-- =====================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE adiantamentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE ACESSO - Permitir tudo para anon
-- =====================================================

-- Employees
DROP POLICY IF EXISTS "Allow all for employees" ON employees;
CREATE POLICY "Allow all for employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- Departamentos
DROP POLICY IF EXISTS "Allow all for departamentos" ON departamentos;
CREATE POLICY "Allow all for departamentos" ON departamentos FOR ALL USING (true) WITH CHECK (true);

-- Cargos
DROP POLICY IF EXISTS "Allow all for cargos" ON cargos;
CREATE POLICY "Allow all for cargos" ON cargos FOR ALL USING (true) WITH CHECK (true);

-- Punches
DROP POLICY IF EXISTS "Allow all for punches" ON punches;
CREATE POLICY "Allow all for punches" ON punches FOR ALL USING (true) WITH CHECK (true);

-- Afastamentos
DROP POLICY IF EXISTS "Allow all for afastamentos" ON afastamentos;
CREATE POLICY "Allow all for afastamentos" ON afastamentos FOR ALL USING (true) WITH CHECK (true);

-- Ausencias
DROP POLICY IF EXISTS "Allow all for ausencias" ON ausencias;
CREATE POLICY "Allow all for ausencias" ON ausencias FOR ALL USING (true) WITH CHECK (true);

-- Ferias
DROP POLICY IF EXISTS "Allow all for ferias" ON ferias;
CREATE POLICY "Allow all for ferias" ON ferias FOR ALL USING (true) WITH CHECK (true);

-- Adiantamentos
DROP POLICY IF EXISTS "Allow all for adiantamentos" ON adiantamentos;
CREATE POLICY "Allow all for adiantamentos" ON adiantamentos FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- HABILITAR REALTIME PARA TODAS AS TABELAS
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE departamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE cargos;
ALTER PUBLICATION supabase_realtime ADD TABLE punches;
ALTER PUBLICATION supabase_realtime ADD TABLE afastamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE ausencias;
ALTER PUBLICATION supabase_realtime ADD TABLE ferias;
ALTER PUBLICATION supabase_realtime ADD TABLE adiantamentos;

-- =====================================================
-- PRONTO! Todas as tabelas criadas e configuradas.
-- =====================================================
