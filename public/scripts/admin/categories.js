const deleteButtons = document.querySelectorAll(".category-delete");

deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();

        // The button disables natively in ejs, but just in case:
        if (btn.hasAttribute("disabled")) return;

        if (!confirm("Are you sure you want to delete this category?")) return;

        // We stored the database ID on the <li> wrapper
        const categoryItem = e.target.closest(".js-category");
        const categoryId = categoryItem.dataset.id;

        try {
            const response = await fetch(`/admin/categories/${categoryId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete category");
            }

            // Success! Remove the category from the UI
            categoryItem.remove();
        } catch (error) {
            alert(error.message);
        }
    });
});