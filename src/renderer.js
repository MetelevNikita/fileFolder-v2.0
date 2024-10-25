const { ipcRenderer } = require('electron');

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



ipcRenderer.on('status-copied', (event, message) => {
  console.log(`СКОПИРОВАНО ${message}`)
  statusBlock.innerText = message
})




createBtn.addEventListener('click', async () => {

  statusBlock.innerText = 'Загрузка...'

  if(fileTitleInput.textContent === 'Загрузите исходный файл' || fileTitleOutput.textContent === 'Загрузите выходноую папку') {
    return statusBlock.innerText = 'Заполните входной файл или выходную папку'
  }
  
  window.myAPI.copiedFiles(fileTitleInput.textContent, fileTitleOutput.textContent)


  const status = await window.myAPI.statusCopied(fileTitleInput.textContent, fileTitleOutput.textContent);
  console.log(status)
  statsFile.innerText = `Уникальных файлов скопированно: ${status.copiedFiles}\n\n Создано папок: ${(status.folders.length < 1) ? '' : status.folders.join(' ')}\n\nКоличество путей к файлам в .air: ${status.files}`

  window.myAPI.convertFile(fileTitleInput.textContent, fileTitleOutput.textContent);

  statusBlock.innerText = 'Завершено!!!'



})




