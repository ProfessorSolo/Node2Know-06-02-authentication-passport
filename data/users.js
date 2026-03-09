const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");


const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

class UserOps {



    async createUser(name, email, password) {
        console.log("Creating user with name:", name);
        console.log("Creating user with email:", email);
        console.log("Creating user with password:", password);
        // 1. Uniqueness Check
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("Email_In_Use");
        }

        // 2. Hash the raw password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Insert Record
        const user = new User({ name, email, passwordHash });
        await user.save();
        return user;
    }

    async getUserByEmail(email) {
        return await User.findOne({ email });
    }

    async getUserById(id) {
        return await User.findById(id);
    }
}

module.exports = new UserOps();