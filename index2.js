const puppeteer = require("puppeteer");
const isObjectEmpty = (obj) => Object.keys(obj).length === 0;
const constant = require("./constant/constant");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');

const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py"
const scriptPathGetColor = "./pyLib/extract_number.py";

const linkPyClick = "./pyLib/click.py"; // Cập nhật đường dẫn này
const clickDat = "./pyLib/clickDat.py"; // Cập nhật đường dẫn này

const xDT = 239;
const yDT = 717;

const xDX = 617;
const yDX = 716;

const x1k = 145;
const y1k = 830;

const x10k = 224;
const y10k = 830;

const xDC = 434;
const yDC = 897;

let daDat = false;
let moneyNow = 50000;
let moneyDat = 0;

let chuoiThang = 0;
let chuoiThua = 0;

let chuoiThuaChuki = 0;
let firstDat = true;

let resultForecast = 0;

let second = 0;


const nguong = 1000000;

function writeToFile(data) {
    const filePath = path.join(__dirname, './data/dataGame2.txt'); // Thay đổi đường dẫn nếu cần

    try {
        fs.writeFileSync(filePath, data, 'utf8');
        console.log('Đã ghi dữ liệu vào tệp thành công.');
    } catch (error) {
        console.error('Lỗi khi ghi dữ liệu vào tệp:', error);
    }
}

function appendToFile(data) {
    const filePath = path.join(__dirname, `./data/dataGame2.txt`); // Thay đổi đường dẫn nếu cần
    fs.appendFileSync(filePath, data, 'utf8');
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

function calculateBetAmount(money) {
    return Math.floor(money * 0.1 / 1000); // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
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

const dddT = async (betAmount) => {
    console.log('Dự đoán tài');
    await dat(xDT, yDT);
    await datN1k(betAmount, x1k, y1k, x10k, y10k);
    moneyDat = betAmount; // Số tiền đặt cược
    resultForecast = 0;
    daDat = true;
    await dat(xDC, yDC);
}

const dddX = async (betAmount) => {
    console.log('Dự đoán xỉu');
    await dat(xDX, yDX);
    await datN1k(betAmount, x1k, y1k, x10k, y10k);
    moneyDat = betAmount; // Số tiền đặt cược
    resultForecast = 1;
    daDat = true;
    await dat(xDC, yDC);
}

async function foresCastMath(ycd, flagUT) {
    try {
        const stringStdout = `${linkPy} ${forecastPath} ./data/dataGame2.txt`;
        let stdout = await promisifiedExec(stringStdout);

        const objValue = JSON.parse(stdout);
        console.log(objValue);

        let betAmount = calculateBetAmount(moneyNow) * 1000; // Số lần linkPyClick tương ứng với 10% số tiền
        if (chuoiThuaChuki >3 ) betAmount = (betAmount * Math.pow(2, (betAmount % 3)));
        if(betAmount > moneyNow) betAmount = calculateBetAmount(moneyNow) * 1000;
        if (ycd != null && flagUT) {
            if (ycd == 0) {
                dddT(betAmount);
            } else {
                dddX(betAmount);
            }
        } else {

            if (objValue?.probability && objValue?.probability[0] > objValue?.probability[1] && betAmount > 0 && ycd == 0) {
                dddT(betAmount);
            } else if (objValue?.probability && objValue?.probability[1] > objValue?.probability[0] && betAmount > 0 && ycd == 1) {
                dddX(betAmount);
            } else {
                if (objValue?.probability && objValue?.probability[0] > objValue?.probability[1] + 10 && betAmount > 0) {
                    dddT(betAmount);
                }else if(objValue?.probability && objValue?.probability[1] > objValue?.probability[0] +10 && betAmount > 0){
                dddX(betAmount);
                }else{
                    console.log('Thông tin khó có thể dự đoán được');
                    moneyDat = 0;
                }
            }
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
    });

    const page = await browser.newPage();

    // Điều hướng đến trang đăng nhập
    await page.goto("https://play.go88.info/");

    // Lấy client CDP sau khi đăng nhập
    const client = await page.target().createCDPSession();

    // Bật tính năng Network để theo dõi giao tiếp mạng
    await client.send("Network.enable");

    let webSocketId;
    let totalT = []
    let totalX = []
    const objForecast = {
        totalT: [],
        totalX: [],
    };

    // Lắng nghe sự kiện WebSocket được tạo để lấy requestId của kết nối cụ thể
    client.on("Network.webSocketCreated", ({ requestId, url }) => {
        if (url === "wss://mynygwais.hytsocesk.com/websocket") {
            webSocketId = requestId;
            console.log(
                `WebSocket connection to ${url} established with requestId: ${requestId}`
            );
        }
    });

    // Lắng nghe các khung WebSocket được gửi đi nếu chúng thuộc về kết nối cụ thể
    client.on(
        "Network.webSocketFrameSent",
        ({ requestId, timestamp, response }) => {
            // if (requestId === webSocketId) {
            //     console.log('Sent frame:', response.payloadData);
            // }
        }
    );

    // Lắng nghe các khung WebSocket được nhận nếu chúng thuộc về kết nối cụ thể
    await client.on(
        "Network.webSocketFrameReceived",
        async ({ requestId, timestamp, response }) => {
            if (response?.payloadData) {
                const payLoad = parseJSONResponse(response.payloadData);
                if (
                    requestId === webSocketId &&
                    payLoad != null &&
                    Array.isArray(payLoad) &&
                    payLoad.length > 0
                ) {

                    await xuLyPayload(payLoad, totalT, totalX);
                }
            }
        }
    );
    if (moneyNow > 250000) return;
    // Tiếp tục với các bước khác của script...
})();

function parseJSONResponse(response) {
    try {
        if (!response) {
            console.error("Empty response received");
            return null; // hoặc xử lý phù hợp
        }
        const validJSON = response.replace(/^\d+/, "");
        return JSON.parse(validJSON);
    } catch (error) {
        return null; // hoặc xử lý phù hợp
    }
}

function sumValuesByKey(array, key) {
    return array.reduce((total, obj) => {
        if (typeof obj[key] === "number") {
            return total + obj[key];
        }
        return total;
    }, 0);
}

function mergeArrays(oldArray, newArray) {
    const mergedMap = new Map();

    // Thêm các phần tử từ mảng cũ vào map
    oldArray.forEach((item) => {
        mergedMap.set(item.dn, item);
    });

    // Cập nhật map với các phần tử từ mảng mới
    newArray.forEach((item) => {
        mergedMap.set(item.dn, item);
    });

    // Chuyển map trở lại thành mảng
    return Array.from(mergedMap.values());
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const xuLyPayload = async (payLoad, totalT, totalX) => {
    let action = -99;
    let data = {};
    let d1 = null;
    let d2 = null;
    let d3 = null;

    if (payLoad[1]?.gi?.length > 0) {
        data = payLoad[1]?.gi[0];
        if (!isObjectEmpty(data)) action = 1;
    }
    if (payLoad[1]?.d1 && payLoad[1].tUB && payLoad[1].tUS) {
        d1 = payLoad[1]?.d1;
        d2 = payLoad[1]?.d2;
        d3 = payLoad[1]?.d3;
        if (d1 && d2 && d3) action = 2;
    }
    if (payLoad[1]?.htr?.length > 0) {
        const writeData = payLoad[1]?.htr.map(e => {
            const dhr1 = e.d1;
            const dhr2 = e.d2;
            const dhr3 = e.d3;
            if (dhr1 + dhr2 + dhr3 > 10) {
                return 0;
            } else {
                return 1;
            }
        })
        writeToFile(writeData.join(''));
    }

    if (payLoad[1]?.tP?.rP && payLoad[1]?.tP?.aP) {
        await showInfor(payLoad[1]?.tP?.aP, payLoad[1]?.tP?.rP, totalT, totalX);
    }

    switch (action) {
        case 1:
            await getInforSession(data);
            break;
        case 2:
            result(d1, d2, d3, payLoad[1].tUB, payLoad[1].tUS, totalT, totalX);
            break;
        case "3":
            break;
        // Thêm các case khác ở đây nếu cần
        default:
        //   console.log("Invalid action");
    }
};

const getInforSession = async (data) => {
    let ycd = null;
    let flagUT = false;
    console.log(
        `TAI XIU User - Money giây thứ ${50 - second++}: (${data.B.tU}) ${formatNumberWithCommas(data.B?.tB)} --- (${data.S.tU}) ${formatNumberWithCommas(data.S?.tB)} tỉ lệ cá nhân đặt ${formatNumberWithCommas(parseInt(data.B?.tB / data.B.tU))} VNĐ - ${formatNumberWithCommas(parseInt(data.S?.tB / data.S?.tU))} VNĐ`
    );
    const tltbT = parseInt(data.B?.tB / data.B.tU);
    const tltbS = parseInt(data.S?.tB / data.S.tU);
    if ((50 - second) == 15) {
        if (data.B.tU > data.S.tU) {
            //xỉu ít người hơn thì đặt xỉu, nhưng số tiền của xỉu nhiều hơn thì đặt tài
            ycd = 1;
            if (data.S.tB > data.B.tB) {
                flagUT = true;
                ycd = 0;
            }
        }
        if (data.S.tU > data.B.tU) {
            //tài ít người hơn thì đặt tài, nhưng số tiền của tài nhiều hơn thì đặt xỉ
            ycd = 0;
            if (data.B.tB > data.S.tB) {
                flagUT = true;
                ycd = 1;
            }
        }
        if (tltbT - tltbS > 250000) {
            ycd = 1;
            flagUT = true;
        }
        if (tltbS - tltbT > 250000) {
            ycd = 0;
            flagUT = true
        }

        if (!daDat) await foresCastMath(ycd, flagUT);
    }

};

const result = (d1, d2, d3, tUB, tUS, totalT, totalX) => {
    const kq = d1 + d2 + d3;
    if (kq > 10) {
        console.log("Kết quả Tài ", kq, `Với Tổng User T - X :  ${tUB} - ${tUS}`);
        appendToFile('0');
        if (daDat) {
            if (resultForecast != 0) {
                moneyNow -= moneyDat; // Trừ tiền thua
                chuoiThua++;
                chuoiThuaChuki++;
            } else {
                moneyNow += moneyDat * 0.98; // Cập nhật số tiền sau khi thắng
                chuoiThang++;
                chuoiThuaChuki = 0;
            }
        }

    } else {
        console.log("Kết quả Xỉu ", kq, `Với Tổng User T - X :  ${tUB} - ${tUS}`);
        appendToFile('1');
        if (daDat) {
            if (resultForecast != 1) {
                moneyNow -= moneyDat; // Trừ tiền thua
                chuoiThua++;
                chuoiThuaChuki++;
            } else {
                moneyNow += moneyDat * 0.98; // Cập nhật số tiền sau khi thắng
                chuoiThang++;
                chuoiThuaChuki = 0;
            }
        }
    }
    console.log('Tỉ lệ cá cược thắng : ', ((chuoiThang / (chuoiThang + chuoiThua)) * 100).toFixed(2), "%")
    totalT = [];
    totalX = [];
    daDat = false;
    second = 0;
};

const showInfor = async (userTaiHk, userXiuHk, totalT, totalX) => {
    console.log('phát hiện thông tin nhạy cảm ', userTaiHk, userXiuHk, totalT, totalX)
    totalT = mergeArrays(totalT, userTaiHk); // Merge mảng totalT
    totalX = mergeArrays(totalX, userXiuHk); // Merge mảng totalX

    const valueT = sumValuesByKey(totalT, "b");
    const valueX = sumValuesByKey(totalX, "b");

    console.log(`********* Phát hiện thông tin nhạy cảm :: ${valueT} - ${valueX}`);
};
