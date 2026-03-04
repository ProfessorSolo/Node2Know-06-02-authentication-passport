const mongoose = require("mongoose");

// A sub-schema explicitly designed to shape items inside an array
const projectImageSchema = new mongoose.Schema(
    {
        originalName: String,
        filename: String,
        altText: String, // Optional descriptive text
        caption: String, // Optional display string
        isFeatured: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
    }
);


// NEW: Define the Subdocument structure
const tagSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
    },
    { _id: false },
);

// 1. The Blueprint: Define fields and types
const projectSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: String,
    description: String,
    isActive: Boolean,

    // NEW: Embedded Data
    tags: [tagSchema],

    // RELATED DATA
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    projectImages: [projectImageSchema],

});

// 2. The Model: The constructor used to interact with the collection
const Project = mongoose.model("Project", projectSchema);

// 3. The Operations: Helper methods
class ProjectOps {


    // Get all active projects filtered by title or description (fuzzy search)
    async getProjectList(searchTerm = null) {
        let filter = { isActive: true };

        if (searchTerm) {
            // Check both fields using the $or operator and case-insensitive regex
            filter.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        return await Project.find(filter).populate("categoryId");
    }


    async getProjectBySlug(slug) {
        // We use findOne because we are searching by a custom field (slug)
        return await Project.findOne({ slug: slug, isActive: true }).populate("categoryId");
    }

    async getProjectsByTag(tagName) {
        // MongoDB knows to look inside the 'tags' array for any object whose 'name' property matches!
        return await Project.find({ "tags.name": tagName, isActive: true }).populate("categoryId");
    }

    async getProjectsByCategory(categoryId) {
        return await Project.find({ categoryId, isActive: true }).populate("categoryId");
    }

    // Admin methods

    async getAllProjects() {
        return await Project.find().populate("categoryId");
    }

    async createProject(formData) {
        try {
            // 1. Pass the data to the constructor
            const project = new Project(formData);

            // 2. Validate and write to the database
            await project.save();

            // 3. Return success and the newly generated document
            return { success: true, project };
        } catch (error) {
            // 4. Return failure, the error object, and null for the doc
            return { success: false, error, project: null };
        }
    }

    async getProjectById(id) {
        return await Project.findById(id).populate("categoryId");
    }

    async updateProjectById(id, updates) {
        try {
            // 1. Load the document
            const project = await Project.findById(id);

            // Guard: Deal with missing documents
            if (!project) {
                return {
                    success: false,
                    project: null,
                    errorMessage: "Project not found.", // Custom friendly message
                };
            }

            // 2. Modify properties individually
            project.title = updates.title;
            project.slug = updates.slug;
            project.description = updates.description;
            project.tags = updates.tags;
            project.categoryId = updates.categoryId;
            project.isActive = updates.isActive;


            // 3. Save (Validation triggers here)
            await project.save();

            return { success: true, project, errorMessage: "" };
        } catch (error) {
            // Guard: Deal with validation/schema errors
            return { success: false, project: null, errorMessage: "Update failed." };
        }
    }

    // Project deletion
    async deleteProjectById(id) {
        return await Project.findByIdAndDelete(id);
    }

    // NEW: Add Project Image to an Existing Project
    async addProjectImageToProject(projectId, file, metadata) {
        try {
            const project = await Project.findById(projectId);
            if (!project) return { success: false, errorMessage: "Project not found." };

            // If a file was uploaded, embed its metadata!
            if (file) {
                project.projectImages.push({
                    originalName: file.originalname,
                    filename: file.filename,
                    mimeType: file.mimetype,
                    size: file.size,
                    altText: metadata.altText,
                    caption: metadata.caption,
                    isFeatured: metadata.isFeatured === "true", // Checkbox cast to boolean
                });
            }

            await project.save();
            return { success: true, project };
        } catch (error) {
            return { success: false, error, errorMessage: "Failed to add projectImage." };
        }
    }

    async updateProjectImageMetadata(projectId, imageId, updates) {
        try {
            const project = await Project.findById(projectId);
            if (!project) return { success: false, errorMessage: "Project not found." };

            // Mongoose subdocument arrays give us a special .id() method!
            const image = project.projectImages.id(imageId);

            if (!image) return { success: false, errorMessage: "Image not found." };

            // Update the properties
            if (updates.altText !== undefined) image.altText = updates.altText;
            if (updates.caption !== undefined) image.caption = updates.caption;
            if (updates.isFeatured !== undefined) {
                // If we are featuring this image, we logically must un-feature all others!
                if (updates.isFeatured === true || updates.isFeatured === 'true') {
                    project.projectImages.forEach(img => img.isFeatured = false);
                }
                image.isFeatured = updates.isFeatured === true || updates.isFeatured === 'true';
            }

            // Saving the parent project automatically saves the modified subdocuments
            await project.save();
            return { success: true, project };
        } catch (error) {
            return { success: false, error, errorMessage: "Failed to update image." };
        }
    }

    async deleteProjectImage(projectId, imageId) {
        try {
            const project = await Project.findById(projectId);
            if (!project) return { success: false, errorMessage: "Project not found." };

            // Mongoose pulls the subdocument completely out of the array mapped in memory
            project.projectImages.pull(imageId);

            // Save the array back to MongoDB
            await project.save();

            return { success: true };
        } catch (error) {
            return { success: false, error, errorMessage: "Failed to delete projectImage." };
        }
    }

}

module.exports = new ProjectOps();
