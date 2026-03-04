const express = require("express");
const router = express.Router();
const _projectOps = require("../data/projects");
const _categoryOps = require("../data/categories");

router.get("/", async (req, res) => {
    // Extract parameters from the URL query string
    const searchTerm = req.query.q;
    const tagQuery = req.query.tag;

    let projects;

    if (searchTerm && tagQuery) {
        projects = await _projectOps.getProjectList(searchTerm);
        // Filter in memory since both queries are present
        projects = projects.filter(project =>
            project.tags.some(tag => tag.name === tagQuery)
        );
    } else if (tagQuery) {
        projects = await _projectOps.getProjectsByTag(tagQuery);
    } else {
        projects = await _projectOps.getProjectList(searchTerm);
    }

    res.render("project-list", { projects, searchTerm, activeTag: tagQuery });
});

// NEW: Display projects by category
router.get("/category/:slug", async (req, res) => {
    // 1. Find the Category by its slug
    const category = await _categoryOps.getCategoryBySlug(req.params.slug);

    if (!category) {
        return res.status(404).render("404");
    }

    // 2. Fetch all active projects belonging to this category
    const projects = await _projectOps.getProjectsByCategory(category._id);

    // 3. Render the view, passing both the category and the projects array
    res.render("project-by-category", { category, projects });
});

// Display a single project by slug
router.get("/:slug", async (req, res) => {
    const { slug } = req.params;
    const project = await _projectOps.getProjectBySlug(slug);

    if (project) {
        res.render("project-detail", { project });
    } else {
        res.status(404).render("404");
    }
});

module.exports = router;