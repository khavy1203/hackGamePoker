const WebSocket = require("websocket").w3cwebsocket;
require("dotenv").config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const { match } = require("assert");
const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py";
const phantichloidanhPY = "./pyLib/phantichLoiDanh.py";

const botToken = '6362272675:AAHVyUsYx_YF1gUIfXMwip1WqxL8U2TPino';
let groupId = '-4085050404';
// Thay thế 'YOUR_TELEGRAM_BOT_TOKEN' bằng token của bot Telegram bạn đã tạo
const bot = new TelegramBot(botToken, { polling: true });

let listAccountAdmin = [];

const accessTokenWS = '29-a7d408d763b6e80699f27a97da9cdad6';

const keyWsBet = 'hyofpDWk1ok/ZScCIssV3A==';

const keyWsGetGold = 'bNay3g3AgjBYQ0mAlW1TWQ==';

const moneyDevide = 30;
const nguongMoney = 900000;
let lastMoneyHigh = 600000;
let moneyDat = 0;

let turnOffManual = false;

let nghi5CayWinThong = false;
let demNghi = 1;

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
        INSERT INTO raitiousermd5 (nameUser, gameWin, gameLose)
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
        SELECT * FROM gametx1.raitiousermd5 where maxStreakWin > 14;
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
    select * from raitiousermd5 where ratio > 65 and gameWin >15 and maxStreakWin >  7 and streakWin >3;
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

const urlGetTopRank = 'https://bordergw.api-inovated.com/gwms/v1/rank.aspx?type=turnover&from=0&size=100&gid=vgmn_101';

const headersGetTopRank = {
    'Accept': '*/*',
    'Accept-Language': 'vi',
    'Content-Type': 'application/json',
    'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'X-Token': '86f89f6f732b535e798e2476f6778402',
    'Referer': 'https://play.rikvip.win/',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

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

async function datTai(ws, money, sid) {
    const dataTai = ["6", "MiniGame", "taixiuMd5Plugin", { "cmd": 7002, "b": money, "sid": sid, "aid": 1, "eid": 1, "sqe": false, "a": false }];
    console.log('check dataTai', dataTai)
    if (moneyNow < nguongMoney) {
        const pr1 = await sendMessage(ws, dataTai);
        await Promise.all([pr1]);
    }
    // if (!!groupId)
    //     sendTelegramMessage(`Dự đoán Tài`);
}

async function datXiu(ws, money, sid) {
    const dataXiu = ["6", "MiniGame", "taixiuMd5Plugin", { "cmd": 7002, "b": money, "sid": sid, "aid": 1, "eid": 2, "sqe": false, "a": false }];
    console.log('check dataXiu', dataXiu)
    if (moneyNow < nguongMoney) {
        const pr1 = await sendMessage(ws, dataXiu);
        await Promise.all([pr1]);
    }
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
    const sqlQuery = `SELECT * FROM raitiousermd5 WHERE nameUser IN (${userKeys.map(name => `'${name}'`).join(',')});`;

    try {
        const results = await queryAsPromise(sqlQuery);
        const userData = results?.reduce((acc, row) => {
            const valueU = combinedMap.get(row.nameUser);
            if ((row.ratio > 70 && row.gameWin > 15) || row.maxStreakWin >= 15) {
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

// Chuyển đổi và sắp xếp Map thành mảng
function sortMapByValue(map) {
    return Array.from(map.entries()).sort((a, b) => b[1].b - a[1].b); // Sắp xếp giảm dần dựa trên giá trị của e.b
}

function calculateBetAmount(money) {
    return Math.floor(money / 1000) * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
let ws;
let seconds = 67;
let interval;

let moneyNow = 1000000;
let chuoiThang = 0;
let chuoiThua = 0;
let chuoiThuaLienTiep = 0;
let chuoiThangLienTiep = 0;
let sid = 0;
let daDat = false;
let ketqua = "TAI";
let typeDanh = false;
let chuoithuacaonhat = 0;
let chuoithangcaonhat = 0;
let tongTienThuaLienTiep = 0;
let khoangcachthanglonnhat = 0;
let khoangcachthualonnhat = 0;
const nguongLechThap = 10000000;
const nguongLechCao = 80000000;
let typeDatTX = 0;

let B_tU;
let B_tB;
let S_tU;
let S_tB;
let flagGetRank = false;
let listTopBet = {};

let sum_aPAdmin = 0;
let sum_rPAdmin = 0;
let count_aPAdmin = 0;
let count_rPAdmin = 0;

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
            Origin: "https://play.rikvip.win",
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

            const data2 = [
                6,
                "MiniGame",
                "lobbyPlugin",
                {
                    cmd: 10001,
                },
            ];
            const data3 = ["6", "MiniGame", "taixiuMd5Plugin", { cmd: 7000 }];
            if (data?.length > 0 && data[2] == true) {
                await sendMessage(ws, data2);
                await sendMessage(ws, data3);
                console.log("đã send tin nhắn plugin ");
            }

            if (data?.length > 0 && data[1]?.cmd == 7006 && data[1]?.d1 != 0) {

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
                            chuoiThangLienTiep++;
                        } else if (daDat && ketqua == 'XIU') {
                            chuoiThua++;
                            chuoiThuaLienTiep++;
                            chuoiThangLienTiep = 0;
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
                            chuoiThuaLienTiep = 0;
                            chuoiThangLienTiep++;
                        } else if (daDat && ketqua == 'TAI') {
                            chuoiThua++;
                            chuoiThuaLienTiep++;
                            chuoiThangLienTiep = 0;
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
                if (chuoiThuaLienTiep > chuoithuacaonhat) chuoithuacaonhat = chuoiThuaLienTiep;
                if (chuoiThangLienTiep > chuoithangcaonhat) chuoithangcaonhat = chuoiThangLienTiep;

                if (!!queryWin && !!queryLose) {
                    await updateGameResult(queryWin, queryLose);
                }

                flagGetRank = false;
                listAccountAdmin = await getTopRankRatio();
                resetCountdown();
                daDat = false;
                sid = 0;
                compareMoneyNow = moneyNow;
                if (chuoiThang - chuoiThua > khoangcachthanglonnhat) khoangcachthanglonnhat = chuoiThang - chuoiThua;
                if (chuoiThua - chuoiThang > khoangcachthualonnhat) khoangcachthualonnhat = chuoiThua - chuoiThang;
                console.log(`Tổng TÀI - XỈU : ${formatNumberWithCommas(data[1].bs[1].v)} - ${formatNumberWithCommas(data[1].bs[0].v)}`)

                console.log(`Số lượng Thắng - Thua : ${chuoiThang}-${chuoiThua}. Số tiền hiện tại ${moneyNow} VNĐ`);
                console.log('Check tỷ lệ thắng', (chuoiThang / (chuoiThang + chuoiThua)) * 100, '%')
                console.log('Chuỗi thua tối đa', chuoithuacaonhat)
                console.log('Chuỗi thắng tối đa', chuoithangcaonhat)
                console.log(`Khoảng cách thắng - thua lớn nhất ${khoangcachthanglonnhat} - ${khoangcachthualonnhat}`)
                console.log('Đếm nghỉ ', demNghi, ' - ', nghi5CayWinThong)
                console.log('----------------------PHIÊN MỚI----------------------')

                // if (chuoiThangLienTiep == 5) nghi5CayWinThong = true;

                // if (demNghi > 4 && chuoiThangLienTiep > 0) {
                //     nghi5CayWinThong = false;
                //     demNghi = 1;
                // }
                const messageEnoughSend = `
TÀI-XỈU : ${formatNumberWithCommas(data[1].bs[1].v)} - ${formatNumberWithCommas(data[1].bs[0].v)}
TÀI-XỈU(TopPut):(${count_aPAdmin})${formatNumberWithCommas(sum_aPAdmin)}-(${count_rPAdmin})${formatNumberWithCommas(sum_rPAdmin)}
Type đặt: ${typeDatTX}
Đã đặt và kết quả ${ketqua} - ${xx1 + xx2 + xx3 > 10 ? 'TAI' : 'XIU'}
Số lượng Thắng - Thua : ${chuoiThang}-${chuoiThua}. Số tiền hiện tại ${moneyNow} VNĐ
Check tỷ lệ thắng ${((chuoiThang / (chuoiThang + chuoiThua)) * 100).toFixed(2)}%
Chuỗi thua tối đa ${chuoithuacaonhat}
Chuỗi thắng tối đa ${chuoithangcaonhat}
Khoảng cách thắng - thua lớn nhất ${khoangcachthanglonnhat} - ${khoangcachthualonnhat}
                `
                sendTelegramMessage(messageEnoughSend);

                sum_aPAdmin = 0;
                sum_rPAdmin = 0;
                count_aPAdmin = 0;
                count_rPAdmin = 0;
                combinedMap.clear();

            }

            if (data?.length > 0 && data[1]?.cmd == 7007) {

                if (data?.length > 0 && data[1]?.cmd == 7007) {
                    // Xử lý dữ liệu rP và aP, thêm vào combinedMap
                    if (!flagGetRank) {
                        listTopBet = await axios.post(urlGetTopRank, {}, { headers: headersGetTopRank })
                            .then(response => {
                                return response.data.data.map(e => e.fullname);
                            })
                            .catch(error => {
                                console.error(error); // handle error
                            });
                        flagGetRank = true;
                    }
                    let dataTai = data[1]?.bs?.filter(e => e.eid == 1)[0];
                    let dataXiu = data[1]?.bs?.filter(e => e.eid == 2)[0];
                    B_tU = dataTai?.bc;
                    B_tB = dataTai?.v;
                    S_tU = dataXiu?.bc;
                    S_tB = dataXiu?.v;
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
                    moneyNow = 600000;
                    moneyDat = calculateBetAmount(lastMoneyHigh / moneyDevide);
                    if (sid != 0 && !daDat && moneyDat < moneyNow && !turnOffManual) {
                        // if (moneyNow > nguongMoney) {
                        //     if (!!groupId)
                        //         sendTelegramMessage(`Money Now đã vượt ngưỡng hãy rút tiền ${moneyNow}`);
                        //     turnOffManual = true;
                        //     return;
                        // }
                        if (seconds < 9 && !daDat) {
                            if (typeDanh) {
                                const pr1 = await getUserDataFromDB(combinedMap);
                                if (pr1 != null) {
                                    l
                                    const stringStdout = `${linkPy} ${phantichloidanhPY} ./data/userData.json`;
                                    let stdout = JSON.parse(await promisifiedExec(stringStdout));
                                    await Promise.all([pr1]);
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
                                    console.log(`tỉ lệ tài xỉu :  ${ratio1}% - ${ratio2}%`)

                                    let valueCompare1 = ratio1 >= (ratio2 + 20) ? true : false;
                                    let valueCompare2 = ratio2 >= (ratio1 + 20) ? true : false;

                                    if (valueCompare2 && !daDat) {
                                        console.log('đã đặt tài')
                                        ketqua = 'TAI';
                                        daDat = true;
                                        // const pr2 = await datTai(ws, moneyDat, sid)
                                        // await Promise.all([pr2]);
                                    }
                                    else if (valueCompare1 && !daDat) {
                                        console.log('đã đặt xỉu')
                                        daDat = true;
                                        ketqua = 'XIU';
                                        // const pr3 = await datXiu(ws, moneyDat, sid)
                                        // await Promise.all([pr3]);
                                    }
                                }
                            } else {

                                console.log('length-listTopBet', listTopBet.length)
                                if (listTopBet && Array.isArray(listTopBet) && listTopBet?.length > 0) {
                                    const adminMap = getAdminEntriesFromMap(combinedMap, listTopBet);
                                    console.log('check adminMap', adminMap)
                                    adminMap.forEach(([key, value]) => {  // Sử dụng destructuring để lấy key và value
                                        if (value.type === "TAI") {
                                            sum_aPAdmin += value.b;
                                            count_aPAdmin++;
                                        } else if (value.type === "XIU") {
                                            sum_rPAdmin += value.b;
                                            count_rPAdmin++;
                                        }
                                    });

                                    console.log(`Tổng tiền TÀI - XỈU : (${count_aPAdmin})${formatNumberWithCommas(sum_aPAdmin)} - (${count_rPAdmin})${formatNumberWithCommas(sum_rPAdmin)}`)
                                    // if (nghi5CayWinThong == true) {
                                    //     demNghi++;
                                    //     daDat = true;
                                    //     ketqua = 'NONE';
                                    // } else {
                                    // }
                                    const sumTotalTai = data[1].bs[1].v;
                                    const sumTotalXiu = data[1].bs[0].v;
                                    const lechSum = Math.abs(sumTotalTai - sumTotalXiu);
                                    const lechTopPut = Math.abs(sum_aPAdmin - sum_rPAdmin);
                                    // if ((lechSum < 15000000 && lechTopPut < 10000000 && lechTopPut > 1000000)) {
                                    //     if ((sum_aPAdmin > sum_rPAdmin && sumTotalTai > sumTotalXiu) || (sum_aPAdmin > sum_rPAdmin && sumTotalTai < sumTotalXiu)) {
                                    //         console.log('đã đặt tài')
                                    //         ketqua = 'TAI';
                                    //         daDat = true;
                                    //         const pr2 = await datTai(ws, moneyDat, sid)
                                    //         typeDatTX = 1;
                                    //         await Promise.all([pr2])
                                    //     } else if ((sum_rPAdmin > sum_aPAdmin && sumTotalXiu > sumTotalTai) || (sum_rPAdmin > sum_aPAdmin && sumTotalXiu < sumTotalTai)) {
                                    //         console.log('đã đặt xỉu')
                                    //         daDat = true;
                                    //         ketqua = 'XIU';
                                    //         const pr3 = await datXiu(ws, moneyDat, sid);
                                    //         typeDatTX = 1;
                                    //         await Promise.all([pr3]);
                                    //     }
                                    // } else 
                                    if (lechTopPut < 10000000 && lechSum < 20000000) {
                                        if (sumTotalTai > sumTotalXiu) {
                                            console.log('đã đặt xỉu')
                                            daDat = true;
                                            ketqua = 'XIU';
                                            const pr3 = await datXiu(ws, moneyDat, sid)
                                            typeDatTX = 2;
                                            await Promise.all([pr3]);
                                        } else if (sumTotalTai < sumTotalXiu) {
                                            console.log('đã đặt tài')
                                            ketqua = 'TAI';
                                            daDat = true;
                                            const pr2 = await datTai(ws, moneyDat, sid);
                                            typeDatTX = 2;
                                            await Promise.all([pr2])
                                        }
                                    } 
                                     
                                    else {
                                        daDat = true;
                                        typeDatTX = 0;
                                        ketqua = 'NONE';
                                    }

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
            Origin: "https://play.rikvip.win",
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
                    lastMoneyHigh = moneyNow;
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