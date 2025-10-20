const express = require('express');
const router = express.Router();
const controller = require('../controller/formularioController');

// Rota principal para listar todos os formulários
router.get('/', controller.getFormulario);

// Rota para listar apenas os nomes
router.get('/nomes', controller.getFormularioNomes);

router.get('/:id', controller.getFormularioId);
router.patch('/item_formulario/:id', controller.atualizarStatusItem);
router.patch('/:id/confirmar', controller.confirmarRequisicao);


// Rota para criar novo formulário
router.post('/', controller.criarFormulario);

module.exports = router;
