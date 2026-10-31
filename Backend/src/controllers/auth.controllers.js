
const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/balcklist.model");

// Cookie configuration
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
};

// Generate JWT token
function generateToken(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing in .env");
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

// Safe user details
function formatUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
    };
}

// REGISTER
async function registerUsercontroller(req, res) {
    try {
        const { username, email, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required",
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await userModel.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedUsername },
            ],
        });

        if (existingUser) {
            const sameEmail =
                existingUser.email.toLowerCase() === normalizedEmail;

            return res.status(409).json({
                success: false,
                message: sameEmail
                    ? "User already exists with this email"
                    : "Username already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful!",
            user: formatUser(newUser),
        });
    } catch (error) {
        console.error("Registration error:", error);

        // Handle MongoDB duplicate-key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];

            return res.status(409).json({
                success: false,
                message: field === "email"
                    ? "User already exists with this email"
                    : "Username already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
        });
    }
}

// LOGIN
async function loginUsercontroller(req, res) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await userModel.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user._id.toString());

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            user: formatUser(user),
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
        });
    }
}

// LOGOUT
async function logoutUsercontroller(req, res) {
    try {
        const token = req.cookies?.token;

        if (token) {
            const alreadyBlacklisted =
                await tokenBlacklistModel.findOne({ token });

            if (!alreadyBlacklisted) {
                await tokenBlacklistModel.create({ token });
            }
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful!",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed. Please try again.",
        });
    }
}

// PROFILE
async function profileController(req, res) {
    try {
        const user = await userModel.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully!",
            user: formatUser(user),
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
        });
    }
}

module.exports = {
    registerUsercontroller,
    loginUsercontroller,
    logoutUsercontroller,
    profileController,
};
