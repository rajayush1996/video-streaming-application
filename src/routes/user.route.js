/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticated = require("../middlewares/auth.middleware");
/* GET users listing. */
// eslint-disable-next-line no-unused-vars
router.get('/me', authenticated, userController.getUserById);
router.put('/me', authenticated, userController.updateUser);

module.exports = router;
