const path = require('path');
const fs = require('fs');
const Database = require('../src/database');

describe('Database', () => {
    let db;
    const testDbPath = path.join(__dirname, '..', 'data', 'test.db');
    
    beforeAll(() => {
        // Ensure data directory exists
        const dataDir = path.dirname(testDbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    });

    beforeEach(async () => {
        // Clean up any existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Create a new database instance for each test
        db = new Database();
        db.dbPath = testDbPath;
        await db.init();
    });

    afterEach(async () => {
        // Clean up after each test
        if (db) {
            await db.run('DELETE FROM contacts WHERE 1=1');
            await db.run('DELETE FROM profiles WHERE 1=1');
            await db.close();
        }
    });

    afterAll(() => {
        // Final cleanup
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    test('should initialize database and create tables', async () => {
        expect(fs.existsSync(db.dbPath)).toBe(true);
    });

    test('should create a new profile', async () => {
        const profile = {
            first_name: 'John',
            last_name: 'Doe',
            company: 'Test Corp',
            email: 'john@test.com',
            phone: '1234567890',
            status: 'Lead'
        };

        const result = await db.run(
            'INSERT INTO profiles (first_name, last_name, company, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
            [profile.first_name, profile.last_name, profile.company, profile.email, profile.phone, profile.status]
        );

        expect(result.lastID).toBeDefined();
        
        const savedProfile = await db.get('SELECT * FROM profiles WHERE id = ?', [result.lastID]);
        expect(savedProfile).toMatchObject(profile);
    });

    test('should prevent duplicate profiles', async () => {
        const profile = {
            first_name: 'John',
            last_name: 'Doe',
            company: 'Test Corp',
            status: 'Lead'
        };

        // Create first profile
        await db.run(
            'INSERT INTO profiles (first_name, last_name, company, status) VALUES (?, ?, ?, ?)',
            [profile.first_name, profile.last_name, profile.company, profile.status]
        );

        // Try to create duplicate profile
        await expect(
            db.run(
                'INSERT INTO profiles (first_name, last_name, company, status) VALUES (?, ?, ?, ?)',
                [profile.first_name, profile.last_name, profile.company, profile.status]
            )
        ).rejects.toThrow('SQLITE_CONSTRAINT');

        // Check duplicate detection
        const isDuplicate = await db.findDuplicateProfile(profile);
        expect(isDuplicate).toBeTruthy();
    });

    test('should create and retrieve a contact', async () => {
        // Create a test profile first
        const profileResult = await db.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Test', 'User', 'Lead']
        );

        const contact = {
            profile_id: profileResult.lastID,
            date: new Date().toISOString(),
            type: 'Meeting',
            details: 'Initial meeting',
            value_eur: 1000
        };

        const result = await db.run(
            'INSERT INTO contacts (profile_id, date, type, details, value_eur) VALUES (?, ?, ?, ?, ?)',
            [contact.profile_id, contact.date, contact.type, contact.details, contact.value_eur]
        );

        expect(result.lastID).toBeDefined();
        
        const savedContact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
        expect(savedContact).toMatchObject(contact);
    });

    test('should create backup successfully', async () => {
        // Add some test data
        await db.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Test', 'User', 'Lead']
        );

        const backupPath = await db.backup();
        expect(fs.existsSync(backupPath)).toBe(true);
        
        // Clean up backup file
        fs.unlinkSync(backupPath);
    });

    test('should handle database errors gracefully', async () => {
        // Try to insert invalid data (missing required field)
        await expect(
            db.run(
                'INSERT INTO profiles (first_name) VALUES (?)',
                ['OnlyFirstName']
            )
        ).rejects.toThrow();
    });
});