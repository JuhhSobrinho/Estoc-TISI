// routes/materialRoutes.js
const express = require('express');
const router = express.Router();
const controllerMaterial = require('../controller/materialController');

// Criar material + embarque
router.post('/', controllerMaterial.setMaterialComEmbarque);

// Atualizar material + embarque (precisa dos dois IDs)
router.put('/:id/:id_mat_emb', controllerMaterial.atualizarMaterialComEmbarque);

// Buscar por ID do embarque
router.get('/:id', controllerMaterial.getMaterialComEmbarquePorId);

module.exports = router;
