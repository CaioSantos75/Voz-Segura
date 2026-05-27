const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());



const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'voz_segura'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err);
    } else {
        console.log('Banco de dados MySQL conectado!');
    }
});

// =====================================================
// ROTA DE CADASTRO
// =====================================================
app.post('/api/usuarios', (req, res) => {
    const { nome, email, telefone, senha } = req.body;
    const query = `INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)`;

    db.query(query, [nome, email, telefone, senha], (err, result) => {
        if (err) {
            console.error('Erro no MySQL:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ error: 'Erro interno ao salvar os dados.' });
        }
        res.status(201).json({ message: 'Usuária criada com sucesso!', id: result.insertId });
    });
});

// =====================================================
// ROTA DE LOGIN
// =====================================================
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    const query = `SELECT id_usuario, nome, senha FROM usuarios WHERE email = ?`;

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const usuario = results[0];

    
        if (senha !== usuario.senha) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        res.status(200).json({
            message: 'Login validado!',
            id_usuario: usuario.id_usuario,
            nome: usuario.nome
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor backend rodando na porta 3000');
});

// =====================================================
// ROTA PARA REGISTRAR DENÚNCIA (ATUALIZADA)
// =====================================================
app.post('/api/denuncias', (req, res) => {
    const {
        id_usuario,
        nome, cpf, email, telefone, endereco,
        tipo_violencia, data_ocorrido, local_ocorrido,
        descricao, agressor
    } = req.body;


    const numeroAleatorio = Math.floor(Math.random() * 900000 + 100000);
    const protocoloGerado = `VA-2026-${numeroAleatorio}`;
 
    const mapaTipos = { fisica: 1, psicologica: 2, sexual: 3, patrimonial: 4, moral: 5, multiplas: 6 };
    const id_tipo = mapaTipos[tipo_violencia] || null;

    const queryDenuncia = `
        INSERT INTO denuncias 
        (id_usuario, titulo, descricao, local_ocorrido, data_ocorrido, status_denuncia, prioridade, anonimato, id_tipo) 
        VALUES (?, ?, ?, ?, ?, 'pendente', 'media', FALSE, ?)
    `;

    db.query(
        queryDenuncia,
        [id_usuario, protocoloGerado, `${descricao} | Agressor: ${agressor}`, local_ocorrido, data_ocorrido, id_tipo],
        (err, result) => {
            if (err) {
                console.error('Erro ao salvar denúncia no MySQL:', err);
                return res.status(500).json({ error: 'Erro interno ao registrar a denúncia.' });
            }

            res.status(201).json({
                message: 'Denúncia registrada com sucesso!',
                protocolo: protocoloGerado
            });
        }
    );
});

// =====================================================
// ROTA PARA BUSCAR DENÚNCIAS DE UMA USUÁRIA ESPECÍFICA
// =====================================================
app.get('/api/denuncias/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;

    const query = `
        SELECT d.*, tv.nome_tipo 
        FROM denuncias d
        LEFT JOIN tipos_violencia tv ON d.id_tipo = tv.id_tipo
        WHERE d.id_usuario = ?
        ORDER BY d.data_denuncia DESC
    `;

    db.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Erro ao buscar denúncias no MySQL:', err);
            return res.status(500).json({ error: 'Erro ao carregar o histórico.' });
        }

        res.status(200).json(results);
    });
});