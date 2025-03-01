const mongoose = require("mongoose");
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("❌ Error: MONGODB_URI is not defined in .env file");
    process.exit(1);
}

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB connected successfully");
}).catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
});;

const emailSchema = new mongoose.Schema({
  purpose: {
    type: String,
    required: true,
  },
  subjectLine: {
    type: String,
    required: true,
  },
  recipients: {
    type: String,
    required: true,
  },
  senders: {
    type: String,
    required: true,
  },
  maxLength: {
    type: Number,
    required: true,
  },
  tone: {
    type: String,
    enum: [
      "friendly",
      "funny",
      "casual",
      "excited",
      "professional",
      "witty",
      "luxury",
      "bold",
      "dramatic",
      "musculine",
      "urgent",
    ],
  },
  generatedEmail: {
    type: String,
    required: false,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isFavorite: { type: Boolean, default: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Add unique constraint
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Email = mongoose.model("Email", emailSchema);
const User = mongoose.model("User", userSchema);


module.exports = {Email, User};