const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'crm.db');
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    // Enable foreign keys and WAL mode for better concurrency
                    await this.run('PRAGMA foreign_keys = ON');
                    await this.run('PRAGMA journal_mode = WAL');

                    // Create profiles table with unique constraint
                    await this.run(`
                        CREATE TABLE IF NOT EXISTS profiles (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            first_name TEXT NOT NULL,
                            last_name TEXT NOT NULL,
                            company TEXT DEFAULT '',
                            email TEXT,
                            phone TEXT,
                            status TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE(first_name, last_name, company)
                        )
                    `);

                    // Create contacts table with details length constraint
                    await this.run(`
                        CREATE TABLE IF NOT EXISTS contacts (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            profile_id INTEGER NOT NULL,
                            date TEXT NOT NULL,
                            type TEXT NOT NULL,
                            details TEXT NOT NULL CHECK(length(details) <= 300),
                            value_eur REAL DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (profile_id) REFERENCES profiles(id)
                        )
                    `);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        this.db = null;
                        resolve();
                    }
                });
            });
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async backup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(path.dirname(this.dbPath), `crm_backup_${timestamp}.db`);
        
        return new Promise((resolve, reject) => {
            const backup = fs.createWriteStream(backupPath);
            const tables = [];
            const tableData = new Map();

            this.db.serialize(() => {
                // First get all table schemas
                this.db.each('SELECT * FROM sqlite_master WHERE type="table"', [], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (row.type === 'table') {
                        tables.push(row.name);
                        tableData.set(row.name, { schema: row.sql, rows: [] });
                    }
                }, async (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    try {
                        // Then get all data for each table
                        for (const table of tables) {
                            const rows = await this.all(`SELECT * FROM ${table}`);
                            tableData.get(table).rows = rows;
                        }

                        // Write everything to the backup file
                        for (const table of tables) {
                            const data = tableData.get(table);
                            backup.write(data.schema + ';\n');
                            
                            for (const row of data.rows) {
                                const values = Object.values(row).map(v => 
                                    typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
                                );
                                backup.write(`INSERT INTO ${table} VALUES (${values.join(',')});\n`);
                            }
                        }

                        backup.end();
                        this.cleanupOldBackups();
                        resolve(backupPath);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        });
    }

    async cleanupOldBackups() {
        const dataDir = path.dirname(this.dbPath);
        const files = fs.readdirSync(dataDir);
        
        // Get all backup files and their stats
        const backupFiles = files
            .filter(file => file.startsWith('crm_backup_'))
            .map(file => ({
                name: file,
                path: path.join(dataDir, file),
                created: fs.statSync(path.join(dataDir, file)).birthtime
            }))
            .sort((a, b) => b.created - a.created); // Sort by newest first

        // Keep only the 5 most recent backups
        const filesToDelete = backupFiles.slice(5);
        
        for (const file of filesToDelete) {
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error(`Error deleting old backup: ${file.path}`, error);
            }
        }
    }

    async findDuplicateProfile(profile) {
        const { first_name, last_name, company = '' } = profile;
        const existingProfile = await this.get(
            'SELECT * FROM profiles WHERE first_name = ? AND last_name = ? AND company = ?',
            [first_name, last_name, company]
        );
        return existingProfile;
    }
}

module.exports = Database;