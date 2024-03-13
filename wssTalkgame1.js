const WebSocket = require("websocket").w3cwebsocket;
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const linkPy = "D:/PY/python.exe";
const forecastPath = "./pyLib/forecast.py";

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

async function appendToFile(data) {
    const filePath = path.join(__dirname, `./data/dataGameIndex3.txt`); // Thay đổi đường dẫn nếu cần
    await fs.appendFileSync(filePath, data, 'utf8');
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

function calculateBetAmount(money) {
    return Math.floor(money * 0.2 / 1000) * 1000; // Đặt cược 10% số tiền, làm tròn xuống đến số nguyên gần nhất của 1K
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
        seconds--;
        if (seconds <= 0) {
            clearInterval(interval);
            console.log("Đếm ngược kết thúc");
        }
    }, 1000); // 1000 milliseconds = 1 second
}

function resetCountdown() {
    seconds = 70; // Đặt lại thời gian
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

// // Hàm tính tổng các giá trị trong mảng đã sắp xếp
// function calculateTotalSum(sortedArray) {
//     return sortedArray.reduce((sum, [key, value]) => sum + value.b, 0);
// }
// let seconds = 80;
// let interval;
let ws;
let messageInterval;
async function connectWebSocket() {
    try {
        let lastIndex = 1;
        let iNow = 1;
        const headers = {
            Host: "chat.789x.shop",
            Connection: "Upgrade",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Upgrade: "websocket",
            Origin: "https://play.rikvips.day",
            "Sec-WebSocket-Version": "13",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi,en;q=0.9",
            "Sec-WebSocket-Key": "Sxc0blvybyp3vo6+PNwncg==",
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        };

        ws = new WebSocket(
            "wss://chat.789x.shop/signalr/connect?transport=webSockets&connectionToken=iUXM4lNYNVCj7axogxwpLab%2BVutz6lPj9204Ow%2BtVe3IBf1Vujz74bxrmGs4YNKyL0N3eZCnzNWJMjNRVTvGtmsZ%2BGtYP%2BJBI%2Br5l0dpxLFZT56iqc4BDTbD05DLVC%2FV&connectionData=%5B%7B%22name%22%3A%22chatHub%22%7D%5D&tid=5&access_token=05%2F7JlwSPGwjxV3q5IUnauwJnPVmYQfaB3UwDAmuWFIZUVv4DDGnqkL1E%2F2ay9lrdeJ1hnJUb8Ihuau5zkov0AdaCyS1Tl9wSgNuuDO1yAXihv3eKyxhHxPbhyigcvdhAYr3vLYr1sUAmWIrzWG0XxMy5o079uHK3DB5YmnSxD9vC0ys4H%2FVzIB6B7w%2BZLX8iiNQN1synd23lx5JM%2BoUuP%2Fkjgh5xWXtdTQkd9W3%2BQBY25AdX3CvOefXrKEnnnAjUIDBkDu2mhDmOx0s6tx3SjmRPDgTNb3MUk2MC1sTYNj%2FIKw%2F1IPCNY2oi8RygWpHwIFWcHGdeoRvzJh1uZfQB8Nb2K%2F60V7YoXxNK%2F%2F43OUOFwB4oH63t%2BFFwGOtaZp1KE0z0zdavvY6wXrSZhEJeByeCQQ%2BvcI2LVaZNbysx9Y%3D.f5308d579111a4354e2a5d77eaf776f4d08594f333de6e6b93620661fc036bbb",
            null,
            null,
            headers
        );

        ws.onerror = (error) => {
            console.error("Lỗi kết nối WebSocket:", error);
        };
        let firstOpen = false;
        ws.onopen = async () => {
            console.log("Đã kết nối thành công đến WebSocket.");
            do {
                if (firstOpen) {
                    firstOpen = false;
                    //gửI message đầu
                    const data1 = {
                        "M": "RegisterChat",
                        "A": [
                            "taixiu",
                            1
                        ],
                        "H": "chatHub",
                        "I": 0
                    }
                    const data2 = {
                        "M": "PingPong",
                        "H": "chatHub",
                        "I": lastIndex++
                    }
                    await sendMessage(ws, data1);
                    await sendMessage(ws, data2);

                } else {
                    const data4 = {
                        "M": "PingPong",
                        "H": "chatHub",
                        "I": lastIndex++
                    }
                    await sendMessage(ws, data4);

                    const dataMS = {
                        "M": "SendMessage",
                        "A": [
                            "GAME LỪA ĐẢO,Toàn Bot chơi rất khó thắng,nếu b thắng b cũng không rút được với số tiền thắng lớn. AE KHÔNG NẠP TRÁNH MẤT TIỀN OAN ",
                            "taixiu"
                        ],
                        "H": "chatHub",
                        "I": lastIndex - 1
                    };
                    await sendMessage(ws, dataMS);
                    ws.close();
                    console.log('Đã gửi message thành công')
                    break;
                }
                await sleep(5000);
            } while (true);
        };

        ws.onmessage = async (event) => {

        };

        ws.onclose = async () => {
            console.log("Đã đóng kết nối đến WebSocket.");
            await sleep(10000);
            await connectWebSocket(); // Thử kết nối lại sau 5 giây
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