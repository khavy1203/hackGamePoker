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

const keyWsBet = 'iPITkKIZLkX7FcOfEqzhrA==';

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
    database: 'gameTX1_vip79',
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
let startLow = { value: 0, type: '' }; // Giá trị khởi điểm thấp
let startHigh = { value: 0, type: '' }; // Giá trị khởi điểm cao
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
            Host: "minygwzi.apiwbaybaksosk.com",
            Connection: "Upgrade",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Upgrade: "websocket",
            Origin: "https://play.vip79.win",
            "Sec-WebSocket-Version": "13",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi,en;q=0.9",
            "Sec-WebSocket-Key": keyWsBet,
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        };

        ws = new WebSocket(
            "wss://minygwzi.apiwbaybaksosk.com/websocket",
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

                const sortedArray = sortMapByValue(combinedMap);

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

                            }

                        }
                     
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
