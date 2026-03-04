require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

// Authentication Packages
const session = require("express-session");
const passport = require("./middleware/passport");

// 1. Import the Routers
const projectRouter = require("./routers/projectRouter");
const contactRouter = require("./routers/contactRouter");
const adminRouter = require("./routers/adminRouter");

const app = express();
const port = process.env.PORT || 3000;


// 1. Ignite the Database Connection
mongoose.connect(process.env.MONGO_URI);

// 1b. Store the connection in a variable
const db = mongoose.connection;

// 2. Listen for Connection Events
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("Successfully connected to MongoDB!");
});

// Handle graceful shutdown of db connection
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing Mongoose connection...`);
    try {
        await mongoose.connection.close();
        console.log("Mongoose connection closed. Exit complete.");
        process.exit(0); // Exit with a "success" code
    } catch (err) {
        console.error("Error during Mongoose disconnection:", err);
        process.exit(1); // Exit with an "error" code
    }
};

// Listen for Ctrl+C (Manual stop)
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Listen for termination (Production stop)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON data
app.use(express.static("public")); // Serve static files

// Authentication Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set("view engine", "ejs");

// Temporary Route (Just to check if it works)
app.get("/", (req, res) => {
    res.send("<h1>Server is Running! Next Stop: MongoDB.</h1>");
});

// 2. Use the Routers
app.use("/projects", projectRouter);
app.use("/contact", contactRouter);

// 3. Use the Admin Router
app.use("/admin", adminRouter);

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});