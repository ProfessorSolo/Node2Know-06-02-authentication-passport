// /public/scripts/admin/projects.js

const list = document.querySelector(".js-projects-list");
if (!list) {
    // Script loaded on a page without the projects list — bail quietly.
    // (Keeps things simple for multi-page admin areas.)
} else {
    // DELETE (click)
    list.addEventListener("click", async (e) => {
        const btn = e.target.closest("button.project-delete");
        if (!btn) return;

        const li = btn.closest("li.js-project");
        const id = li?.dataset.id;
        if (!id) return;

        const ok = confirm("Delete this project?\n\nThis cannot be undone.");
        if (!ok) return;

        try {
            const res = await fetch(`/admin/projects/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json" },
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.message || "Delete failed.");
                return;
            }

            // This only runs if res.ok is true
            console.log("Project deleted successfully.");
            li.remove();
        } catch (err) {
            alert("Network error. Delete failed.");
        }
    });


}