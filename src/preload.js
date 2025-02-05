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
  deleteFiles: 0,
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

      const parts = item.split(' ')
      if(parts[0] !== 'movie') {
        return
      }

        const secondHalf = parts.slice(2).join(' ')
        const pathParse = path.parse(secondHalf)

        //

        const fileName = pathParse.name
        const fileExt = pathParse.ext
        const outputDir = pathParse.dir.split('\\').slice(-1)

        return [`${outputPath}\\${outputDir}\\${fileName}${fileExt}`].join(' ')
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


    data.deleteFiles = deleteFiles.length
    data.copiedFiles = (uniqFiles.length === 0) ? 0 : uniqFiles.length - 1

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
        data.progress = arrFiles.length
        console.log(`Копирую файл .mp4 ${targetPath}`)
        data.file = targetPath
        ipcRenderer.send('copy-progress', JSON.stringify(data))
        fs.copyFileSync(sourcePath, targetPath);
      }


      console.log(`Копирую файл .Slini ${targetPath}`)
      data.file = targetPath
      fs.copyFileSync(sourcePath, targetPath);

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

    const inputFileList = getInputFile(inputFile)
    const outputPathList = getOutputFile(outputPath)

    //


    const arrInputList = inputFileList.filter((item) => item !== '').map((item) => {

      const parts = item.split(' ')
      if(parts[0] !== 'movie') {
        return
      }

        const secondHalf = parts.slice(2).join(' ')
        const pathParse = path.parse(secondHalf)

        //

        const fileName = pathParse.name
        const fileExt = pathParse.ext
        const outputDir = pathParse.dir.split('\\').slice(-1)

        return `${outputPath}\\${outputDir}\\${fileName}${fileExt}`
    })



    console.log(arrInputList)
    console.log(outputPathList)





    outputPathList.filter((item) => {

      if(!arrInputList.includes(item)) {
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

      const parts = item.split(' ')
      if(parts[0] !== 'movie') {
        return
      }

        const secondHalf = parts.slice(2).join(',')
        const pathParse = path.parse(secondHalf)

        //
        const folder = pathParse.dir.split('\\').slice(-1)
        console.log(folder)
        return folder
    })


    const uniqFolder = [...new Set(setFolder)]
    createOutputFolder(outputPath, setFolder)


    // Копируем файлы


    inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {

      const parts = item.split(' ')
      if(parts[0] !== 'movie') {
        return
      }

        const secondHalf = parts.slice(2).join(' ')
        const parsePath = path.parse(secondHalf)


        //

        const subFolderName = parsePath.dir.split('\\').slice(-1)

        copyFile(`${parsePath.dir}\\${parsePath.name}.mp4`, `${outputPath}\\${subFolderName}\\${parsePath.name}.mp4`)
        copyFile(`${parsePath.dir}\\${parsePath.name}.SLIni`, `${outputPath}\\${subFolderName}\\${parsePath.name}.SLIni`)


    })


    deleteFile(inputFile, outputPath)

    res = JSON.stringify(data)
    return res

  },


  convertFile: async (inputPath, outputPath) => {
    const inputFileList = getInputFile(inputPath);

    const newList = inputFileList.filter((item) => item !== '').filter((item) => item !== '\r').map((item) => {

      const parts = item.split(' ')


      if(parts[0] !== 'movie') {
        return parts.join(' ')
      }

        const firstHalf = parts.slice(0, 2).join(' ')
        const secondHalf = parts.slice(2).join(' ')


        const pathParse = path.parse(secondHalf)

        //

        const fileName = pathParse.name
        const fileExt = pathParse.ext
        const outputDir = pathParse.dir.split('\\').slice(-1)

        return [firstHalf, `${outputPath}\\${outputDir}\\${fileName}${fileExt}`].join(' ')
    })

    const finalConvertation = fs.writeFileSync(inputPath, newList.join("\n"), {encoding: 'utf-16le'})
    return finalConvertation

  }

};




















