const express = require('express');
const authController = require('../controllers/auth.controllers');
const authMiddleware = require('../middlewares/auth.middleware')
const authRoutes = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRoutes.post('/register', authController.registerUsercontroller);
/**
 * @route POST /api/auth/login
 * @desc Login a user with email and password, generates a JWT token, and returns the user data along with the token.
 * @access Public
 */
authRoutes.post('/login', authController.loginUsercontroller);
/**
 * @route POST /api/auth/logout
 * @desc Logout a user by blacklisting the JWT token.
 * @access Public
 */
authRoutes.post('/logout', authController.logoutUsercontroller);
/**
 * @route GET /api/auth/profile
 * @desc Get the profile of the logged-in user.
 * @access Private
 */
authRoutes.get('/profile', authMiddleware.authUser, authController.profileController);

module.exports = authRoutes;