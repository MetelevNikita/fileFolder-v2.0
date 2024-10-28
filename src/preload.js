const path = require("path");
const fs = require("fs");
const autoenc = require("node-autodetect-utf8-cp1251-cp866");
const ipcRenderer = require("electron").ipcRenderer;

//


const getInputFile = async (inputPath) => {
  return fs.promises.readFile(inputPath).then((data) => {
    const encoding = autoenc.detectEncoding(data).encoding;

    let text = "";

    if (encoding === "cp1251") {
      text = new TextDecoder("cp1251").decode(data).split("\n");
    } else {
      text = new TextDecoder("utf8").decode(data).split("\n");
    }
    return text;
  });
};

const createOutputFolder = (outputPath, subFolder) => {

  try {

    subFolder.forEach((folder) => {
      fs.mkdirSync(`${outputPath}/${folder}`, {recursive: true})
      console.log(`Cозданы папки ${folder}`)
    })

  } catch (error) {
    console.log(error)
  }

}



const copyFile = (sourcePath, targetPath) => {

  try {

    if (!fs.existsSync(targetPath)) {    // Копирование файла

      console.log(`Копирую файл ${targetPath}`)
      fs.copyFileSync(sourcePath, targetPath);
      ipcRenderer.invoke('start-copy', targetPath)
    }

  } catch (error) {
    console.log('Файл уже существует или отсутствует', error);
  }
}


window.myAPI = {

  copiedFiles: async (inputPath, outputPath) => {

    const text = await getInputFile(inputPath);
    const filesInput = []

    text.filter((item) => {
      const arr = item.replace('\r', '').split('\\\\')

      if(arr[1] === undefined) {
        return
      }
      return filesInput.push(path.parse(`\\${arr[1]}`))
    })


    const folder = filesInput.map((item) => {
      const arrPath = item.dir.split('\\')
      return arrPath[arrPath.length-1]
    })


    const setFolder = new Set(folder)
    createOutputFolder(outputPath, setFolder)



    filesInput.forEach((item) => {

      const inputPath = `\\${item.dir}`
      const fileName = item.name

      const arrPath = item.dir.split('\\')
      const outputFolder = arrPath[arrPath.length-1]
      copyFile(`${inputPath}/${fileName}.mp4`, `${outputPath}/${outputFolder}/${fileName}.mp4`)
      copyFile(`${inputPath}/${fileName}.SLIni`, `${outputPath}/${outputFolder}/${fileName}.SLIni`)
    })

    console.log('Все файлы усапешно загружены')
    ipcRenderer.send("set-status", "Загрузка файлов завершена!");

  },

  statusCopied: async (inputPath, outputPath) => {


    const statusObj = {
      folders: [],
      files: '',
      copiedFiles: ''
    }

    // input file

    const text = await getInputFile(inputPath);
    const filesInput = []

    text.filter((item) => {
      const arr = item.replace('\r', '').split('\\\\')

      if(arr[1] === undefined) {
        return
      }
      return filesInput.push(`\\${arr[1]}`)
    })

    // root directory

    const rootDirectory = fs.readdirSync(outputPath);
    const rootDirectoryArr = [];

    if (rootDirectory.length === 0) {
      console.log("корневая папка пуста");
    } else {
      rootDirectory.forEach((folder) => {
        statusObj.folders.push(folder)
        const folders = fs.readdirSync(`${outputPath}\\${folder}`);

        folders.forEach((file) => {
          const pathBaseName = path.parse(file)

          if (pathBaseName.ext !== '.SLIni') {
            rootDirectoryArr.push(`${outputPath}\\${folder}\\${file}`);
          }

        });
      });
    }



    statusObj.copiedFiles = rootDirectoryArr.length
    statusObj.files = filesInput.length

    return statusObj

  },

  convertFile: async (inputPath, outputPath) => {
    const text = await getInputFile(inputPath);

    const pathString = text.map((item) => {
      const arr = item.replace(/\r\n/g, "\n").split("\\\\");

      if (arr[1]) {
        const pathFile = path.parse(arr[1]);

        const pathName = pathFile.base;
        const pathDir = pathFile.dir.split("\\");

        return [
          arr[0],
          `${outputPath}\\${pathDir[pathDir.length - 1]}\\${pathName}`,
        ].join("");
      } else {
        return arr[0];
      }
    });


  
    const data = fs.writeFileSync(inputPath, pathString.join("\n"), {encoding: 'utf-16le'});
    console.log("конвертация файла завершена");
    

    return data
  },
};
