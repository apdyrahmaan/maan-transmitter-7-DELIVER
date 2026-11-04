// Copies only the public browser assets into dist/ for Netlify.
// Server-side files (auth.js, database.js, backups.js, etc.) and local data
// are intentionally excluded so they are never published as static files.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const publicFiles = ["index.html", "style.css", "app.js"];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of publicFiles) {
    const source = path.join(root, file);
    if (!fs.existsSync(source)) {
        console.error(`Missing required public file: ${file}`);
        process.exit(1);
    }
    fs.copyFileSync(source, path.join(dist, file));
    console.log(`Copied ${file} -> dist/${file}`);
}

console.log("Netlify public assets prepared in dist/");
