const path = require("path");
const fs = require("fs");
const autoenc = require("node-autodetect-utf8-cp1251-cp866");
const { ipcRenderer } = require('electron');

//



let arrFiles = []
let res =''
let data = {
  file: '',
  progress: 0,
  copiedFiles: 0
}


// получаем данные с Входного файла и выходной папки


const getInputFile = (inputAirFile) => {

  try {

    const data = fs.readFileSync(inputAirFile)
    const encoding = autoenc.detectEncoding(data).encoding;

    let text = "";

      if (encoding === "cp1251") {
        text = new TextDecoder("cp1251").decode(data).replace(/\r/g, "").split("\n");
      } else {
        text = new TextDecoder("utf8").decode(data).replace(/\r/g, "").split("\n");
      }


    return text;

  } catch (error) {
    console.log(`Входной файл получен с ошибкой ${error.message}`)
  }


};


const getOutputFile = (outputPath) => {
  try {

    const outputhFolderPath = fs.readdirSync(outputPath, {encoding: 'utf8'})

    const outputArr = outputhFolderPath.map((item) => {
      return  fs.readdirSync(`${outputPath}\\${item}`, { withFileTypes: true }).map((item) => {
        const fileName = `${item.parentPath}\\${item.name}`;
        return fileName

      });
    }).flatMap((item) => item).filter((item) => {
      const list = path.parse(item).ext
      return list !== '.SLIni'
    })

    return outputArr

  } catch (error) {
    console.log('Не удалось получить выходную папку')
  }
}



//


const getUniqFiles = async (inputFile, outputPath) => {

  try {

    const inputFileList = getInputFile(inputFile)
    const outputPathList = getOutputFile(outputPath)

    //

    const arrInputList = inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {
      const parts = item.split(' \\')

      if (parts.length > 1) {

        const stringPath = path.parse(parts[1])


        const endDir = stringPath.dir.split('\\').slice(-1)
        const fileName = stringPath.name
        const fileExt = stringPath.ext

        return `${outputPath}\\${endDir}\\${fileName}${fileExt}`
      }
    })

    const deleteFiles = outputPathList.filter((item) => {
      if(!arrInputList.includes(item)) {
        return item
      }
    })

    const uniqFiles = arrInputList.filter((item) => {
      if(!outputPathList.includes(item)) {
        return item
      }
    })
    const setFiles = [...new Set(uniqFiles)]



    // console.log(setFiles)
    // console.log(deleteFiles)

    //

    data.deleteFiles = deleteFiles.length
    data.copiedFiles = (setFiles.length === 0) ? 0 : setFiles.length

    //


  } catch (error) {
    console.log(`Не удалось получить данные о копировании файлов ${error.message}`)
  }

}





const createOutputFolder = (outputPath, subFolder) => {

  try {

    subFolder.forEach((folder) => {

      if(folder !== undefined) {
        fs.mkdirSync(`${outputPath}/${folder}`, {recursive: true})
      }
    })

  } catch (error) {
    console.log(error)
  }

}


const copyFile = (sourcePath, targetPath) => {

  try {

    if (!fs.existsSync(targetPath)) {    // Копирование файла

      const pathParse = path.parse(targetPath)

      if(pathParse.ext !== '.SLIni') {

        arrFiles.push(targetPath)
        console.log(arrFiles)
        data.progress = arrFiles.length
        // console.log(`Копирую файл ${targetPath}`)
        data.file = targetPath
        ipcRenderer.send('copy-progress', JSON.stringify(data))
        fs.copyFileSync(sourcePath, targetPath);

      } else {

        // console.log(`Копирую файл ${targetPath}`)
        data.file = targetPath
        fs.copyFileSync(sourcePath, targetPath);

      }





    } else {
      console.log(`Файл ${targetPath} уже существует`)
      return
    }

  } catch (error) {
    console.log('Ошибка копирования', error);
  }
}


const deleteFile = async (inputFile, outputPath) => {
  try {


    ipcRenderer.send('delete-start', JSON.stringify(data))

    const inputFileList = getInputFile(inputFile)
    const outputPathList = getOutputFile(outputPath)

    //


    const arrInputList = inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {
      const parts = item.split(' \\')

      if (parts.length > 1) {

        const stringPath = path.parse(parts[1])


        const endDir = stringPath.dir.split('\\').slice(-1)
        const fileName = stringPath.name
        const fileExt = stringPath.ext

        return `${outputPath}\\${endDir}\\${fileName}${fileExt}`
      } else {
        return
      }
    })
    const setInputFiles = [...new Set(arrInputList)]



    outputPathList.filter((item) => {

      if(!setInputFiles.includes(item)) {
        console.log(`Удалены файлы ${item}`)
        fs.unlinkSync(item)
      }
    })


  } catch (error) {
    console.log('Ошибка удаления файла', error);
  }
}










window.myAPI = {

  copiedFiles: async (inputFile, outputPath) => {

    getUniqFiles(inputFile, outputPath)

    if(data.copiedFiles === 0) {
      return
    }

    ipcRenderer.send('start', JSON.stringify(data))
    res = 'Загрузка...'

    // Находим уникальные папки в списке

    const inputFileList = getInputFile(inputFile);

    const setFolder = inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {
      const parts = item.split(' \\')

      if (parts.length > 1) {

        const stringPath = path.parse(parts[1])


        const folder = stringPath.dir.split('\\').slice(-1)
        return folder
      }
    })


    const uniqFolder = [...new Set(setFolder)]
    createOutputFolder(outputPath, uniqFolder)


    console.log('Папки созданы')


    // Копируем файлы


    const setFiles = [...new Set(inputFileList)]


    setFiles.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {
      const parts = item.split(' \\')

      if (parts.length > 1) {

        const stringPath = path.parse(parts[1])



        const endDir = stringPath.dir.split('\\').slice(-1)
        const fileName = stringPath.name
        const fileExt = stringPath.ext

        copyFile(`\\${stringPath.dir}\\${stringPath.name}.mp4`, `${outputPath}\\${endDir}\\${fileName}.mp4`)
        copyFile(`\\${stringPath.dir}\\${stringPath.name}.SLIni`, `${outputPath}\\${endDir}\\${fileName}.SLIni`)
      }
    })

    ipcRenderer.send('set-progressbar-completed')
    deleteFile(inputFile, outputPath)

    res = JSON.stringify(data)
    return res

  },


  convertFile: async (inputPath, outputPath) => {
    const inputFileList = getInputFile(inputPath);

    const arrInputList = inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {
      const parts = item.split(' \\')

      if (parts.length > 1) {

        const stringPath = path.parse(parts[1])


        const endDir = stringPath.dir.split('\\').slice(-1)
        const fileName = stringPath.name
        const fileExt = stringPath.ext

        return [parts[0], `${outputPath}\\${endDir}\\${fileName}${fileExt}`].join(' ')
      } else {
        return parts.join(' ')
      }
    })

    const finalConvertation = fs.writeFileSync(inputPath, arrInputList.join("\n"), {encoding: 'utf-16le'})
    return finalConvertation

  }

};


























