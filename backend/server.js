const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const connection = require('./connection');



connection.connect((err) => {
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

    const query = `
        INSERT INTO usuarios (nome, email, telefone, senha)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [nome, email, telefone, senha], (err, result) => {
        if (err) {
            console.error('Erro no MySQL:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    error: 'Este e-mail já está cadastrado.'
                });
            }

            return res.status(500).json({
                error: 'Erro interno ao salvar os dados.'
            });
        }

        res.status(201).json({
            message: 'Usuária criada com sucesso!',
            id: result.insertId
        });
    });
});

// =====================================================
// ROTA DE LOGIN
// =====================================================
app.post('/api/login', (req, res) => {

    const { email, senha } = req.body;

    const query = `
        SELECT
            id_usuario,
            nome,
            email,
            senha,
            nivel_acesso
        FROM usuarios
        WHERE email = ?
    `;

    connection.query(
        query,
        [email],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: 'Erro interno no servidor.'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    error:
                        'E-mail ou senha incorretos.'
                });
            }

            const usuario = results[0];
            console.log(usuario)
            // valida senha
            if (senha !== usuario.senha) {

                return res.status(401).json({
                    error:
                        'E-mail ou senha incorretos.'
                });
            }

            // sucesso login
            return res.status(200).json({
                message: 'Login validado!',
                id_usuario:
                    usuario.id_usuario,
                nome:
                    usuario.nome,
                email:
                    usuario.email,
                nivel_acesso:
                    usuario.nivel_acesso
            });
        }
    );
});

// =====================================================
// ROTA PARA REGISTRAR DENÚNCIA
// =====================================================
app.post('/api/denuncias', (req, res) => {
    const {
        id_usuario,
        nome,
        cpf,
        email,
        telefone,
        endereco,
        tipo_violencia,
        data_ocorrido,
        local_ocorrido,
        descricao,
        agressor
    } = req.body;

    const numeroAleatorio = Math.floor(Math.random() * 900000 + 100000);
    const protocoloGerado = `VA-2026-${numeroAleatorio}`;

    const mapaTipos = {
        fisica: 1,
        psicologica: 2,
        sexual: 3,
        patrimonial: 4,
        moral: 5,
        multiplas: 6
    };

    const id_tipo = mapaTipos[tipo_violencia] || null;

    const queryDenuncia = `
        INSERT INTO denuncias
        (
            id_usuario,
            titulo,
            descricao,
            local_ocorrido,
            data_ocorrido,
            status_denuncia,
            prioridade,
            anonimato,
            id_tipo
        )
        VALUES (?, ?, ?, ?, ?, 'pendente', 'media', FALSE, ?)
    `;

    connection.query(
        queryDenuncia,
        [
            id_usuario,
            protocoloGerado,
            `${descricao} | Agressor: ${agressor}`,
            local_ocorrido,
            data_ocorrido,
            id_tipo
        ],
        (err, result) => {
            if (err) {
                console.error('Erro ao salvar denúncia no MySQL:', err);

                return res.status(500).json({
                    error: 'Erro interno ao registrar a denúncia.'
                });
            }

            res.status(201).json({
                message: 'Denúncia registrada com sucesso!',
                protocolo: protocoloGerado
            });
        }
    );
});

// =====================================================
// ROTA PARA BUSCAR DENÚNCIAS
// =====================================================
app.get('/api/denuncias/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;

    const query = `
        SELECT d.*, tv.nome_tipo
        FROM denuncias d
        LEFT JOIN tipos_violencia tv
            ON d.id_tipo = tv.id_tipo
        WHERE d.id_usuario = ?
        ORDER BY d.data_denuncia DESC
    `;

    connection.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Erro ao buscar denúncias no MySQL:', err);

            return res.status(500).json({
                error: 'Erro ao carregar o histórico.'
            });
        }

        res.status(200).json(results);
    });
});

// =====================================================
// SERVIDOR
// =====================================================
app.listen(3000, () => {
    console.log('Servidor backend rodando na porta 3000');
});




// =====================================================
// ADMIN - LISTAR TODAS AS DENÚNCIAS
// =====================================================
app.get('/api/admin/denuncias', (req, res) => {

    const query = `
        SELECT
            d.id_denuncia,
            d.id_usuario,

            CASE
                WHEN d.anonimato = 1
                THEN 'Anônimo'
                ELSE u.nome
            END AS usuario,

            tv.nome_tipo,

            d.titulo,
            d.descricao,
            d.local_ocorrido,
            d.data_ocorrido,
            d.status_denuncia,
            d.prioridade,
            d.anonimato,
            d.data_denuncia

        FROM denuncias d

        LEFT JOIN usuarios u
            ON d.id_usuario = u.id_usuario

        LEFT JOIN tipos_violencia tv
            ON d.id_tipo = tv.id_tipo

        ORDER BY d.data_denuncia DESC
    `;

    connection.query(query, (err, results) => {

        if (err) {
            console.error(
                'Erro ao buscar denúncias admin:',
                err
            );

            return res.status(500).json({
                error: 'Erro ao carregar denúncias.'
            });
        }

        res.status(200).json(results);
    });
});


// =====================================================
// ADMIN - BUSCAR UMA DENÚNCIA
// =====================================================
app.get('/api/admin/denuncias/:id', (req, res) => {

    const { id } = req.params;

    const query = `
        SELECT
            d.id_denuncia,
            d.id_usuario,

            CASE
                WHEN d.anonimato = 1
                THEN 'Anônimo'
                ELSE u.nome
            END AS usuario,

            tv.nome_tipo,

            d.titulo,
            d.descricao,
            d.local_ocorrido,
            d.data_ocorrido,
            d.status_denuncia,
            d.prioridade,
            d.anonimato,
            d.data_denuncia

        FROM denuncias d

        LEFT JOIN usuarios u
            ON d.id_usuario = u.id_usuario

        LEFT JOIN tipos_violencia tv
            ON d.id_tipo = tv.id_tipo

        WHERE d.id_denuncia = ?
    `;

    connection.query(query, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: 'Erro ao buscar denúncia.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: 'Denúncia não encontrada.'
            });
        }

        res.status(200).json(results[0]);
    });
});


// =====================================================
// ADMIN - ALTERAR STATUS DA DENÚNCIA
// =====================================================
app.put('/api/admin/denuncias/:id', (req, res) => {

    const { id } = req.params;
    const { status_denuncia } = req.body;

    const statusPermitidos = [
        'pendente',
        'em_analise',
        'em_atendimento',
        'resolvida'
    ];

    if (!statusPermitidos.includes(status_denuncia)) {
        return res.status(400).json({
            error: 'Status inválido.'
        });
    }

    const query = `
        UPDATE denuncias
        SET status_denuncia = ?
        WHERE id_denuncia = ?
    `;

    connection.query(
        query,
        [status_denuncia, id],
        (err, result) => {

            if (err) {
                console.error(
                    'Erro ao atualizar denúncia:',
                    err
                );

                return res.status(500).json({
                    error: 'Erro ao atualizar denúncia.'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Denúncia não encontrada.'
                });
            }

            res.status(200).json({
                message:
                    'Status atualizado com sucesso!'
            });
        }
    );
});


// =====================================================
// ADMIN - EXCLUIR DENÚNCIA
// =====================================================
app.delete('/api/admin/denuncias/:id', (req, res) => {

    const { id } = req.params;

    const query = `
        DELETE FROM denuncias
        WHERE id_denuncia = ?
    `;

    connection.query(query, [id], (err, result) => {

        if (err) {
            console.error(
                'Erro ao deletar denúncia:',
                err
            );

            return res.status(500).json({
                error: 'Erro ao deletar denúncia.'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Denúncia não encontrada.'
            });
        }

        res.status(200).json({
            message:
                'Denúncia removida com sucesso.'
        });
    });
});