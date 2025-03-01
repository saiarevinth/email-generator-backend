const express = require("express");
const router = express.Router();
const { userSchema } = require("../types");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const zod = require("zod");
const { authMiddleware } = require("../middleware");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// ✅ Enable CORS for both production and local development
router.use(cors({
    origin: ["https://email-generator-puce.vercel.app", "http://localhost:3000"],
    methods: ["POST", "GET", "PUT", "DELETE"]
}));

// ✅ Get user details
router.get("/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ id: user._id, username: user.username });
});

// ✅ Sign up route
router.post("/signup", async (req, res) => {
    const parsedPayLoad = userSchema.safeParse(req.body);
    if (!parsedPayLoad.success) {
        return res.status(400).json({
            msg: "Invalid input",
            errors: parsedPayLoad.error.issues,
        });
    }

    const createPayLoad = parsedPayLoad.data;

    try {
        // ✅ Check if email already exists
        const existingUser = await User.findOne({ email: createPayLoad.email });
        if (existingUser) {
            return res.status(400).json({ msg: "Email already registered" });
        }

        // ✅ Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(createPayLoad.password, salt);

        const user = await User.create({
            email: createPayLoad.email,
            username: createPayLoad.username,
            password: hashedPassword, // Store hashed password
        });

        const userId = user._id;
        const token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            msg: "User created successfully",
            token: token,
            userId: userId,
        });

    } catch (error) {
        console.error("Error during User creation:", error);
        res.status(500).json({
            msg: "Error creating user",
            error: error.message,
        });
    }
});

// ✅ Sign in route
const signinBody = zod.object({
    email: zod.string().email("Invalid email address"),
    password: zod.string()
});

router.post("/signin", async (req, res) => {
    const parsedBody = signinBody.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            msg: "Invalid input",
            errors: parsedBody.error.issues,
        });
    }

    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(401).json({ msg: "Incorrect email or password" });
        }

        // ✅ Compare hashed password
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ msg: "Incorrect email or password" });
        }

        const userId = user._id;
        const token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: "1h" });

        res.json({
            token: token,
            userId: userId,
        });

    } catch (error) {
        console.error("Error during signin:", error);
        res.status(500).json({
            msg: "Failed to sign in",
            error: error.message,
        });
    }
});

// ✅ Fetch all users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "_id username email"); // Select only _id, username, and email
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ msg: "Error fetching users", error: error.message });
    }
});

// ✅ Export router
module.exports = router;
