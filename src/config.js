module.exports = {
    database: {
        // Backup settings
        backup: {
            enabled: true,
            directory: 'data',
            // Create backup on app close
            onClose: true,
            // Keep last 5 backups
            keepCount: 5
        }
    }
};