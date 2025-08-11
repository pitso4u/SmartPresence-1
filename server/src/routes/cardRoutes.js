const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// Existing routes
router.post('/', cardController.createCard);
router.get('/', cardController.getAllCards);
router.get('/:id', cardController.getCardById);
router.put('/:id', cardController.updateCardById);
router.delete('/:id', cardController.deleteCardById);

// New route for generating cards for all users
router.post('/generate-all', cardController.generateCardsForAllUsers);

module.exports = router;
