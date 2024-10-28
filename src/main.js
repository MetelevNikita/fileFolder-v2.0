const { app, BrowserWindow, ipcMain, dialog, webContents } = require('electron');
const ProgressBar = require('electron-progressbar')
const path = require('node:path');
const fs = require('fs')
const chokidar = require('chokidar');
const autoenc = require("node-autodetect-utf8-cp1251-cp866");


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {

  const mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'asset/icon.png'),
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#323330',
      symbolColor: '#f9dc3e'
    }
    
  });


  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenuBarVisibility(false);


};


app.whenReady().then(() => {
  createWindow();


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});



// open-file


ipcMain.handle('open-file', async (event, arg) => {
  const file = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'air'] }]
  })

  console.log(file)
  return file
})


ipcMain.handle('open-folder', async (event, arg) => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  console.log(folder)
  return folder
})



// status


ipcMain.on('set-status', (event, title) => {
  console.log(event)
  dialog.showMessageBox({title: 'Результат', message: title})
})



// 





ipcMain.handle('start-copy', (event, files, arr) => {

 let progressBar = new ProgressBar({
  indeterminate: true,
  title: 'Загрузка файлов',
  text: 'Определение вермени.....',
  detail: `Загружаю файл ${files}`,
 })


 console.log(files)



const wathcer = chokidar.watch(files, {
  persistent: true
})


wathcer.on('add', (path) => {
  console.log(`File copy  -   ${path}`)

  if(path) {
    setTimeout(() => {
      progressBar.setCompleted()
    }, 3000)
  }
})



})

























