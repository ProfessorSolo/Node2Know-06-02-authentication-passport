const express = require("express");
const router = express.Router();
const _contactOps = require("../data/contacts");

router.get("/", (req, res) => {
    res.render("contact");
});

router.post("/", async (req, res) => {
    // Pass the raw body directly to our data layer
    const result = await _contactOps.createContact(req.body);

    if (result.success) {
        res.render("contact", { message: "Thanks for reaching out!" });
    } else {
        res.render("contact", { message: "Whoops, something went wrong." });
    }
});

module.exports = router;