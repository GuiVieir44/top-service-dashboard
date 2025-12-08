-- ==========================================
-- HABILITAR REALTIME NAS TABELAS DO SUPABASE
-- ==========================================
-- Execute este SQL no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/szwqezafiilwxgpyukxq/sql

-- 1. Habilitar Realtime em cada tabela
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE departamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE punches;
ALTER PUBLICATION supabase_realtime ADD TABLE cargos;
ALTER PUBLICATION supabase_realtime ADD TABLE afastamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE ausencias;
ALTER PUBLICATION supabase_realtime ADD TABLE adiantamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE ferias;
ALTER PUBLICATION supabase_realtime ADD TABLE banco_horas;

-- 2. Verificar se Realtime está habilitado
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Resultado esperado: Lista das 9 tabelas acima
