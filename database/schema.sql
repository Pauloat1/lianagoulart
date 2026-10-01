-- ============================================================================
-- PORTAL GOULART EDUCA - SCHEMA DE BANCO DE DADOS (SQL)
-- Suporte a Múltiplos Perfis de Acesso: Aluno, Professor e Coordenação
-- ============================================================================

-- Habilitar suporte a integridade referencial de chaves estrangeiras (SQLite)
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (Autenticação Centralizada)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL, -- Senha criptografada (ex: bcrypt/argon2)
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('aluno', 'professor', 'coordenacao')),
    foto_url VARCHAR(255) DEFAULT NULL,
    ativo BOOLEAN NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME DEFAULT NULL
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE TURMAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(50) NOT NULL, -- Ex: "3º Ano A - Ensino Médio"
    ano_letivo INTEGER NOT NULL, -- Ex: 2026
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('Manhã', 'Tarde', 'Noite', 'Integral'))
);

-- ----------------------------------------------------------------------------
-- 3. PERFIL EXTENDIDO: ALUNOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    turma_id INTEGER DEFAULT NULL,
    data_nascimento DATE DEFAULT NULL,
    responsavel_nome VARCHAR(100) DEFAULT NULL,
    responsavel_telefone VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas (id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 4. PERFIL EXTENDIDO: PROFESSORES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS professores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    registro_funcional VARCHAR(30) NOT NULL UNIQUE,
    especialidade VARCHAR(100) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. PERFIL EXTENDIDO: COORDENAÇÃO / ADMIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coordenacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    cargo VARCHAR(50) NOT NULL DEFAULT 'Coordenador Pedagógico',
    departamento VARCHAR(50) DEFAULT 'Direção Acadêmica',
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 6. DISCIPLINAS ACADÊMICAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disciplinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(80) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    carga_horaria INTEGER NOT NULL DEFAULT 80
);

-- ----------------------------------------------------------------------------
-- 7. ATRIBUIÇÃO DE PROFESSOR E DISCIPLINA À TURMA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turma_disciplina_professor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turma_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    professor_id INTEGER NOT NULL,
    FOREIGN KEY (turma_id) REFERENCES turmas (id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas (id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores (id) ON DELETE CASCADE,
    UNIQUE(turma_id, disciplina_id)
);

-- ----------------------------------------------------------------------------
-- 8. NOTAS E AVALIAÇÕES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    bimestre INTEGER NOT NULL CHECK (bimestre IN (1, 2, 3, 4)),
    nota_p1 REAL CHECK (nota_p1 >= 0 AND nota_p1 <= 10),
    nota_p2 REAL CHECK (nota_p2 >= 0 AND nota_p2 <= 10),
    trabalho REAL CHECK (trabalho >= 0 AND trabalho <= 10),
    media_final REAL CHECK (media_final >= 0 AND media_final <= 10),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas (id) ON DELETE CASCADE,
    UNIQUE(aluno_id, disciplina_id, bimestre)
);

-- ----------------------------------------------------------------------------
-- 9. FREQUÊNCIA E PRESENÇA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS frequencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    data DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT 1,
    justificativa TEXT DEFAULT NULL,
    FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas (id) ON DELETE CASCADE,
    UNIQUE(aluno_id, disciplina_id, data)
);

-- ----------------------------------------------------------------------------
-- 10. COMUNICADOS E AVISOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunicados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    autor_id INTEGER NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL,
    publico_alvo VARCHAR(20) NOT NULL DEFAULT 'todos' CHECK (publico_alvo IN ('todos', 'alunos', 'professores', 'turma')),
    turma_id INTEGER DEFAULT NULL,
    data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 11. CALENDÁRIO ACADÊMICO E EVENTOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT DEFAULT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('prova', 'feriado', 'reuniao', 'evento', 'entrega')),
    criado_por INTEGER NOT NULL,
    FOREIGN KEY (criado_por) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 12. ÍNDICES DE DESEMPENHO (OTIMIZAÇÃO DE CONSULTAS)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula);
CREATE INDEX IF NOT EXISTS idx_notas_aluno ON notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_aluno_data ON frequencias(aluno_id, data);

-- ============================================================================
-- DADOS INICIAIS DE TESTE (SEED DATA)
-- ============================================================================

-- Turma de exemplo
INSERT INTO turmas (id, nome, ano_letivo, turno) VALUES (1, '3º Ano A', 2026, 'Manhã');

-- Disciplinas de exemplo
INSERT INTO disciplinas (id, nome, codigo, carga_horaria) VALUES 
(1, 'Matemática', 'MAT301', 120),
(2, 'História', 'HIS301', 80);

-- 1. Usuário Aluno (Senha simulada: 123456)
INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES 
(1, 'Liana Goulart', 'aluno@goularteduca.com.br', '123456', 'aluno');

INSERT INTO alunos (usuario_id, matricula, turma_id) VALUES 
(1, '2026001', 1);

-- 2. Usuário Professor (Senha simulada: 123456)
INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES 
(2, 'Prof. Carlos Silva', 'professor@goularteduca.com.br', '123456', 'professor');

INSERT INTO professores (usuario_id, registro_funcional, especialidade) VALUES 
(2, 'DOC-2026-99', 'Matemática');

-- 3. Usuário Coordenação (Senha simulada: 123456)
INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES 
(3, 'Mariana Coordenadora', 'coordenacao@goularteduca.com.br', '123456', 'coordenacao');

INSERT INTO coordenacao (usuario_id, cargo, departamento) VALUES 
(3, 'Coordenadora Geral', 'Direção Pedagógica');