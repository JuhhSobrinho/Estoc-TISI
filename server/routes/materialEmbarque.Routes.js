const express = require('express');
const router = express.Router();
const controller = require('../controller/materialEmbarqueController');

router.route('/')
  .get(controller.getMaterialEmbarqueCompleto)
  .post(controller.setMaterialEmbarque);
router.get('/validade', controller.getValidadePorMaterialEKardex);
router.get('/filtrar', controller.listarMateriaisPorPlataforma);


module.exports = router;
