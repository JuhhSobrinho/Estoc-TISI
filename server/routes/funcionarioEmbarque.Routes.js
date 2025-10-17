const express = require('express');
const router = express.Router();
const controller = require('../controller/funcionarioEmbarqueController');

router.get('/', controller.listarFuncionarioEmbarques);
router.post('/', controller.criarFuncionarioEmbarque);
router.post("/deletar", controller.deletarFuncionarioEmbarque);



module.exports = router;
