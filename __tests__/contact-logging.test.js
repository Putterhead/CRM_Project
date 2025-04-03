const path = require('path');
const fs = require('fs');
const Database = require('../src/database');

describe('Contact Logging Tests', () => {
    let db;
    const testDbPath = path.join(__dirname, '..', 'data', 'test.db');
    let testProfileId;

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

        // Create a test profile
        const result = await db.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Test', 'User', 'Lead']
        );
        testProfileId = result.lastID;
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

    describe('Database Operations', () => {
        test('should create a new contact', async () => {
            const contact = {
                profile_id: testProfileId,
                date: new Date().toISOString(),
                type: 'Call',
                details: 'Test contact',
                value_eur: 100
            };

            const result = await db.run(
                'INSERT INTO contacts (profile_id, date, type, details, value_eur) VALUES (?, ?, ?, ?, ?)',
                [contact.profile_id, contact.date, contact.type, contact.details, contact.value_eur]
            );

            expect(result.lastID).toBeDefined();

            const savedContact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
            expect(savedContact).toMatchObject(contact);
        });

        test('should retrieve contacts in descending date order', async () => {
            const dates = [
                '2025-01-01',
                '2025-01-02',
                '2025-01-03'
            ];

            for (const date of dates) {
                await db.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [testProfileId, date, 'Call', 'Test contact']
                );
            }

            const contacts = await db.all(
                'SELECT * FROM contacts WHERE profile_id = ? ORDER BY date DESC',
                [testProfileId]
            );

            expect(contacts).toHaveLength(3);
            expect(contacts[0].date).toBe('2025-01-03');
            expect(contacts[2].date).toBe('2025-01-01');
        });
    });

    describe('Data Validation', () => {
        test('should enforce 300 character limit on details', async () => {
            const longDetails = 'a'.repeat(301);
            
            await expect(db.run(
                'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                [testProfileId, new Date().toISOString(), 'Call', longDetails]
            )).rejects.toThrow();
        });

        test('should require valid profile_id', async () => {
            const invalidProfileId = 999999;
            
            await expect(db.run(
                'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                [invalidProfileId, new Date().toISOString(), 'Call', 'Test contact']
            )).rejects.toThrow();
        });

        test('should handle empty optional fields', async () => {
            const contact = {
                profile_id: testProfileId,
                date: new Date().toISOString(),
                type: 'Call',
                details: 'Test contact'
            };

            const result = await db.run(
                'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                [contact.profile_id, contact.date, contact.type, contact.details]
            );

            expect(result.lastID).toBeDefined();

            const savedContact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
            expect(savedContact.value_eur).toBe(0);
        });
    });

    describe('Contact History', () => {
        test('should retrieve full contact history for a profile', async () => {
            const contacts = [
                { type: 'Call', details: 'First contact', date: '2025-01-01' },
                { type: 'Email', details: 'Follow-up', date: '2025-01-02' },
                { type: 'Meeting', details: 'In-person', date: '2025-01-03' }
            ];

            for (const contact of contacts) {
                await db.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [testProfileId, contact.date, contact.type, contact.details]
                );
            }

            const history = await db.all(
                'SELECT * FROM contacts WHERE profile_id = ? ORDER BY date ASC',
                [testProfileId]
            );

            expect(history).toHaveLength(3);
            expect(history[0].type).toBe('Call');
            expect(history[1].type).toBe('Email');
            expect(history[2].type).toBe('Meeting');
        });
    });
});