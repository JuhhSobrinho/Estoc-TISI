const express = require('express');
const router = express.Router();
const embarqueController = require('../controller/embarqueController');

router.get('/buscar', embarqueController.buscarEmbarque);
router.post('/criar', embarqueController.criarEmbarque);

module.exports = router;
