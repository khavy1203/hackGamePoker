const WebSocket = require("websocket").w3cwebsocket;
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py";

//rik8
const botToken = '6362272675:AAHVyUsYx_YF1gUIfXMwip1WqxL8U2TPino';
let groupId = '-4085050404';
// Thay thế 'YOUR_TELEGRAM_BOT_TOKEN' bằng token của bot Telegram bạn đã tạo
const bot = new TelegramBot(botToken, { polling: true });

let listAccountAdmin = [];

const accessTokenWS = '29-f264cf3a58592ac30035f09ab3ec2517';

const keyWsBet = 'WIaifDOZSFgAokMNXaUGQ==';

const keyWsGetGold = 'gqVlUnXt7Dd/DM31Oqlo3w==';


bot.on('my_chat_member', (msg) => {
    if (msg.new_chat_member.user.username === bot.username && msg.new_chat_member.status === 'member') {
        groupId = msg.chat.id;
        // Bạn có thể lưu chatId này hoặc thực hiện các hành động khác tại đây
        console.log('check groupId', groupId)
    }
});

// ID của chat Telegram mà bạn muốn gửi thông báo đến

// Hàm để gửi thông báo
function sendTelegramMessage(message) {
    bot.sendMessage(groupId, message);
}

// Cấu hình kết nối MySQL
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '12345',
    database: 'gameTX1',
    port: 3306
};

// Tạo kết nối MySQL
const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
    if (err) {
        console.error('Lỗi kết nối đến cơ sở dữ liệu:', err);
        return;
    }
    console.log('Kết nối thành công đến cơ sở dữ liệu.');
});

async function updateGameResult(gameWinUsers, gameLoseUsers) {
    // Tạo chuỗi VALUES cho gameWin
    const gameWinValues = gameWinUsers.map(user => `('${user}', 1, 0)`).join(',');

    // Tạo chuỗi VALUES cho gameLose
    const gameLoseValues = gameLoseUsers.map(user => `('${user}', 0, 1)`).join(',');

    // Kết hợp hai chuỗi VALUES
    const combinedValues = gameWinValues + ',' + gameLoseValues;

    // Câu lệnh SQL
    const sql = `
        INSERT INTO raitiouser (nameUser, gameWin, gameLose)
        VALUES ${combinedValues}
        ON DUPLICATE KEY UPDATE
        gameWin = IF(nameUser IN (${gameWinUsers.map(user => `'${user}'`).join(',')}), gameWin + 1, gameWin),
        gameLose = IF(nameUser IN (${gameLoseUsers.map(user => `'${user}'`).join(',')}), gameLose + 1, gameLose);
    `;
    
    // Thực hiện câu lệnh SQL
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
            return;
        }
        // console.log('Cập nhật cơ sở dữ liệu thành công:', results);
    });
}

async function getTopRankRatio() {
    const sql = `
        select * from raitiouser where ratio > 65 and gameWin> 15 and maxStreakWin > 5;
    `;

    try {
        // Sử dụng hàm queryAsPromise để truy vấn và chờ kết quả
        const results = await queryAsPromise(sql);
        const userNames = results.map(row => row.nameUser);
        return userNames; // Trả về mảng các nameUser
    } catch (error) {
        console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
    }
}

async function getAdminWithStreakWin() {
    const sql = `
    select * from raitiouser where ratio > 65 and gameWin >15 and maxStreakWin >  7 and streakWin >3;
    `;

    try {
        // Sử dụng hàm queryAsPromise để truy vấn và chờ kết quả
        const results = await queryAsPromise(sql);
        const userNames = results.map(row => row.nameUser);
        return userNames; // Trả về mảng các nameUser
    } catch (error) {
        console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
    }
}


// Hàm hỗ trợ thực hiện truy vấn SQL với async/await
function queryAsPromise(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

function hourBusy() {
    let now = new Date();
    let hours = now.getHours();

    // Kiểm tra xem giờ hiện tại có từ 23 (11 PM) đến 7 (7 AM) không
    // Vì 8 AM là giờ 8, nên chúng ta kiểm tra đến 7:59 AM
    return (7 < hours && hours < 11) || (14 < hours && hours < 17) || (19 < hours && hours < 21)

}

function isArrayAllNumbers(array) {
    return array.every(element => typeof element === 'number' && !isNaN(element));
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


async function writeToFile(data) {
    const filePath = path.join(__dirname, './data/dataGameIndex3.txt'); // Thay đổi đường dẫn nếu cần

    try {
        await fs.writeFileSync(filePath, data, 'utf8');
        console.log('Đã ghi dữ liệu vào tệp thành công.');
    } catch (error) {
        console.error('Lỗi khi ghi dữ liệu vào tệp:', error);
    }
}

async function readFromFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data;
    } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ tệp:', error);
        return null;
    }
}

// Hàm tìm phần không trùng của chuỗi mới so với chuỗi cũ
function findNonOverlappingPart(existingString, newString) {
    let index = newString.length;
    while (index > 0 && existingString.includes(newString.substring(0, index))) {
        index--;
    }
    return newString.substring(index);
}

// Hàm tìm chuỗi con trùng lớn nhất và trả về cả phần trùng và phần không trùng
function findOverlapAndNonOverlap(existingString, newString) {
    let longestOverlap = "";
    for (let i = 0; i < newString.length; i++) {
        for (let j = i + 1; j <= newString.length; j++) {
            let substring = newString.slice(i, j);
            if (existingString.endsWith(substring) && substring.length > longestOverlap.length) {
                longestOverlap = substring;
            }
        }
    }
    return {
        overlappingPart: longestOverlap,
        nonOverlappingPart: newString.slice(longestOverlap.length)
    };
}

// Hàm cập nhật file và chuỗi cũ
async function updateFileAndString(filePath, existingString, newString) {
    let { overlappingPart, nonOverlappingPart } = findOverlapAndNonOverlap(existingString, newString);

    // Nếu không tìm thấy phần trùng, giảm dần chuỗi cũ và lặp lại việc tìm kiếm
    while (overlappingPart.length === 0 && existingString.length > 0) {
        existingString = existingString.slice(0, -1); // Cắt bỏ ký tự cuối cùng của chuỗi cũ
        ({ overlappingPart, nonOverlappingPart } = findOverlapAndNonOverlap(existingString, newString));
    }

    // Ghi phần không trùng vào file và cập nhật chuỗi cũ
    if (nonOverlappingPart) {
        await appendToFile(filePath, nonOverlappingPart);
    }
    return existingString + overlappingPart; // Trả về chuỗi cũ đã cập nhật
}

async function appendToFile(filePath, data) {
    if (data == null) {
        console.error('Lỗi: Dữ liệu cố gắng ghi là null hoặc undefined.');
        return;
    }
    try {
        fs.appendFileSync(filePath, data, 'utf8');
        console.log('Đã ghi dữ liệu vào tệp thành công.');
    } catch (error) {
        console.error('Lỗi khi ghi dữ liệu vào tệp:', error);
    }
}

async function foresCast() {
    try {
        const currentDateTime = new Date();
        const currentHour = currentDateTime.getHours();
        let stringStdout = '';
        if (currentHour >= 8 && currentHour < 17) stringStdout = `${linkPy} ${forecastPath} ./data/dataGameIndex3.txt`;
        else stringStdout = `${linkPy} ${forecastPath} ./data/dataGameIndex3.txt`;
        let stdout = await promisifiedExec(stringStdout);
        console.log('check stdout', stdout)
        return JSON.parse(stdout);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

let nguong = 1;
function calculateBetAmount(money) {
    // return Math.floor(money * 0.2 / 1000) * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
    return nguong * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K

}

async function datTai(ws, money, sid) {
    const dataTai = [
        "6",
        "MiniGame",
        "taixiuPlugin",
        {
            cmd: 1000,
            b: money,
            sid: sid,
            aid: 1,
            eid: 1,
            a: false,
        },
    ];
    await sendMessage(ws, dataTai);
    // if (!!groupId)
    //     sendTelegramMessage(`Dự đoán Tài`);
}

async function datXiu(ws, money, sid) {
    const dataTai = [
        "6",
        "MiniGame",
        "taixiuPlugin",
        {
            cmd: 1000,
            b: money,
            sid: sid,
            aid: 2,
            eid: 1,
            a: false,
        },
    ];
    await sendMessage(ws, dataTai);
    // if (!!groupId)
    //     sendTelegramMessage(`Dự đoán Xỉu`);
}

async function sendMessage(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        await ws.send(JSON.stringify(data));
    } else {
        console.error("WebSocket không kết nối hoặc đã đóng.");
    }
}

function startCountdown() {
    clearInterval(interval); // Đảm bảo rằng không có đếm ngược nào đang chạy
    interval = setInterval(() => {
        seconds -= 0.1; // Giảm mỗi lần 0.1 giây

        if (seconds <= 0) {
            clearInterval(interval);
            // Reset seconds back to 6.5 for the next countdown
        }
    }, 100); // 100 milliseconds = 0.1 second
}

function resetCountdown() {
    seconds = 67; // Đặt lại thời gian là 6.5 giây
    startCountdown(); // Bắt đầu lại đếm ngược
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Hàm cập nhật hoặc thêm object vào Map
function updateOrAddObjectToMap(map, key, obj) {
    map.set(key, obj);
}
// Chuyển đổi và sắp xếp Map thành mảng
function sortMapByValue(map) {
    return Array.from(map.entries()).sort((a, b) => b[1].b - a[1].b); // Sắp xếp giảm dần dựa trên giá trị của e.b
}

function heighMapByValue(map) {
    return Array.from(map.entries()).sort((a, b) => a[1].b - b[1].b); // Sắp xếp tăng dần dựa trên giá trị của e.b
}

const isEmptyObject = (v) => {
    return !!v && v.constructor === Object && Object.keys(v).length === 0;
};
// // Hàm tính tổng các giá trị trong mảng đã sắp xếp
// function calculateTotalSum(sortedArray) {
//     return sortedArray.reduce((sum, [key, value]) => sum + value.b, 0);
// }

function getLowestBValueFromMap(map, keys) {
    let lowestBValue = null;
    let lowestBKey = null;

    for (const [key, value] of map) {
        if (keys.includes(key)) {
            if (lowestBValue === null || value.b < lowestBValue.b) {
                lowestBValue = value;
                lowestBKey = key;
                console.log('check Value Admin', lowestBValue)
            }
        }
    }

    return lowestBValue ? { key: lowestBKey, value: lowestBValue } : null;
}

function getHeighBValueFromMapNghich(map, keys) {
    let highestBValue = null;
    let highestBKey = null;

    for (const [key, value] of map) {
        if (keys.includes(key)) {
            if (highestBValue === null || value.b > highestBValue.b) {
                highestBValue = value;
                highestBKey = key;
                console.log('check Value Admin', highestBValue)
            }
        }
    }

    return highestBValue ? { key: highestBKey, value: highestBValue } : null;
}

function lowToHeighMapByValueB(map) {
    return new Map([...map.entries()].sort((a, b) => a[1].b - b[1].b));
}

function getAdminEntriesFromMap(map, adminKeys) {
    return Array.from(map.entries()).filter(([key, value]) => adminKeys.includes(key));
}

const simulateIncrements = (startLow, startHigh, lowIncrements, highIncrements, threshold = 3000000) => {
    let low = startLow;
    let high = startHigh;
    for (let i = 0; i < lowIncrements.length; i++) {
        low += lowIncrements[i];
        high += highIncrements[i];
    }
    // Kiểm tra nếu lệch nhau không quá lớn (dưới ngưỡng)
    if (Math.abs(high - low) <= threshold) {
        return true;
    }
    // Nếu lệch nhau quá lớn, chọn số có biên độ tăng thấp hơn
    return false
};

const calculateProbabilityWithInputs = (startLow, startHigh, lowIncrements, highIncrements) => {
    return simulateIncrements(startLow, startHigh, lowIncrements, highIncrements);
};

let ws;
let seconds = 67;
let interval;

let moneyNow = 19000;
let compareMoneyNow = 0;
let chuoiThang = 0;
let chuoiThua = 0;
let sid = 0;
let daDat = false;
let ketqua = "TAI";
let moneyDat = 0;
let typeDanh = true;
let forecast = {};
const stlDanh = 30000000;
const maxLDanh = 70000000;
let startLow = { value: 0, type: '' }; // Giá trị khởi điểm thấp
let startHigh = { value: 0, type: '' }; // Giá trị khởi điểm cao
let lowIncrements = [];
let highIncrements = [];
let sum_aP = 0;
let sum_rP = 0;
let countaP = 0;
let countrP = 0;

const filePath = path.join(__dirname, './data/dataGameIndex3.txt');

function connectWebSocket() {
    try {
        // Khai báo Map
        const combinedMap = new Map();
        let firstOpen = true;
        let lastIndex = 1;

        const headers = {
            Host: "myniskgw.ryksockesg.net",
            Connection: "Upgrade",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Upgrade: "websocket",
            Origin: "https://play.rik8.vip",
            "Sec-WebSocket-Version": "13",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi,en;q=0.9",
            "Sec-WebSocket-Key": keyWsBet,
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        };

        ws = new WebSocket(
            "wss://myniskgw.ryksockesg.net/websocket",
            null,
            null,
            headers
        );

        ws.onerror = (error) => {
            console.error("Lỗi kết nối WebSocket:", error);
        };

        ws.onopen = async () => {
            console.log("Đã kết nối thành công đến WebSocket.");
            do {
                if (firstOpen) {
                    firstOpen = false;
                    //gửI message đầu
                    const data1 = [
                        1,
                        "MiniGame",
                        "",
                        "",
                        {
                            agentId: "1",
                            accessToken: accessTokenWS,
                            reconnect: false,
                        },
                    ];
                    await sendMessage(ws, data1);
                } else {
                    const data4 = ["7", "MiniGame", "1", lastIndex++];
                    await sendMessage(ws, data4);
                }
                await sleep(5000);
            } while (true);
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            // console.log("check data", JSON.stringify(data));
            // Kiểm tra và cập nhật startHigh và startLow nếu cần
            if (Math.abs(sum_aP - sum_rP) > maxLDanh && startHigh.value === 0 && startLow.value === 0) {
                if (sum_aP > sum_rP) {
                    startHigh = { value: sum_aP, type: 'TAI' };
                    startLow = { value: sum_rP, type: 'XIU' };
                } else {
                    startHigh = { value: sum_rP, type: 'XIU' };
                    startLow = { value: sum_aP, type: 'TAI' };
                }
            }

            // Thu thập giá trị tăng nếu đã xác định startHigh và startLow
            if (startHigh.value !== 0 && startLow.value !== 0) {
                if (startHigh.type === 'TAI') {
                    highIncrements.push(sum_aP - startHigh.value);
                    lowIncrements.push(sum_rP - startLow.value);
                } else {
                    highIncrements.push(sum_rP - startHigh.value);
                    lowIncrements.push(sum_aP - startLow.value);
                }
            }

            if (data?.length && data[1]?.htr?.length) {
                const writeData = data[1]?.htr.map(e => {
                    const dhr1 = e.d1;
                    const dhr2 = e.d2;
                    const dhr3 = e.d3;
                    if (dhr1 + dhr2 + dhr3 > 10) {
                        return 0;
                    } else {
                        return 1;
                    }
                });

                let newString = writeData.join('');
                if (!!newString) {
                    let existingString = await readFromFile(filePath);
                    if (existingString !== null) {
                        existingString = await updateFileAndString(filePath, existingString, newString);
                    } else {
                        await writeToFile(newString);
                    }
                }
            }

            const data2 = [
                6,
                "MiniGame",
                "lobbyPlugin",
                {
                    cmd: 10001,
                },
            ];
            const data3 = ["6", "MiniGame", "taixiuPlugin", { cmd: 1005 }];
            if (data?.length > 0 && data[2] == true) {
                await sendMessage(ws, data2);
                await sendMessage(ws, data3);
                console.log("đã send tin nhắn plugin ");
            }

            if (data?.length > 0 && data[1]?.cmd == 1004 && data[1]?.d1 != 0) {
                const dataXX = data[1];
                // console.log("check data[1]", dataXX);
                const xx1 = dataXX?.d1;
                const xx2 = dataXX?.d2;
                const xx3 = dataXX?.d3;
                let taiArray = Array.from(combinedMap.values()).filter(item => item.type === 'TAI');
                let xiuArray = Array.from(combinedMap.values()).filter(item => item.type === 'XIU');
                let queryWin = [];
                let queryLose = [];
                if (xx1 != 0 && xx2 != 0 && xx3 != 0) {
                    if (xx1 + xx2 + xx3 > 10) {
                        //tài
                        console.log("Kết quả Tài ", xx1 + xx2 + xx3);
                        if (daDat && ketqua == 'TAI') {
                            chuoiThang++;
                            // moneyNow += moneyDat * 0.98;
                        } else if (daDat && ketqua == 'XIU') {
                            chuoiThua++;
                            // moneyNow -= moneyDat;
                        }
                        await appendToFile(filePath, '0');

                        queryWin = taiArray?.map(item => {
                            return item.dn;
                        })
                        queryLose = xiuArray?.map(item => {
                            return item.dn;
                        })
                    } else if (xx1 + xx2 + xx3 <= 10 && xx1 + xx2 + xx3 > 2) {
                        //xỉu
                        console.log("Kết quả Xỉu ", xx1 + xx2 + xx3);
                        if (daDat && ketqua == 'XIU') {
                            chuoiThang++;
                            // moneyNow += moneyDat * 0.98;
                        } else if (daDat && ketqua == 'TAI') {
                            // moneyNow -= moneyDat;
                            chuoiThua++;
                        }
                        await appendToFile(filePath, '1');

                        queryWin = xiuArray?.map(item => {
                            return item.dn;
                        })
                        queryLose = taiArray?.map(item => {
                            return item.dn;
                        })

                    }
                }

                if (!!queryWin && !!queryLose) {
                    await updateGameResult(queryWin, queryLose);
                }

                listAccountAdmin = await getTopRankRatio();
                // console.log('check listAccountAdmin', listAccountAdmin)
                // if (chuoiThua != 0 && chuoiThua > 2 && chuoiThua % 3 != 0) typeDanh = !typeDanh;

                const sortedArray = sortMapByValue(combinedMap);
                // In ra tổng và các object theo thứ tự giá trị giảm dần
                // console.log("Objects sắp xếp theo giá trị giảm dần:", sortedArray);

                resetCountdown();
                if (!!groupId && daDat)
                    sendTelegramMessage(`Số tiền hiện tại ${moneyNow}`);
                daDat = false;
                moneyDat = 0;
                sid = 0;
                startLow = { value: 0, type: '' }; // Giá trị khởi điểm thấp
                startHigh = { value: 0, type: '' }; // Giá trị khởi điểm cao// Giá trị khởi điểm cao
                lowIncrements = [];
                highIncrements = [];
                sum_aP = 0;
                sum_rP = 0;
                countaP = 0;
                countrP = 0;
                compareMoneyNow = moneyNow;
                console.log('Tỷ lệ đánh T-X : ', forecast)
                console.log(`Số lượng Thắng - Thua : ${chuoiThang}-${chuoiThua}. Số tiền hiện tại ${moneyNow} VNĐ`);
                console.log('check tỷ lệ thắng', (chuoiThang / (chuoiThang + chuoiThua)) * 100)
                combinedMap.clear();
            }

            if (data?.length > 0 && data[1]?.cmd == 1008) {
                if (data?.length > 0 && data[1]?.cmd == 1008) {
                    // Xử lý dữ liệu rP và aP, thêm vào combinedMap

                    if (data[1]?.tP?.rP?.length > 0) {
                        for (const obj of data[1]?.tP?.rP) {
                            if (obj.eid == 1) {
                                updateOrAddObjectToMap(combinedMap, obj.dn, {
                                    ...obj,
                                    type: "TAI",
                                });
                            } else {
                                updateOrAddObjectToMap(combinedMap, obj.dn, {
                                    ...obj,
                                    type: "XIU",
                                });
                            }
                        }
                    }

                    if (data[1]?.tP?.aP?.length > 0) {
                        for (const obj of data[1]?.tP?.aP) {
                            if (obj.eid == 1) {
                                updateOrAddObjectToMap(combinedMap, obj.dn, {
                                    ...obj,
                                    type: "TAI",
                                });
                            } else {
                                updateOrAddObjectToMap(combinedMap, obj.dn, {
                                    ...obj,
                                    type: "XIU",
                                });
                            }
                        }
                    }
                    sum_aP = 0;
                    sum_rP = 0;
                    countaP = 0;
                    countrP = 0;

                    combinedMap.forEach((value) => {
                        if (value.type === "TAI") {
                            sum_aP += value.b;
                            countaP++;
                        } else if (value.type === "XIU") {
                            sum_rP += value.b;
                            countrP++;
                        }
                    });
                    sid = data[1]?.sid;
                    // console.log(
                    //     ` PHiên ${sid} Giây thứ ${seconds.toFixed(2)} Hiện tại Tiền 2 cửa TÀI - XỈU : (${countaP}) ${formatNumberWithCommas(
                    //         sum_aP
                    //     )} VNĐ - (${countrP}) ${formatNumberWithCommas(sum_rP)} VNĐ`
                    // );

                    if (sid != 0 && !daDat) {
                        moneyDat = calculateBetAmount(moneyNow);
                        // const sortedArray1 = sortMapByValue(combinedMap);
                        // const gtTopDat = sortedArray1[1][1].type;
                        if (moneyNow > 400000) return;
                        if (compareMoneyNow == moneyNow) daDat = false;

                        if (seconds <= 20 && !daDat && moneyDat != 0 && moneyDat < moneyNow) {

                            if (typeDanh && !daDat && moneyDat != 0) {
                                let sum_aPAdmin = 0;
                                let sum_rPAdmin = 0;
                                let count_aPAdmin = 0;
                                let count_rPAdmin = 0;
                                const adminMap = getAdminEntriesFromMap(combinedMap, listAccountAdmin);
                                console.log('check Admin Đặt ', adminMap)
                                adminMap.forEach(([key, value]) => {  // Sử dụng destructuring để lấy key và value
                                    if (value.type === "TAI") {
                                        sum_aPAdmin += value.b;
                                        count_aPAdmin++;
                                    } else if (value.type === "XIU") {
                                        sum_rPAdmin += value.b;
                                        count_rPAdmin++
                                    }
                                });
                                console.log("check sum_aPAdmin", sum_aPAdmin, " check sum_rPAdmin", sum_rPAdmin)
                                let keyDat = 99;
                                // if ((sum_aPAdmin < sum_rPAdmin && sum_aPAdmin != 0 && sum_rPAdmin != 0 && sum_aPAdmin > 1000000) || (sum_aPAdmin != 0 && sum_aPAdmin < 1500000 && sum_rPAdmin == 0)) keyDat = 0;
                                // else if ((sum_aPAdmin > sum_rPAdmin && sum_aPAdmin != 0 && sum_rPAdmin != 0 && sum_rPAdmin > 1000000) || (sum_rPAdmin != 0 && sum_rPAdmin < 1500000 && sum_aPAdmin == 0)) keyDat = 1

                                if ((sum_aPAdmin < sum_rPAdmin && sum_aPAdmin > 200000 && sum_rPAdmin > 200000) || (sum_aPAdmin != 0 && sum_aPAdmin < 1500000 && sum_rPAdmin == 0 && sum_aPAdmin > 200000)) keyDat = 0;
                                else if ((sum_aPAdmin > sum_rPAdmin && sum_aPAdmin > 200000 && sum_rPAdmin > 200000) || (sum_rPAdmin != 0 && sum_rPAdmin < 1500000 && sum_aPAdmin == 0 && sum_rPAdmin > 200000)) keyDat = 1
                                switch (keyDat) {
                                    case 0:
                                        await datTai(ws, moneyDat, sid);
                                        daDat = true;
                                        ketqua = 'TAI'
                                        break;

                                    case 1:
                                        await datXiu(ws, moneyDat, sid);
                                        daDat = true;
                                        ketqua = 'XIU'
                                        break;
                                    default:
                                        break;
                                }

                                // console.log(' đã vô đâyyyyyyyyyyyyyyy')
                                // if (count_aPAdmin > count_rPAdmin ) {
                                //     await datTai(ws, moneyDat, sid);
                                //     daDat = true;
                                //     ketqua = 'TAI';
                                // } else if (count_aPAdmin < count_rPAdmin ) {
                                //     await datXiu(ws, moneyDat, sid);
                                //     daDat = true;
                                //     ketqua = 'XIU'
                                // } else if (count_aPAdmin == count_rPAdmin && sum_aPAdmin > sum_rPAdmin) {
                                //     await datTai(ws, moneyDat, sid);
                                //     daDat = true;
                                //     ketqua = 'TAI';
                                // } else if (count_aPAdmin == count_rPAdmin && sum_aPAdmin < sum_rPAdmin) {
                                //     await datXiu(ws, moneyDat, sid);
                                //     daDat = true;
                                //     ketqua = 'XIU';
                                // }


                            }

                            // if (!isEmptyObject(forecast) && forecast?.probability[0] > 85 && moneyDat != 0) {
                            //     await datTai(ws, moneyDat, sid);
                            //     daDat = true;
                            //     ketqua = 'TAI'
                            //     console.log(`Số tiền đã đặt THEO TI LE ${moneyDat}`)
                            // }

                            // else if (!isEmptyObject(forecast) && forecast?.probability[1] > 85) {
                            //     await datXiu(ws, moneyDat, sid);
                            //     daDat = true;
                            //     ketqua = 'XIU'
                            //     console.log(`Số tiền đã đặt THEO TI LE ${moneyDat}`)
                            // }


                        }
                        if (seconds <= 7.2 && moneyDat != 0 && !daDat) {// kiểu dân dã ko có top
                            // && forecast?.probability[1] > forecast?.probability[0]
                            // && countrP > countaP


                            // if (startHigh?.value != 0 && startLow?.value != 0 && !daDat) {
                            //     const result = calculateProbabilityWithInputs(startLow.value, startHigh.value, lowIncrements, highIncrements);
                            //     if (result) {
                            //         if (startHigh?.type == 'TAI') {
                            //             await datTai(ws, moneyDat, sid);
                            //             daDat = true;
                            //             ketqua = 'TAI'
                            //             console.log(`Số tiền đặt tài dựa theo biên độ tăng ${moneyDat}`)
                            //         } else if (startHigh?.type == 'XIU') {
                            //             await datXiu(ws, moneyDat, sid);
                            //             daDat = true;
                            //             ketqua = 'XIU'
                            //             console.log(`Số tiền đặt tài dựa theo biên độ tăng ${moneyDat}`)
                            //         }
                            //     }
                            // }
                            // const sortedArray = sortMapByValue(combinedMap);
                            // console.log('check Top ĐẶT', sortedArray[1][1])
                            // if (sum_aP > sum_rP && sum_aP - sum_rP < stlDanh && moneyDat != 0 && !daDat && sortedArray.length && (typeDanh == true ? sortedArray[1][1]?.type != 'XIU' : true) && Math.abs(sum_aP - sum_rP) > 5000000) {
                            //     // && sortedArray1[1][1].type != 'XIU'
                            //     await datXiu(ws, moneyDat, sid);
                            //     daDat = true;
                            //     ketqua = 'XIU'
                            //     console.log(`Số tiền đã đặt XỈU ${moneyDat}`)
                            //     console.log('check Top ĐẶT sau khi dưới 6s', sortedArray[1][1])

                            //     //&& countaP > countrP
                            //     // && forecast?.probability[0] > forecast?.probability[1]
                            // } else if (sum_rP > sum_aP && sum_rP - sum_aP < stlDanh && moneyDat != 0 && !daDat && sortedArray.length && (typeDanh == true ? sortedArray[1][1]?.type != 'TAI' : true) && Math.abs(sum_rP - sum_aP) > 5000000) {
                            //     await datTai(ws, moneyDat, sid);
                            //     daDat = true;
                            //     ketqua = 'TAI'
                            //     console.log(`Số tiền đã đặt TÀI ${moneyDat}`)
                            //     console.log('check Top ĐẶT', sortedArray[1][1])
                            // }
                        }//ESLE type đánh còn lại
                    }
                }
            }
        };

        ws.onclose = async () => {
            console.log("Đã đóng kết nối đến WebSocket.");
            setTimeout(connectWebSocket, 5000); // Thử kết nối lại sau 5 giây
        };
    } catch (e) {
        console.log("check e", e);
        return {
            EC: 1,
            EM: `Lỗi gì đó`,
        };
    }
}

connectWebSocket();


let ws2;
let doSend = false;
let flagCallLoopWs2 = false;
let lastIndexWsGold = 1;
let lastMoneyHigh = 100000;

function connectWebSocketSecond() {
    try {
        // Khai báo Map
        let firstOpen = true;
        const headers = {
            Host: "cardskgw.ryksockesg.net",
            Connection: "Upgrade",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Upgrade: "websocket",
            Origin: "https://play.rik8.vip",
            "Sec-WebSocket-Version": "13",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi,en;q=0.9",
            "Sec-WebSocket-Key": keyWsGetGold,
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        };

        ws2 = new WebSocket(
            "wss://cardskgw.ryksockesg.net/websocket",
            null,
            null,
            headers
        );

        ws2.onerror = (error) => {
            console.error("Lỗi kết nối WebSocket:", error);
        };
        ws2.onopen = async () => {
            console.log("Đã kết nối thành công đến WebSocket.");
            if (firstOpen) {
                firstOpen = false;
                //gửI message đầu
                const data1 = [
                    1,
                    "Simms",
                    "",
                    "",
                    {
                        "agentId": "1",
                        "accessToken": accessTokenWS,
                        "reconnect": false
                    }
                ]
                await sendMessage(ws2, data1);
            }
        }

        ws2.onmessage = async (event) => {
            const data_WS2 = JSON.parse(event.data);
            const data2_Ws2 = [
                6,
                "Simms",
                "channelPlugin",
                {
                    "cmd": "306",
                    "subi": true
                }
            ]

            if (data_WS2?.length > 0 && data_WS2[1]?.As?.gold) {
                console.log('check data data_WS2 Reviced', data_WS2)
                moneyNow = data_WS2[1]?.As?.gold;
                console.log('Getmoney', moneyNow)

                if (moneyNow > lastMoneyHigh) {
                    lastMoneyHigh += 100000;
                    nguong++;
                }
            }

            if (data_WS2?.length > 0 && data_WS2[1]?.cmd == 104) {
                await sendMessage(ws2, data2_Ws2);
                flagCallLoopWs2 = true;
                await sleep(4000);
                const data4 = [
                    "7",
                    "Simms",
                    "1",
                    lastIndexWsGold++
                ];
                await sendMessage(ws2, data4);
            }

            if (flagCallLoopWs2 && data_WS2?.length == 3 && isArrayAllNumbers(data_WS2)) {
                console.log('check data data_WS2 Reviced', data_WS2)
                await sleep(5000);
                const data5 = [
                    "7",
                    "Simms",
                    "1",
                    lastIndexWsGold++
                ];
                await sendMessage(ws2, data5);
            }

        };

        ws2.onclose = async () => {
            console.log("Đã đóng kết nối đến WebSocket. ws2");
            flagCallLoopWs2 = false;
            lastIndexWsGold = 1;
            setTimeout(connectWebSocketSecond, 5000); // Thử kết nối lại sau 5 giây
        };
    } catch (e) {
        console.log("check e", e);
        return {
            EC: 1,
            EM: `Lỗi gì đó`,
        };
    }
}

connectWebSocketSecond();