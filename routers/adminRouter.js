const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../middleware/uploads");
const { requireAuth } = require("../middleware/auth");
const _contactOps = require("../data/contacts");
const _projectOps = require("../data/projects");
const _categoryOps = require("../data/categories");
const _userOps = require("../data/users");



// AUTH ROUTES

// Render the visual EJS Form
router.get("/register", (req, res) => {
    res.render("admin/register", { error: null });
});

// Handle the Form POST submission
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    // 1. Validation basics
    if (!email || !password) return res.status(400).send("Bad Payload");

    try {
        // 2. Execute Data Operation
        await _userOps.createUser(email, password);

        // 3. Divert to Login
        res.redirect("/admin/login");
    } catch (error) {
        if (error.message === "Email_In_Use") {
            return res
                .status(409)
                .render("admin/register", { error: "Email already in use." });
        }
        console.log("Error creating user:", error);
        return res.status(500).send("Internal Error");
    }
});

// Render the visual EJS Login Form
router.get("/login", (req, res) => {
    res.render("admin/login", { error: null });
});

// Handle the Login submission
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/admin", // 5. Redirection on Success
        failureRedirect: "/admin/login",
    }),
);

// LOGOUT
router.get("/logout", (req, res, next) => {
    // 1. Invalidate Passport authentication context
    req.logout((err) => {
        if (err) return next(err);

        // 2. Destroy the underlying structural session entirely
        req.session.destroy((err) => {
            // Clear cookie explicitly via its specific assigned configuration name.
            res.clearCookie("connect.sid");

            // 3. Diversion
            res.redirect("/admin/login");
        });
    });
});

// PROTECTED ROUTES
router.use(requireAuth);

// ADMIN DASHBOARD ROUTE
router.get("/", async (req, res) => {
    res.render("admin/index");
});

// CONTACT ROUTES

// Admin: contacts inbox page
router.get("/contacts", async (req, res) => {
    const contacts = await _contactOps.getAllContactsAdmin();
    res.render("admin/contacts/index", { contacts });
});

// Admin: toggle contact read status
router.patch("/contacts/:id/read", async (req, res) => {
    const { id } = req.params;

    const updated = await _contactOps.toggleContactRead(id);

    if (!updated) {
        return res.status(404).json({ message: "Contact not found." });
    }

    res.json({ message: "Contact updated.", updated });
});

// Admin: delete a contact submission by id
router.delete("/contacts/:id", async (req, res) => {
    console.log("Delete request received for ID:", req.params.id);
    // 1. Extract the parameters
    const { id } = req.params;

    // 2. Perform the operation via our Ops layer
    const deleted = await _contactOps.deleteContactById(id);

    // 3. Handle the 'null' (Not Found) state
    if (!deleted) {
        return res.status(404).json({ message: "Contact submission not found." });
    }

    // 4. Return success
    res.json({ message: "Contact deleted.", deletedId: id });
});

// NEW: PROJECT IMAGE ROUTES
// GET: Render the Image Gallery View
router.get("/projects/:projectId/images", async (req, res) => {
    const { projectId } = req.params;
    const project = await _projectOps.getProjectById(projectId);

    if (!project) {
        return res.redirect("/admin/projects");
    }

    res.render("admin/projects/project-image-form", { project });
});

// POST: Add Project Image to an Existing Project
router.post(
    "/projects/:projectId/images",
    upload.single("projectImage"),
    async (req, res) => {
        const { projectId } = req.params;
        const { altText, caption, isFeatured } = req.body;

        // The file is automatically placed on req.file by multer
        if (!req.file) {
            // If no file was sent, simply redirect back to the gallery
            return res.redirect(`/admin/projects/${projectId}/images`);
        }

        const result = await _projectOps.addProjectImageToProject(
            projectId,
            req.file,
            { altText, caption, isFeatured }, // Pass the metadata
        );

        if (!result.success) {
            console.log("Error saving projectImage metadata: ", result.error);
        }

        // Redirect back to the gallery to see the new image
        res.redirect(`/admin/projects/${projectId}/images`);
    },
);

// PATCH: Update Image Metadata
router.patch("/projects/:projectId/images/:imageId", async (req, res) => {
    const { projectId, imageId } = req.params;
    const updates = {
        altText: req.body.altText,
        caption: req.body.caption,
        isFeatured: req.body.isFeatured,
    };

    const result = await _projectOps.updateProjectImageMetadata(
        projectId,
        imageId,
        updates,
    );

    if (!result.success) {
        return res
            .status(400)
            .json({ success: false, errorMessage: result.errorMessage });
    }

    // Respond with JSON instead of a redirect!
    res.json({ success: true, message: "Metadata updated successfully!" });
});

// DELETE: Delete Project Image
router.delete("/projects/:projectId/images/:imageId", async (req, res) => {
    const { projectId, imageId } = req.params;
    const result = await _projectOps.deleteProjectImage(projectId, imageId);

    // We simply inform the frontend script of the success
    res.json({ success: result.success, error: result.errorMessage });
});

// PROJECT ROUTES

// Helper function to parse tags from a comma-separated string
function parseTags(tagsText) {
    if (!tagsText) return [];
    return tagsText
        .split(",") // Break the text by the commas
        .map((t) => t.trim()) // Remove any whitespace padding
        .filter(Boolean) // Filter out any empty items from trailing commas
        .map((t) => ({ name: t })); // Wrap the string into {name: "string"}
}



// GET: show all projects (active and inactive)
router.get("/projects", async (req, res) => {
    const projects = await _projectOps.getAllProjects();
    res.render("admin/projects/index", { projects });
});

// GET: show empty create project form
router.get("/projects/new", async (req, res) => {
    const categories = await _categoryOps.getAllCategories();

    res.render("admin/projects/project-form", {
        project_id: null,
        project: null,
        categories,
        errorMessage: "",
    });
});

// POST: handle create project form submission
router.post("/projects", async (req, res) => {
    // 1. Parse the incoming body
    const formData = {
        title: req.body.title,
        slug: req.body.slug,
        description: req.body.description,
        tags: parseTags(req.body.tags),
        categoryId: req.body.categoryId, // NEW
        isActive: req.body.isActive === "true", // Radio returns a string "true" or "false"
    };

    const result = await _projectOps.createProject(formData);

    if (!result.success) {
        // If it fails, send the form back with the data they entered so they don't lose it
        const categories = await _categoryOps.getAllCategories();

        return res.render("admin/projects/project-form", {
            project_id: null,
            project: formData,
            tags: formData.tags.map(t => t.name).join(", "), // NEW
            categories, // NEW
            errorMessage: "Error. Unable to create project.",
        });
    }

    res.redirect("/admin/projects");
});

// GET: show populated edit project form
router.get("/projects/:id/edit", async (req, res) => {
    const { id } = req.params;

    // Retrieve the document
    const project = await _projectOps.getProjectById(id);

    // Guard clause against bad IDs
    if (!project) return res.status(404).render("404");

    const categories = await _categoryOps.getAllCategories();

    res.render("admin/projects/project-form", {
        project_id: id,
        project,
        tags: project.tags.map(t => t.name).join(", "), // NEW
        categories, // NEW
        errorMessage: "",
    });
});

// POST: handle edit project form submission
router.post("/projects/:id", async (req, res) => {
    const { id } = req.params;

    console.log("body", req.body);

    const updates = {
        title: req.body.title,
        slug: req.body.slug,
        description: req.body.description,
        tags: parseTags(req.body.tags), // NEW
        categoryId: req.body.categoryId, // NEW
        isActive: req.body.activeState === "active",
    };

    console.log("updates", updates);

    const result = await _projectOps.updateProjectById(id, updates);

    if (!result.success) {
        const categories = await _categoryOps.getAllCategories();

        return res.render("admin/projects/project-form", {
            project_id: id,
            project: result.project || updates, // keep whatever data they submitted
            categories, // NEW
            errorMessage: result.errorMessage || "Error. Unable to update project.",
        });
    }

    res.redirect("/admin/projects");
});

// Admin: delete a project by id
router.delete("/projects/:id", async (req, res) => {
    console.log("Delete request received for ID:", req.params.id);
    // 1. Extract the parameters
    const { id } = req.params;

    // 2. Perform the operation via our Ops layer
    const deleted = await _projectOps.deleteProjectById(id);

    // 3. Handle the 'null' (Not Found) state
    if (!deleted) {
        return res.status(404).json({ message: "Project not found." });
    }

    // 4. Return success
    res.json({ message: "Project deleted.", deletedId: id });
});

// CATEGORY ROUTES

// GET: show all categories
router.get("/categories", async (req, res) => {
    const categories = await _categoryOps.getAllCategories();
    res.render("admin/categories/index", { categories });
});

// GET: show empty create category form
router.get("/categories/new", (req, res) => {
    res.render("admin/categories/category-form", {
        category_id: null,
        category: null,
        errorMessage: "",
    });
});

// POST: handle create category form submission
router.post("/categories", async (req, res) => {
    const formData = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
    };

    const result = await _categoryOps.createCategory(formData);

    if (!result.success) {
        return res.render("admin/categories/category-form", {
            category_id: null,
            category: formData,
            errorMessage: "Error. Unable to create category.",
        });
    }

    res.redirect("/admin/categories");
});

// GET: show populated edit category form
router.get("/categories/:id/edit", async (req, res) => {
    const { id } = req.params;
    const category = await _categoryOps.getCategoryById(id);

    if (!category) return res.status(404).render("404");

    res.render("admin/categories/category-form", {
        category_id: id,
        category,
        errorMessage: "",
    });
});

// POST: handle edit category form submission
router.post("/categories/:id", async (req, res) => {
    const { id } = req.params;
    const updates = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
    };

    const result = await _categoryOps.updateCategoryById(id, updates);

    if (!result.success) {
        return res.render("admin/categories/category-form", {
            category_id: id,
            category: result.category || updates,
            errorMessage: result.errorMessage || "Error. Unable to update category.",
        });
    }

    res.redirect("/admin/categories");
});

// DELETE: delete a category by id
router.delete("/categories/:id", async (req, res) => {
    const { id } = req.params;
    const result = await _categoryOps.deleteCategoryById(id);

    if (!result.success) {
        // Return a 400 Bad Request if the deletion check failed
        return res.status(400).json({ message: result.message });
    }

    res.json({ message: result.message, deletedId: id });
});

module.exports = router;