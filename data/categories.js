const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String }, // Optional context for the category
});

const Category = mongoose.model("Category", categorySchema);

class CategoryOps {
    async getAllCategories() {
        // We use .lean() to return plain JSON objects so we can freely attach the refCount property
        const categories = await Category.find({}).sort({ name: 1 }).lean();

        const Project = require('mongoose').model('Project');

        // Iterate through and attach the count
        for (let c of categories) {
            c.refCount = await Project.countDocuments({ categoryId: c._id });
        }

        return categories;
    }

    async getCategoryById(id) {
        return await Category.findById(id);
    }

    async createCategory(formData) {
        try {
            const category = new Category(formData);
            await category.save();
            return { success: true, category };
        } catch (error) {
            return { success: false, error, category: null };
        }
    }

    async updateCategoryById(id, updates) {
        try {
            const category = await Category.findById(id);
            if (!category) {
                return {
                    success: false,
                    category: null,
                    errorMessage: "Category not found.",
                };
            }

            category.slug = updates.slug;
            category.name = updates.name;
            category.description = updates.description;

            await category.save();
            return { success: true, category, errorMessage: "" };
        } catch (error) {
            return { success: false, category: null, errorMessage: "Update failed." };
        }
    }

    async deleteCategoryById(id) {
        // 1. Fetch the Project model dynamically to avoid circular dependencies
        const Project = require("mongoose").model("Project");

        // 2. Count any projects using this category
        const refCount = await Project.countDocuments({ categoryId: id });

        // 3. Reject deletion if attached to active projects
        if (refCount > 0) {
            return { success: false, message: "Cannot delete: category has assigned projects." };
        }

        // 4. Safe to proceed
        const deleted = await Category.findByIdAndDelete(id);
        return { success: !!deleted, message: "Category deleted." };
    }

    async getCategoryBySlug(slug) {
        return await Category.findOne({ slug });
    }
}

module.exports = new CategoryOps();