// 并发数
const POOL_SIZE = 3;
// 重试次数
const RETRY_NUM = 3;
// 超时时间
const TIMEOUT = 4000;
// 文件总数量
const FILE_NUM = 100;
// 已加载文件数量
let hasLoaderFiles = 0;
// 总文件数量
let totalFiles = 0;
let isProcessing = false;

/**
 * 开始按钮点击事件处理函数
 * 在这⾥实现异步任务处理逻辑
 */
async function onStartBtnClick() {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    updateProgress();
    try {
        updateStatus('解析进行中');
        // 1. 读取配置文件
        const files = await loadConfig();
        // 2. 任务池依次处理文件
        await doProcessFiles(files);
        if (hasLoaderFiles < totalFiles) {
            myLog(`解析结束，但有${totalFiles - hasLoaderFiles}个文件解析失败`, 'error');
            return;
        }
        // 3. 任务处理完成，初始化系统
        await initSystem();
        updateStatus('解析完成');
        myLog('所有任务处理完成!!!', 'success');
    } catch (error) {
        myLog(`任务处理途中异常:${error}`, 'error');
        updateStatus('解析失败');
        console.log(error);
    } finally {
        startBtn.disabled = false;
        isProcessing = false;
    }
}

function updateStatus(status) {
    const statusEle = document.getElementById('status');
    statusEle.textContent = status || '空闲';
}

function updateProgress() {
    const percent = Math.floor((hasLoaderFiles / totalFiles) * 100);

    const ele = document.getElementById('progress');
    ele.style.width = percent + '%';
    ele.style.background = '#bdbdbd';
}

async function doProcessFiles(files) {
    // 任务池；
    const taskPool = new Array(POOL_SIZE).fill(0);

    async function doTask() {
        while (files.length > 0) {
            const curFile = files.shift();
            try {
                // 处理任务
                await loadFile(curFile);
            } catch (error) {
                myLog(`处理文件 ${curFile.name} 时发生错误: ${error}`, 'error');
            }
        }
    }

    return Promise.all(taskPool.map(() => doTask(files)));
}

function myLog(message, type = 'info') {
    const pEle = document.getElementById('console');
    const span = document.createElement('span');
    span.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (type === 'success') {
        span.style.color = '#388e3c';
    }
    if (type === 'error') {
        span.style.color = '#d32f2f';
    }
    if (type === 'warning') {
        span.style.color = '#ff9800';
    }
    pEle.appendChild(span);
    pEle.scrollTop = pEle.scrollHeight;
}

/**
 * 加载配置⽂件
 * @returns {Promise<string[]>} ⽂件列表
 */
async function loadConfig() {
    myLog('开始加载配置文件...');
    return new Promise(resolve => {
        setTimeout(() => {
            const files = new Array(FILE_NUM).fill(0).map((_, i) => obj = {
                id: i,
                name: `file${i + 1}.txt`
            });
            totalFiles = files.length;
            myLog(`配置文件加载完成，共 ${files.length} 个文件`);
            resolve(files);
        }, 1000);
    });
}

/**
 * 加载⽂件
 * @param {string} file ⽂件名
 * @returns {Promise<void>}
 */
async function loadFile(file, retryNum = 0) {
    if (retryNum > 0) {
        myLog(`开始加载文件: ${file.name}，第:${retryNum}次重试 `);
    } else {
        myLog(`开始加载文件: ${file.name}`);
    }

    try {
        const result = await doLoadFile(file);
        hasLoaderFiles++;
        updateProgress();
        myLog(`文件 ${file.name} 加载成功`, 'success');
        return result;
    } catch (error) {
        // 重试机制
        if (retryNum < RETRY_NUM) {
            // 累加等待次数
            const delay = Math.pow(2, retryNum) * 1000;
            myLog(`文件 ${file.name} 加载失败，马上开始重试`, 'warning');
            await new Promise(resolve => setTimeout(resolve, delay));
            return loadFile(file, retryNum + 1);
        } else {
            myLog(`文件 ${file.name} 加载失败，已达到最大重试次数`, 'error');
            throw error;
        }
    }
}

/**
 * 加载文件
 * @param {string} file 文件名
 * @returns {Promise<void>}
 **/
async function doLoadFile(file) {
    // 网络请求超时时间
    const timoutPro = () =>
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('超时');
            }, TIMEOUT);
        });
    // 加载超时时间
    const randomtime = 1000 + Math.floor(Math.random() * 2000);
    const loadPro = () =>
        new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.9) {
                    resolve();
                } else {
                    reject('加载失败');
                }
            }, randomtime);
        });
    return Promise.race([loadPro(), timoutPro()]);
}

/**
 * 初始化系统
 * @returns {Promise<void>}
 **/
async function initSystem() {
    myLog('开始初始化系统...');
    return new Promise(resolve => {
        setTimeout(() => {
            myLog('初始化系统成功', 'success');
            resolve();
        }, 1000);
    });
}
