const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

let mainWindow;
let todoFilePath;

function createWindow(filePath) {
  todoFilePath = path.resolve(filePath);
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'default',
    title: `Neptune - ${path.basename(todoFilePath)}`
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Watch for file changes
  const watcher = chokidar.watch(todoFilePath);
  watcher.on('change', () => {
    mainWindow.webContents.send('file-changed');
  });

  mainWindow.on('closed', () => {
    watcher.close();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('No .todo file specified');
    app.quit();
    return;
  }
  
  // Create file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({
      tasks: [],
      completed: [],
      skipped: []
    }, null, 2));
  }
  
  createWindow(filePath);
});

app.on('window-all-closed', () => {
  app.quit();
});

// IPC handlers
ipcMain.handle('read-todo-file', () => {
  try {
    const content = fs.readFileSync(todoFilePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { tasks: [], completed: [], skipped: [] };
  }
});

ipcMain.handle('write-todo-file', (event, data) => {
  try {
    fs.writeFileSync(todoFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});