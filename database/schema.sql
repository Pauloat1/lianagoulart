-- Criação do Banco de Dados
CREATE DATABASE goulart_educa;
\c goulart_educa;

-- Tabela de Usuários (Alunos, Professores, Direção)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    turma VARCHAR(50),
    papel VARCHAR(20) DEFAULT 'aluno' CHECK (papel IN ('aluno', 'professor', 'admin')),
    avatar_url TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Disciplinas
CREATE TABLE disciplinas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    carga_horaria INT NOT NULL
);

-- Tabela de Notas (Boletim Escolar)
CREATE TABLE notas (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    disciplina_id INT REFERENCES disciplinas(id) ON DELETE CASCADE,
    ano_letivo INT NOT NULL,
    bimestre_1 DECIMAL(4,2),
    bimestre_2 DECIMAL(4,2),
    bimestre_3 DECIMAL(4,2),
    bimestre_4 DECIMAL(4,2),
    faltas INT DEFAULT 0,
    UNIQUE(usuario_id, disciplina_id, ano_letivo)
);

-- Tabela de Avisos (Comunicação da Empresa/Escola)
CREATE TABLE avisos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    urgente BOOLEAN DEFAULT FALSE
);

-- Tabela de Relacionamento (Avisos Lidos)
CREATE TABLE avisos_lidos (
    aviso_id INT REFERENCES avisos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    lido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (aviso_id, usuario_id)
);