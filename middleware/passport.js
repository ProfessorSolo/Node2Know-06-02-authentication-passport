const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const _userOps = require("../data/users");

// Serialize: What should we put IN the session cookie?
passport.serializeUser((user, done) => {
    // We only store the user's stringified _id
    done(null, user._id.toString());
});

// Deserialize: How do we unpack the cookie and get the whole User back?
passport.deserializeUser(async (id, done) => {
    try {
        const user = await _userOps.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Define the Local Strategy
passport.use(
    "local",
    new LocalStrategy(
        { usernameField: "email" }, // We use email, not a 'username'
        async (email, password, done) => {
            try {
                // 1 & 2. Validation and Lookup via Data Ops
                const user = await _userOps.getUserByEmail(email);
                if (!user) {
                    return done(null, false, { message: "Invalid credentials." });
                }
                console.log("User found:", user);

                // 3. Comparison
                const isMatch = await bcrypt.compare(password, user.passwordHash);

                // 4. Result
                if (!isMatch) {
                    console.log("Password does not match");
                    return done(null, false, { message: "Invalid credentials." });

                }

                console.log("Password matches");

                // Everything is perfect. Passport, here is the verified User!
                return done(null, user);
            } catch (error) {
                console.log("Error in passport.js:", error);
                return done(error);
            }
        },
    )
);

module.exports = passport;