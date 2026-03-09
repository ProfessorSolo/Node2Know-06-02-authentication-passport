function requireAuth(req, res, next) {
    // If Passport confirms identity, allow them to proceed to the controller
    if (req.isAuthenticated?.() && req.user) {
        return next();
    }

    // If anonymous, aggressively divert them to the public login gate
    console.log("User is not authenticated");
    console.log("req.isAuthenticated(): ", req.isAuthenticated());
    console.log("req.user: ", req.user);
    console.log("req.session: ", req.session);
    console.log("requested URL: ", req.originalUrl);
    return res.redirect("/admin/login");
}

module.exports = { requireAuth };