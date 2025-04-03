const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'data', 'crm.db');
    }

    // Initialize database
    async init(password) {
        return new Promise((resolve, reject) => {
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.createTables()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    // Create all tables
    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                company TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                role TEXT,
                status TEXT NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                details TEXT(300),
                value_eur REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES profiles(id)
            )`,
            `CREATE TABLE IF NOT EXISTS scheduled_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                date_time TEXT NOT NULL,
                type TEXT NOT NULL,
                reminder TEXT,
                details TEXT(300),
                value_eur REAL DEFAULT 0,
                completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES profiles(id)
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS profile_products (
                profile_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES profiles(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                PRIMARY KEY (profile_id, product_id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    // Helper method to run SQL commands
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this);
            });
        });
    }

    // Helper method to query SQL
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    // Helper method to get a single row
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // Close the database connection
    close() {
        if (this.db) {
            this.db.close();
        }
    }

    // Create a backup of the database
    async backup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '..', 'data', `crm_backup_${timestamp}.db`);
        
        return new Promise((resolve, reject) => {
            const backup = fs.createReadStream(this.dbPath)
                .pipe(fs.createWriteStream(backupPath));
            
            backup.on('finish', () => resolve(backupPath));
            backup.on('error', reject);
        });
    }
}

module.exports = new Database();