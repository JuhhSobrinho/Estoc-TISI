const express = require('express');
const router = express.Router();
const controller = require('../controller/cautelaMatController');

router.get('/', controller.getCautelaMaterial);
router.post('/', controller.setCautelaMaterial);


module.exports = router;
