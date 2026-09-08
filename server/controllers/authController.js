const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: "7d",
    },
  );
}

function formatUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

async function register(req, res) {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required.",
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    if (error.message === "JWT_SECRET is not configured.") {
      return res.status(500).json({
        message: "Authentication configuration error.",
      });
    }

    return res.status(500).json({
      message: "Server error during registration.",
    });
  }
}

async function login(req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.message === "JWT_SECRET is not configured.") {
      return res.status(500).json({
        message: "Authentication configuration error.",
      });
    }

    return res.status(500).json({
      message: "Server error during login.",
    });
  }
}

async function adminLogin(req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access denied.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Admin login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Admin login error:", error);

    if (error.message === "JWT_SECRET is not configured.") {
      return res.status(500).json({
        message: "Authentication configuration error.",
      });
    }

    return res.status(500).json({
      message: "Server error during admin login.",
    });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Me error:", error);

    return res.status(500).json({
      message: "Server error.",
    });
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  me,
};
