export {}
const {app, BrowserWindow, ipcMain} = require("electron")
const remote = require("@electron/remote/main")
const path = require("path")
const fs = require("fs")
const childProcess = require("child_process")

const isDev = process.env.NODE_ENV === "development"
const isLinux = process.platform === "linux"
const isWin = process.platform === "win32"
const isMac = process.platform === "darwin"
let mainWindow: InstanceType<typeof BrowserWindow> | null = null

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "./preload.js")
        }
    })
    remote.initialize()
    remote.enable(mainWindow.webContents)
    // isDev && mainWindow.webContents.openDevTools()
    if (isDev) {
        await mainWindow.loadURL("http://localhost:30002")
    } else {
        await mainWindow.loadFile("dist/index.html")
    }
}

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 || mainWindow === null)
        void createWindow().catch(err => {
            console.log("重新创建窗口失败" + JSON.stringify(err))
        })
})
app.on("window-all-closed", () => {
    !isMac && app.quit()
})
void app.whenReady().then(() => {
})

void app.whenReady().then(() => {
    function init() {
        void createWindow().catch(err => {
            console.log("创建窗口失败：" + JSON.stringify(err))
        })
    }

    // 延迟解决莫名其妙的ready未完成问题：https://github.com/electron/electron/issues/16809
    isLinux ? setTimeout(init, 300) : init()
})

class Handler {
    static readFileInDirectory(directory: string) {
        const names = getIncludeFiles(directory)
        const paths = filename2path(names, directory)
        return {
            names,
            paths
        }
    }
}

function getIncludeFiles(path: string) {
    const dirents = fs.readdirSync(path, {
        withFileTypes: true
    }) as any[]
    if (dirents.length === 0) return []
    return dirents.filter(item => item.isFile()).map(item => item.name)
}

function filename2path(filenames: string[], prevFix: string) {
    return filenames.map(filename => path.join(prevFix, filename))
}

function mergeVideo(filePaths: string[]) {
    const ffmpegPath = path.join(__dirname, "../lib/ffmpeg.exe")
    const outputPath = ""
    childProcess.exec(`-f concat -safe 0 -i %s -c copy %s "${outputPath}/file.txt" "${outputPath}/output.mkv"`)
}

ipcMain.handle("readFileInDirectory", (event, filePath: string) => Handler.readFileInDirectory(filePath))
