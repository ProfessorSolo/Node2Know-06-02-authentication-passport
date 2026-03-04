function requireAuth(req, res, next) {
    // If Passport confirms identity, allow them to proceed to the controller
    if (req.isAuthenticated?.() && req.user) {
        return next();
    }

    // If anonymous, aggressively divert them to the public login gate
    return res.redirect("/admin/login");
}

module.exports = { requireAuth };