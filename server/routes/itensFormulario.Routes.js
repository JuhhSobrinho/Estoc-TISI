const express = require('express');
const router = express.Router();
const controller = require('../controller/itensFormularioController');

router.get('/', controller.getItemFormularioEspecifico);

module.exports = router;
