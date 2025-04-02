const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const database = require('./src/database')

console.log('Starting application...')

let mainWindow = null;

function createWindow () {
    console.log('Creating window...')
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true,
            additionalArguments: [`--app-path=${app.getAppPath()}`]
        }
    })

    mainWindow.loadFile('index.html')
    console.log('Window created and loaded')

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools()
    }

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// Initialize database when app is ready
app.whenReady().then(async () => {
    console.log('App is ready, initializing database...')
    try {
        await database.init()
        console.log('Database initialized successfully')
        createWindow()

        // Handle database operations from renderer
        ipcMain.handle('database-operation', async (event, { operation, sql, params }) => {
            try {
                return await database[operation](sql, params);
            } catch (error) {
                console.error('Database operation error:', error);
                throw error;
            }
        });

    } catch (error) {
        console.error('Failed to initialize database:', error)
        app.quit()
    }
})

// Handle window activation
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Handle all windows closed
app.on('window-all-closed', () => {
    console.log('All windows closed')
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Create backup and close database before quitting
app.on('before-quit', async (event) => {
    event.preventDefault()
    console.log('Application is quitting, creating backup...')
    try {
        await database.backup()
        database.close()
        console.log('Backup created and database closed')
        process.exit(0)
    } catch (error) {
        console.error('Error during backup:', error)
        process.exit(1)
    }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    if (mainWindow) {
        mainWindow.webContents.send('error', error.message)
    }
})