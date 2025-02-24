const { ipcRenderer, ipcMain } = require('electron');

const ipc = require('electron').ipcRenderer;


const inputFile = document.getElementById('file_input');
const outputFile = document.getElementById('file_output');

//

const createBtn = document.getElementById('create_btn');

//

const fileTitleInput = document.getElementById('file_title_input');
const fileTitleOutput = document.getElementById('file_title_output');

//

const statusBlock = document.getElementById('status_block')
const statsFile = document.getElementById('status_file')





inputFile.addEventListener('click', async () => {

  const  file  = await ipc.invoke('open-file');

  //

  console.log(file.filePaths[0])

  //

  fileTitleInput.textContent = file.filePaths[0];

  if(fileTitleInput.textContent === '') {
    return fileTitleInput.textContent = 'Загрузите исходный файл'
  }


})


outputFile.addEventListener('click', async () => {
  const  folder  = await ipc.invoke('open-folder');

  fileTitleOutput.textContent = folder.filePaths[0]

  if(fileTitleOutput.textContent === '') {
    return fileTitleOutput.textContent = 'Загрузите исходный файл'
  }



})





createBtn.addEventListener('click', async () => {

  statusBlock.innerText = "Загрузка файлов"

  if(fileTitleInput.textContent === 'Загрузите исходный файл' || fileTitleOutput.textContent === 'Загрузите выходноую папку') {
    return statusBlock.innerText = 'Заполните входной файл или выходную папку'
  }


  const data = await window.myAPI.copiedFiles(fileTitleInput.textContent, fileTitleOutput.textContent)
  const finalConvertation = await window.myAPI.convertFile(fileTitleInput.textContent, fileTitleOutput.textContent);


  console.log(data)

  const info = JSON.parse(data)
  statusBlock.innerText = `Загрузка завершена \n\n Скопировано файлов: ${info.copiedFiles} \n\n Удаено файлов: ${info.deleteFiles}`

})




