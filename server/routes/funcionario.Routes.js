const express = require('express');
const router = express.Router();
const funcionarioController = require('../controller/funcionarioController');

router.get('/', funcionarioController.getFuncionario);
router.post('/', funcionarioController.setFuncionario);
router.get('/verificar', funcionarioController.verificarFuncionario);
router.put("/:id", funcionarioController.atualizarFuncionario);


module.exports = router;
