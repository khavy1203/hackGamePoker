const WebSocket = require("websocket").w3cwebsocket;
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py";
const phantichloidanhPY = "./pyLib/phantichLoiDanh.py";

const botToken = '6362272675:AAHVyUsYx_YF1gUIfXMwip1WqxL8U2TPino';
let groupId = '-4085050404';
// Thay thế 'YOUR_TELEGRAM_BOT_TOKEN' bằng token của bot Telegram bạn đã tạo
const bot = new TelegramBot(botToken, { polling: true });

let listAccountAdmin = [];

const accessTokenWS = '29-fd85088b4b6f1b77b77f1a666c140187';

const keyWsBet = 'TXFFXtxDnM1e9TQpi2NRMg==';

const keyWsGetGold = '8x72gsn4/+gx7OsarVE1GQ==';

const nguongMoney = 400000;
const nguongLocUser = 20000000;
let moneyDat = 100000;
let turnOffManual = false;

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
        SELECT * FROM gametx1.raitiouser where maxStreakWin > 14;
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
    const filePath = path.join(__dirname, './data/userData.json'); // Thay đổi đường dẫn nếu cần

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

function extractLastMatchingArray(str) {
    // Cập nhật biểu thức chính quy
    const regex = /\[(True|False)(?:, (True|False))*\]/g;
    let matches = str.match(regex);

    if (!matches || matches.length === 0) {
        return "Không tìm thấy mảng phù hợp trong chuỗi.";
    }

    // Trích xuất chuỗi cuối cùng phù hợp
    const lastMatch = matches[matches.length - 1];

    // Chuyển đổi chuỗi thành mảng
    const array = JSON.parse(lastMatch.replace(/True/g, 'true').replace(/False/g, 'false'));

    return array;
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


let nguong = 1;
function calculateBetAmount(money) {
    return Math.floor(money * 0.1 / 1000) * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
    // return nguong * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K

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
    // console.log('check dataTai', dataTai)
    // const pr1 = await sendMessage(ws, dataTai);
    // await Promise.all([pr1]);

    // if (!!groupId)
    //     sendTelegramMessage(`Dự đoán Tài`);
}

async function datXiu(ws, money, sid) {
    const dataXiu = [
        "6",
        "MiniGame",
        "taixiuPlugin",
        {
            cmd: 1000,
            b: money,
            sid: sid,
            aid: 1,
            eid: 2,
            a: false,
        },
    ];
    console.log('check dataXiu', dataXiu)

    // const pr1 = await sendMessage(ws, dataXiu);
    // await Promise.all([pr1]);
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

async function getUserDataFromDB(combinedMap) {
    const userKeys = Array.from(combinedMap.keys());
    const sqlQuery = `SELECT * FROM raitiouser WHERE nameUser IN (${userKeys.map(name => `'${name}'`).join(',')});`;

    try {
        const results = await queryAsPromise(sqlQuery);
        const userData = results?.reduce((acc, row) => {
            const valueU = combinedMap.get(row.nameUser);
            if ((row.ratio > 55 && row.gameWin > 10 ) || row.maxStreakWin >= 15) {
                if (valueU) {
                    acc.userData.push({
                        user_id: row.nameUser,
                        ratio: row.ratio,
                        bet_amount_tai: valueU.type === "TAI" ? valueU.b : 0,
                        bet_amount_xiu: valueU.type === "XIU" ? valueU.b : 0,
                        total_win: row.gameWin,
                        total_lose: row.gameLose,
                        max_consecutive_win: row.maxStreakWin,
                        current_win_streak: row.streakWin,
                        result: valueU.type === "TAI" ? 1 : 2
                    });
                    acc.sumTai += valueU.type === "TAI" ? valueU.b : 0;
                    acc.sumXiu += valueU.type === "XIU" ? valueU.b : 0;
                }
            }
            return acc;
        }, { userData: [], sumTai: 0, sumXiu: 0 });
        if (userData?.userData?.length > 0) {
            const jsonUserData = JSON.stringify(userData.userData);
            await writeToFile(jsonUserData);

            console.log(`Tổng Tài: ${userData.sumTai}, Tổng Xỉu: ${userData.sumXiu}`);
            return {
                SumTai: userData.sumTai,
                SumXiu: userData.sumXiu
            };
        }
        return null;

    } catch (error) {
        console.error('Lỗi khi truy vấn cơ sở dữ liệu:', error);
        return null;
    }
}


function getFirstExistingValue(map, keys) {
    for (const key of keys) {
        if (map.has(key)) {
            return map.get(key); // Trả về giá trị của khóa đầu tiên tồn tại
        }
    }
    return null; // Trả về null nếu không tìm thấy khóa nào tồn tại
}

// Thêm hàm để kiểm tra dữ liệu trong file JSON
async function isUserDataAvailable(filePath) {
    try {
        const data = await readFromFile(filePath);
        return data && data.length > 0;
    } catch (error) {
        console.error('Lỗi khi kiểm tra dữ liệu từ tệp:', error);
        return false;
    }
}

let ws;
let seconds = 67;
let interval;


let moneyNow = 1000000;
let chuoiThang = 0;
let chuoiThua = 0;
let chuoiThuaLienTiep = 0;
let sid = 0;
let daDat = false;
let ketqua = "TAI";
let typeDanh = true;

let chuoithuaCaonhat = 0;

let B_tU;
let B_tB;
let S_tU;
let S_tB;

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
                const xx1 = dataXX?.d1;
                const xx2 = dataXX?.d2;
                const xx3 = dataXX?.d3;
                let taiArray = Array.from(combinedMap.values()).filter(item => item.type === 'TAI');
                let xiuArray = Array.from(combinedMap.values()).filter(item => item.type === 'XIU');
                let queryWin = [];
                let queryLose = [];
                if (xx1 != 0 && xx2 != 0 && xx3 != 0) {
                    if (xx1 + xx2 + xx3 > 10) {

                        console.log("Kết quả Tài ", xx1 + xx2 + xx3);
                        if (daDat && ketqua == 'TAI') {
                            chuoiThang++;
                            chuoiThuaLienTiep = 0;
                        } else if (daDat && ketqua == 'XIU') {
                            chuoiThua++;
                            chuoiThuaLienTiep++;
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
                            chuoiThuaLienTiep = 0
                        } else if (daDat && ketqua == 'TAI') {
                            chuoiThua++;
                            chuoiThuaLienTiep++;
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
                if(chuoiThuaLienTiep>chuoithuaCaonhat) chuoithuaCaonhat = chuoiThuaLienTiep;

                if (!!queryWin && !!queryLose) {
                    await updateGameResult(queryWin, queryLose);
                }

                listAccountAdmin = await getTopRankRatio();

                resetCountdown();
                daDat = false;
                sid = 0;
                compareMoneyNow = moneyNow;
                console.log(`Số lượng Thắng - Thua : ${chuoiThang}-${chuoiThua}. Số tiền hiện tại ${moneyNow} VNĐ`);
                console.log('check tỷ lệ thắng', (chuoiThang / (chuoiThang + chuoiThua)) * 100)
                console.log('Chuỗi thua tối đa', chuoithuaCaonhat)
                combinedMap.clear();
                // if(chuoiThuaLienTiep != 0 && chuoiThuaLienTiep % 8 == 0){
                //     typeDanh = !typeDanh;
                //     console.log('đổi kiểu đánh : ', typeDanh)
                // } 
                console.log('type đặt hiện tại', typeDanh)
            }

            if (data?.length > 0 && data[1]?.cmd == 1008) {

                if (data?.length > 0 && data[1]?.cmd == 1008) {
                    // Xử lý dữ liệu rP và aP, thêm vào combinedMap
                    B_tU = data[1]?.gi[0]?.B?.tU;
                    B_tB = data[1]?.gi[0]?.B?.tB;
                    S_tU = data[1]?.gi[0]?.S?.tU;
                    S_tB = data[1]?.gi[0]?.S?.tB;

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
                    sid = data[1]?.sid;
                    moneyNow = 9999999999999;
                    if (sid != 0 && !daDat && moneyDat < moneyNow && !turnOffManual) {
                        // if (moneyNow > nguongMoney) {
                        //     if (!!groupId)
                        //         sendTelegramMessage(`Money Now đã vượt ngưỡng hãy rút tiền ${moneyNow}`);
                        //     turnOffManual = true;
                        //     return;
                        // }

                        let abs = Math.abs(B_tB - S_tB)
                        if (seconds < 15 && seconds > 7 && !daDat) {

                            console.log('check seconds', seconds)
                            const pr1 = await getUserDataFromDB(combinedMap);
                            if (pr1 != null) {
                                const stringStdout = `${linkPy} ${phantichloidanhPY} ./data/userData.json`;
                                let stdout = JSON.parse(await promisifiedExec(stringStdout));
                                await Promise.all([pr1]);

                                console.log('check stdout', stdout)
                                let count1 = 0;
                                let count2 = 0;
                                stdout.predictions.forEach(element => {
                                    if (element === 1) {
                                        count1++;
                                    } else if (element === 2) {
                                        count2++;
                                    }
                                });
                                const totalElements = stdout.predictions.length;

                                const ratio1 = ((count1 / totalElements) * 100).toFixed(2);
                                const ratio2 = ((count2 / totalElements) * 100).toFixed(2);
                                console.log(`Dự đoán Tỷ lệ số TÀI: ${ratio1} %`);
                                console.log(`Dự đoánTỷ lệ số XỈU: ${ratio2} %`);
                                console.log(`Số lượng đặt Tài và Xỉu mỗi bên ${B_tB} (${B_tU})  -  ${S_tB} (${S_tU})`)
                                // && B_tB < S_tB
                                // && S_tB < B_tB

                                let valueCompare1 = typeDanh ? ratio1 >= (ratio2 + 20) : ratio2 >= (ratio1 + 20);
                                let valueCompare2 = typeDanh ? ratio2 >= (ratio1 + 20) : ratio1 >= (ratio2 + 20);
                                //&& && abs > 10000000
                                // && pr1.SumTai < pr1.SumXiu
                                //&& pr1.SumXiu < pr1.SumTai
                                //&& ( B_tB < S_tB || abs < 40000000)
                                console.log('check pr1', pr1)
                                // if(typeDanh)
                                if ( valueCompare2 && !daDat  ) {
                                    console.log('đã đặt tài')
                                    ketqua = 'TAI';
                                    daDat = true;
                                    const pr2 = await datTai(ws, moneyDat, sid)
                                    await Promise.all([pr2]);
                                }
                                //&& S_tB < B_tB && abs > 10000000 &&
                                // && pr1.SumXiu < pr1.pr1.SumTai
                                //&& pr1.SumXiu > pr1.SumTai
                                //&& ( B_tB > S_tB || abs < 40000000)
                                else if ( valueCompare1 && !daDat ) {
                                    console.log('đã đặt xỉu')
                                    daDat = true;
                                    ketqua = 'XIU';
                                    const pr3 = await datXiu(ws, moneyDat, sid)
                                    await Promise.all([pr3]);
                                }
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


let ws2;
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