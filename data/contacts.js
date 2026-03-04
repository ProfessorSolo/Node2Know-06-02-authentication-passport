const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    isRead: { type: Boolean, default: false },
    postedDate: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

class ContactOps {
    async createContact(formData) {
        try {
            const newContact = new Contact(formData);
            await newContact.save(); // Mongoose handles the insertion logic
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    // Admin functions
    async getAllContactsAdmin() {
        return await Contact.find({}).sort({ postedDate: -1 });
    }

    // NEW: Toggle read status
    async toggleContactRead(id) {
        // 1. Load
        const contact = await Contact.findById(id);

        // Guard
        if (!contact) return null;

        // 2. Modify
        contact.isRead = !contact.isRead;

        // 3. Save
        await contact.save();

        return contact;
    }

    // NEW: The core demolition logically isolated
    async deleteContactById(id) {
        return await Contact.findByIdAndDelete(id);
    }
}

module.exports = new ContactOps();