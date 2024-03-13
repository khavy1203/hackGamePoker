const vision = require('@google-cloud/vision');

// Khởi tạo client Vision với tệp credential
const client = new vision.ImageAnnotatorClient({
  keyFilename: './apiGoogle.json'
});

async function detectText(filePath) {
  // Thực hiện yêu cầu nhận dạng văn bản
  const [result] = await client.textDetection(filePath);
  const detections = result.textAnnotations;
  console.log('Text:');
  detections.forEach(text => console.log(text));
}

detectText('./testHa.png');
