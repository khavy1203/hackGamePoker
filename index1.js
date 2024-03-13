const constant = require("./constant/constant");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');

const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py"
const scriptPathGetColor = "./pyLib/extract_number.py";

const linkPyClick = "./pyLib/click.py"; // Cập nhật đường dẫn này
const clickDat = "./pyLib/clickDat.py"; // Cập nhật đường dẫn này


const xDT = 637;
const yDT = 818;

const xDX = 1281;
const yDX = 815;

const x1k = 491;
const y1k = 1045;

const x10k = 626;
const y10k = 1040;

const xDC = 968;
const yDC = 1139;

const xCheckColor = 1243;
const yCheckColor = 922;

let moneyDat = 0;

let chuoiThang = 0;
let chuoiThua = 0;

let result = 1;

let firstDat = true;

let daDat = false;

let moneyNow = 150000;
const nguong = 1000000;

function isRed(color) {
    return color[0] > 150 && color[1] < 100 && color[2] < 100;
}

function isBlack(color) {
    return color[0] < 50 && color[1] < 50 && color[2] < 50;
}
function appendToFile(data) {
    const filePath = path.join(__dirname, `./data/data.txt`); // Thay đổi đường dẫn nếu cần
    fs.appendFileSync(filePath, data, 'utf8');
}
function calculateBetAmount(money) {
    return Math.floor(money * 0.03 / 1000); // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
}

function promisifiedExec(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}


async function foresCast() {
    try {
        const currentDateTime = new Date();
        const currentHour = currentDateTime.getHours();
        let stringStdout = '';
        if (currentHour >= 8 && currentHour < 17) stringStdout = `${linkPy} ${forecastPath} ./data/data.txt`;
        else stringStdout = `${linkPy} ${forecastPath} ./data/data.txt`;
        let stdout = await promisifiedExec(stringStdout);

        const objValue = JSON.parse(stdout);
        console.log(objValue);

        let betAmount = calculateBetAmount(moneyNow) * 1000; // Số lần linkPyClick tương ứng với 10% số tiền
        if(chuoiThua > 2) betAmount = betAmount*(chuoiThua-2);
        if (objValue?.probability && objValue?.probability[0] > objValue?.probability[1] && betAmount > 0) {
            console.log('Dự đoán tài');
            await dat(xDT, yDT);
            await datN1k(betAmount, x1k, y1k, x10k, y10k);
            moneyDat = betAmount; // Số tiền đặt cược
            result = 0;
            daDat = true;
            await dat(xDC, yDC);
        } else if (objValue?.probability && objValue?.probability[1] > objValue?.probability[0] && betAmount > 0) {
            console.log('Dự đoán xỉu');
            await dat(xDX, yDX);
            await datN1k(betAmount, x1k, y1k, x10k, y10k);
            moneyDat = betAmount; // Số tiền đặt cược
            result = 1;
            daDat = true;
            await dat(xDC, yDC);
        } else {
            console.log('Không đủ thông tin để đặt cược hoặc số tiền không đủ');
            moneyDat = 0;
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function dat(xD, yD) {
    await promisifiedExec(`${linkPy} ${clickDat} ${xD} ${yD}`);
}
async function datN1k(betAmount, x1k, y1k, x10k, y10k) {
    // Chia số tiền đặt cược thành số lần click 10k và 1k.
    const clicks10k = Math.floor(betAmount / 10000); // Số lần click cho 10k
    const clicks1k = Math.floor((betAmount % 10000) / 1000); // Số lần click cho 1k
    console.log('check clicks1k - clicks10k', clicks1k, clicks10k)
    // Nếu có số lần click cho 10k, thực hiện hàm click.
    if (clicks10k > 0) {
        await promisifiedExec(`${linkPy} ${linkPyClick} ${clicks10k} ${x10k} ${y10k}`);
        console.log(`Đã click ${clicks10k} lần tại 10K`);
    }
    // Thực hiện số lần click cho 1k.
    if (clicks1k > 0) {
        await promisifiedExec(`${linkPy} ${linkPyClick} ${clicks1k} ${x1k} ${y1k}`);
        console.log(`Đã click ${clicks1k} lần tại 1K`);
    }
}

async function captureAndSaveImage() {
    try {
        const stdout = await promisifiedExec(`${linkPy} ${scriptPathGetColor} ${xCheckColor} ${yCheckColor}`);
        const objValue = JSON.parse(stdout);
        console.log(objValue);
        if (objValue?.times && parseInt(objValue?.times) == 50 && objValue?.colors) {
            const color = objValue.colors;

            if (isRed(color)) {
                // Màu đỏ, xỉu
                appendToFile('1');
                if (!firstDat && daDat) {
                    if (result == 1) { // Kiểm tra kết quả trước đó là xỉu
                        moneyNow += moneyDat * 0.98; // Cập nhật số tiền sau khi thắng
                        chuoiThang++;
                        chuoiThua = 0;
                    } else {
                        moneyNow -= moneyDat; // Trừ tiền thua
                        chuoiThang = 0;
                        chuoiThua++;
                    }
                }
            } else if (isBlack(color)) {
                // Màu đen, tài
                appendToFile('0');
                if (!firstDat && daDat) {
                    if (result == 0) { // Kiểm tra kết quả trước đó là tài
                        moneyNow += moneyDat * 0.98; // Cập nhật số tiền sau khi thắng
                        chuoiThang++;
                        chuoiThua = 0;
                    } else {
                        moneyNow -= moneyDat; // Trừ tiền thua
                        chuoiThang = 0;
                        chuoiThua++;
                    }
                }
            }
            firstDat = false;
            daDat = false;
            foresCast(); // Đặt cược cho lần tiếp theo dựa trên số tiền mới
            console.log('check moneyNow', moneyNow)
            console.log('check chuỗi thằng - thua ', chuoiThang, chuoiThua)
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

setInterval(() => {
    if (moneyNow > 300000) moneyNow = 150000;
    captureAndSaveImage();

}, 60000);
