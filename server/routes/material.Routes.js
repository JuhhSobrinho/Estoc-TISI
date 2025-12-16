const express = require('express');
const router = express.Router();
const controllerMaterial = require('../controller/materialController');


router.post('/', controllerMaterial.setMaterialComEmbarque);
router.put('/:id', controllerMaterial.atualizarMaterialComEmbarque);
router.get('/:id', controllerMaterial.getMaterialComEmbarquePorId);





module.exports = router;
