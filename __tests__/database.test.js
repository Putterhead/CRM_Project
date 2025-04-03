const path = require('path');
const fs = require('fs');
const Database = require('../src/database');

describe('Database', () => {
    const testDbPath = path.join(__dirname, '..', 'data', 'test.db');
    
    // Clean up test database before each test
    beforeEach(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    // Clean up after all tests
    afterAll(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    test('should initialize database and create tables', async () => {
        await Database.init();
        expect(fs.existsSync(Database.dbPath)).toBe(true);
    });

    test('should create a new profile', async () => {
        await Database.init();
        
        const profile = {
            first_name: 'John',
            last_name: 'Doe',
            company: 'Test Corp',
            email: 'john@test.com',
            phone: '1234567890',
            status: 'Lead'
        };

        const result = await Database.run(
            'INSERT INTO profiles (first_name, last_name, company, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
            [profile.first_name, profile.last_name, profile.company, profile.email, profile.phone, profile.status]
        );

        expect(result.lastID).toBeDefined();
        
        const savedProfile = await Database.get('SELECT * FROM profiles WHERE id = ?', [result.lastID]);
        expect(savedProfile).toMatchObject(profile);
    });

    test('should create and retrieve a contact', async () => {
        await Database.init();
        
        // First create a profile
        const profileResult = await Database.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Jane', 'Smith', 'Customer']
        );

        const contact = {
            profile_id: profileResult.lastID,
            date: new Date().toISOString(),
            type: 'Meeting',
            details: 'Initial meeting',
            value_eur: 1000
        };

        const result = await Database.run(
            'INSERT INTO contacts (profile_id, date, type, details, value_eur) VALUES (?, ?, ?, ?, ?)',
            [contact.profile_id, contact.date, contact.type, contact.details, contact.value_eur]
        );

        expect(result.lastID).toBeDefined();
        
        const savedContact = await Database.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
        expect(savedContact).toMatchObject(contact);
    });

    test('should create backup successfully', async () => {
        await Database.init();
        
        // Add some test data
        await Database.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Test', 'User', 'Lead']
        );

        const backupPath = await Database.backup();
        expect(fs.existsSync(backupPath)).toBe(true);
        
        // Clean up backup file
        fs.unlinkSync(backupPath);
    });

    test('should handle database errors gracefully', async () => {
        await Database.init();
        
        // Try to insert invalid data (missing required field)
        await expect(Database.run(
            'INSERT INTO profiles (first_name) VALUES (?)',
            ['OnlyFirstName']
        )).rejects.toThrow();
    });
});