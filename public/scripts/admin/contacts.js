// /public/scripts/admin/contacts.js

const list = document.querySelector(".js-contacts-list");
if (!list) {
    // Script loaded on a page without the contacts list — bail quietly.
    // (Keeps things simple for multi-page admin areas.)
} else {
    // DELETE (click)
    list.addEventListener("click", async (e) => {
        const btn = e.target.closest("button.contact-delete");
        if (!btn) return;

        const li = btn.closest("li.js-contact");
        const id = li?.dataset.id;
        if (!id) return;

        const ok = confirm("Delete this contact submission?\n\nThis cannot be undone.");
        if (!ok) return;

        try {
            const res = await fetch(`/admin/contacts/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json" },
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.message || "Delete failed.");
                return;
            }

            li.remove();
        } catch (err) {
            alert("Network error. Delete failed.");
        }
    });

    // READ/UNREAD (radio change)
    list.addEventListener("change", async (e) => {
        const input = e.target.closest("input.contact-toggle-read");
        if (!input) return;

        const li = input.closest("li.js-contact");
        const id = li?.dataset.id;
        if (!id) return;

        const isRead = input.value === "read";

        try {
            const res = await fetch(`/admin/contacts/${id}/read`, {
                method: "PATCH",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.message || "Update failed.");
                window.location.reload();
                return;
            }

            // Optional: update the pill in-row for instant UX feedback
            const pill = li.querySelector(".js-read-pill");
            if (pill) {
                pill.textContent = isRead ? "Read" : "Unread";
                pill.classList.toggle("pill-read", isRead);
                pill.classList.toggle("pill-unread", !isRead);
            }
        } catch (err) {
            alert("Network error. Update failed.");
            window.location.reload();
        }
    });
}