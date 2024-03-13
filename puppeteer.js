const puppeteer = require("puppeteer");
const { TextDecoder } = require("util"); // Để giải mã dữ liệu binary

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.goto("https://trade.vndirect.com.vn/chung-khoan/hose");

    // Lấy client CDP để tương tác với giao thức Chrome DevTools
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");

    client.on("Network.webSocketFrameReceived", ({ requestId, timestamp, response }) => {
        // Kiểm tra xem payload có dạng binary (thường được mã hóa base64) không
        if (response?.payloadData && typeof response.payloadData === 'string') {
            try {
             
                console.log('check response.payloadData', response.payloadData)

            } catch (e) {
                console.error('Error decoding binary frame:', e);
            }
        }
    });

    // Tiếp tục với các bước khác của script...
})();
