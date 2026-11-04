// Stores database backups as private objects in Netlify Blobs.
const { getStore } = require("@netlify/blobs");

const backupNamePattern = /^maan-backup-(manual|automatic|pre-restore)-[0-9TZ-]+\.json$/;

function store() {
    return getStore({ name: "database-backups", consistency: "strong" });
}

function safeBackupName(filename) {
    return typeof filename === "string" && backupNamePattern.test(filename);
}

function typeFromName(name) {
    return name.startsWith("maan-backup-pre-restore-") ? "pre-restore" : name.split("-")[2];
}

async function createRemoteBackup(database, type) {
    if (!["manual", "automatic", "pre-restore"].includes(type)) {
        throw new Error("Backup type is not supported.");
    }
    const createdAt = new Date().toISOString();
    const filename = `maan-backup-${type}-${createdAt.replace(/[:.]/g, "-")}.json`;
    const text = JSON.stringify(database, null, 2);
    const size = Buffer.byteLength(text, "utf8");
    await store().set(filename, text, { metadata: { type, createdAt, size } });
    return { filename, type, createdAt, size };
}

async function listRemoteBackups() {
    const { blobs } = await store().list();
    const items = await Promise.all(
        blobs
            .filter(blob => safeBackupName(blob.key))
            .map(async blob => {
                const meta = await store().getMetadata(blob.key);
                const metadata = (meta && meta.metadata) || {};
                return {
                    filename: blob.key,
                    type: metadata.type || typeFromName(blob.key),
                    createdAt: metadata.createdAt || "",
                    size: Number(metadata.size) || 0
                };
            })
    );
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getRemoteBackup(filename) {
    if (!safeBackupName(filename)) return null;
    const data = await store().get(filename, { type: "arrayBuffer" });
    return data ? Buffer.from(data) : null;
}

module.exports = { safeBackupName, createRemoteBackup, listRemoteBackups, getRemoteBackup };
