const express = require('express');
const router = express.Router();
const plataformaController = require('../controller/plataformaController');

router.get('/', plataformaController.getPlataformas);
router.post('/', plataformaController.cadastrarPlataforma);
router.get('/buscar', plataformaController.buscarPlataformaPorNome);

module.exports = router;
