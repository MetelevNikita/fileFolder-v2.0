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
    height: 560,
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
  mainWindow.openDevTools();


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
  return file
})


ipcMain.handle('open-folder', async (event, arg) => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return folder
})



//


ipcMain.handle('start-copy', (event, files, arr) => {})


let progressBar


ipcMain.on('start', (event, arg) => {
  info = JSON.parse(arg)
})




ipcMain.on('start', (event, arg) => {
    const data = JSON.parse(arg)

    progressBar = new ProgressBar({
    indeterminate: false,
    title: 'Загрузка файлов',
    text: 'Копирование файлов',
    detail: `Загружаю файл ${data.file}`,
    initialValue: 0,
    maxValue: data.copiedFiles,
  })

})


ipcMain.on('copy-progress', (event, arg) => {

    const data = JSON.parse(arg)

    progressBar.value = data.progress

    progressBar.on('completed', () => {
      console.log(`complete`)
      progressBar.detail = 'Файлы загружены.';
    }).on('aborted', () => {
      console.log('aborted')


    }).on('progress', (progress) => {
      progressBar.detail = `Загружено ${progress} файлов. Текущее копирование ${data.file}`
    })


})




ipcMain.on('set-progressbar-completed', setProgressbarCompleted);






function setProgressbarCompleted () {
	if (progressBar) {
		progressBar.setCompleted();
	}
}




























