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
// const bot = new TelegramBot(botToken, { polling: true });

let listAccountAdmin = [];

const accessTokenWS = '1-338aa0c04d475b31e903b39933cfcf06';

const keyWsBet = 'JsqK5VEnDBcYby+46ehZ7w==';

const keyWsGetGold = 'JrXaajp+bInj5GWwiKi3mQ==';

const nguongMoney = 150000;
let moneyDat = 10000;
let turnOffManual = false;


function sendTelegramMessage(message) {
    bot.sendMessage(groupId, message);
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
    console.log('check dataTai', dataTai)
    const pr1 = await sendMessage(ws, dataTai);
    await Promise.all([pr1]);
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

    const pr1 = await sendMessage(ws, dataXiu);
    await Promise.all([pr1]);
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


let ws;
let seconds = 67;
let interval;

let moneyNow = 19000;
let chuoiThang = 0;
let chuoiThua = 0;
let sid = 0;
let daDat = false;
let ketqua = "TAI";
let B_tU;
let B_tB;
let S_tU;
let S_tB;

function connectWebSocket() {
    try {
        // Khai báo Map
        const combinedMap = new Map();
        let firstOpen = true;
        let lastIndex = 1;

        const headers = {
            Host: "mynygwais.hytsocesk.com",
            Connection: "Upgrade",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Upgrade: "websocket",
            Origin: "https://play.go88.tv",
            "Sec-WebSocket-Version": "13",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi,en;q=0.9",
            "Sec-WebSocket-Key": keyWsBet,
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        };

        ws = new WebSocket(
            "wss://mynygwais.hytsocesk.com/websocket",
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

                if (xx1 != 0 && xx2 != 0 && xx3 != 0) {
                    if (xx1 + xx2 + xx3 > 10) {

                        console.log("Kết quả Tài ", xx1 + xx2 + xx3);
                        if (daDat && ketqua == 'TAI') {
                            chuoiThang++;
                        } else if (daDat && ketqua == 'XIU') {
                            chuoiThua++;
                        }
                    } else if (xx1 + xx2 + xx3 <= 10 && xx1 + xx2 + xx3 > 2) {
                        //xỉu
                        console.log("Kết quả Xỉu ", xx1 + xx2 + xx3);
                        if (daDat && ketqua == 'XIU') {
                            chuoiThang++;
                        } else if (daDat && ketqua == 'TAI') {
                            chuoiThua++;
                        }
                    }
                }

                resetCountdown();
             
                daDat = false;
                sid = 0;
                console.log(`Số lượng Thắng - Thua : ${chuoiThang}-${chuoiThua}. Số tiền hiện tại ${moneyNow} VNĐ`);
                console.log('check tỷ lệ thắng', (chuoiThang / (chuoiThang + chuoiThua)) * 100)
                combinedMap.clear();
            }

            if (data?.length > 0 && data[1]?.cmd == 1008 ) {

                if (data?.length > 0 && data[1]?.cmd == 1008) {
                    B_tU = data[1]?.gi[0]?.B?.tU;
                    B_tB = data[1]?.gi[0]?.B?.tB;
                    S_tU = data[1]?.gi[0]?.S?.tU;
                    S_tB = data[1]?.gi[0]?.S?.tB;

                    sid = data[1]?.sid;
                    if (sid != 0 && !daDat && moneyDat < moneyNow && !turnOffManual) {
                       console.log(`${B_tU} ${B_tB} ${S_tU} ${S_tB}`)
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

// connectWebSocketSecond();