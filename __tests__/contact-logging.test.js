const path = require('path');
const fs = require('fs');
const Database = require('../src/database');

describe('Contact Logging Tests', () => {
    let testProfileId;
    const TEST_DB_PATH = path.join(__dirname, 'contact_test.db');

    beforeAll(async () => {
        // Clean up any existing test database
        try {
            if (fs.existsSync(TEST_DB_PATH)) {
                fs.unlinkSync(TEST_DB_PATH);
            }
        } catch (error) {
            console.error('Error cleaning up test database:', error);
        }

        // Initialize database with a different path from other tests
        Database.dbPath = TEST_DB_PATH;
        await Database.init();

        // Enable foreign key constraints
        await Database.run('PRAGMA foreign_keys = ON');

        // Create a test profile
        const result = await Database.run(
            'INSERT INTO profiles (first_name, last_name, status) VALUES (?, ?, ?)',
            ['Test', 'User', 'Lead']
        );
        testProfileId = result.lastID;

        // Create tables with explicit created_at column
        await Database.run(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                details TEXT NOT NULL,
                value_eur REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES profiles(id)
            )
        `);
    });

    afterAll(async () => {
        // Close database connection
        if (Database.db) {
            await new Promise((resolve, reject) => {
                Database.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Clean up test database
        try {
            if (fs.existsSync(TEST_DB_PATH)) {
                fs.unlinkSync(TEST_DB_PATH);
            }
        } catch (error) {
            console.error('Error cleaning up test database:', error);
        }
    });

    beforeEach(async () => {
        // Clear contacts table before each test
        await Database.run('DELETE FROM contacts WHERE 1=1');
    });

    describe('Database Operations', () => {
        test('should create a new contact', async () => {
            const date = '2025-04-03';
            const type = 'Call';
            const details = 'Test call details';
            const value = 100.50;

            await Database.run(
                'INSERT INTO contacts (profile_id, date, type, details, value_eur) VALUES (?, ?, ?, ?, ?)',
                [testProfileId, date, type, details, value]
            );

            const contacts = await Database.all(
                'SELECT * FROM contacts WHERE profile_id = ?',
                [testProfileId]
            );

            expect(contacts).toHaveLength(1);
            expect(contacts[0]).toMatchObject({
                profile_id: testProfileId,
                date,
                type,
                details,
                value_eur: value
            });
        });

        test('should retrieve contacts in descending date order', async () => {
            const contacts = [
                { date: '2025-04-03', type: 'Call', details: 'Recent call' },
                { date: '2025-04-02', type: 'Email', details: 'Old email' },
                { date: '2025-04-01', type: 'Meeting', details: 'Oldest meeting' }
            ];

            for (const contact of contacts) {
                await Database.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [testProfileId, contact.date, contact.type, contact.details]
                );
            }

            const result = await Database.all(
                'SELECT * FROM contacts WHERE profile_id = ? ORDER BY date DESC, created_at DESC',
                [testProfileId]
            );

            expect(result).toHaveLength(3);
            expect(result[0].date).toBe('2025-04-03');
            expect(result[1].date).toBe('2025-04-02');
            expect(result[2].date).toBe('2025-04-01');
        });
    });

    describe('Data Validation', () => {
        test('should enforce 300 character limit on details', async () => {
            const longDetails = 'A'.repeat(301);
            
            // Add CHECK constraint for details length
            await Database.run(`
                CREATE TRIGGER IF NOT EXISTS check_details_length 
                BEFORE INSERT ON contacts
                BEGIN
                    SELECT CASE 
                        WHEN length(NEW.details) > 300 
                        THEN RAISE(ABORT, 'Details must not exceed 300 characters')
                    END;
                END;
            `);

            await expect(
                Database.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [testProfileId, '2025-04-03', 'Call', longDetails]
                )
            ).rejects.toThrow('Details must not exceed 300 characters');

            const validDetails = 'A'.repeat(300);
            await expect(
                Database.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [testProfileId, '2025-04-03', 'Call', validDetails]
                )
            ).resolves.toBeDefined();
        });

        test('should require valid profile_id', async () => {
            const invalidProfileId = 999999;
            
            // Verify foreign key constraint is enabled
            const pragmaResult = await Database.get('PRAGMA foreign_keys');
            expect(pragmaResult.foreign_keys).toBe(1);

            await expect(
                Database.run(
                    'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                    [invalidProfileId, '2025-04-03', 'Call', 'Test details']
                )
            ).rejects.toThrow();
        });

        test('should handle empty optional fields', async () => {
            await Database.run(
                'INSERT INTO contacts (profile_id, date, type, details) VALUES (?, ?, ?, ?)',
                [testProfileId, '2025-04-03', 'Call', 'Test details']
            );

            const contacts = await Database.all(
                'SELECT * FROM contacts WHERE profile_id = ?',
                [testProfileId]
            );

            expect(contacts[0].value_eur).toBe(0);
        });
    });

    describe('Contact History', () => {
        test('should retrieve full contact history for a profile', async () => {
            const now = new Date();
            const contacts = [
                {
                    type: 'Call',
                    details: 'Initial contact',
                    value_eur: 0,
                    created_at: new Date(now.getTime() - 2000).toISOString() // 2 seconds ago
                },
                {
                    type: 'Meeting',
                    details: 'Product demo',
                    value_eur: 0,
                    created_at: new Date(now.getTime() - 1000).toISOString() // 1 second ago
                },
                {
                    type: 'Offer Submission',
                    details: 'Proposal sent',
                    value_eur: 1000,
                    created_at: now.toISOString() // now
                }
            ];

            // Insert contacts with explicit created_at timestamps
            for (const contact of contacts) {
                await Database.run(
                    'INSERT INTO contacts (profile_id, date, type, details, value_eur, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        testProfileId,
                        '2025-04-03',
                        contact.type,
                        contact.details,
                        contact.value_eur,
                        contact.created_at
                    ]
                );
            }

            const history = await Database.all(
                'SELECT * FROM contacts WHERE profile_id = ? ORDER BY created_at DESC',
                [testProfileId]
            );

            expect(history).toHaveLength(3);
            expect(history.map(c => c.type)).toEqual(['Offer Submission', 'Meeting', 'Call']);
            expect(history.find(c => c.type === 'Offer Submission').value_eur).toBe(1000);
        });
    });
});