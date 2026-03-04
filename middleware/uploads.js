const fs = require("fs");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 1. Grab the slug from the query string (or fallback)
        const slug = req.query.slug || "uncategorized";

        // 2. Define the project-specific path
        const dir = `./public/uploads/${slug}`;

        // 3. Create the directory if it doesn't exist yet
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 4. Tell Multer to save the file here
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safeBase = path
            .basename(file.originalname, path.extname(file.originalname))
            .toLowerCase()
            .replace(/[^a-z0-9\-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        const unique = Date.now();
        cb(null, `${safeBase}-${unique}${path.extname(file.originalname)}`);
    },
});

function fileFilter(req, file, cb) {
    // Keep it simple: images only
    if (!file.mimetype.startsWith("image/")) return cb(null, false);
    cb(null, true);
}

const upload = multer({ storage, fileFilter });

module.exports = upload;