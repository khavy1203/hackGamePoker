// Import thư viện crypto-js
var CryptoJS = require("crypto-js");

// Định nghĩa class CryptoUtils
var CryptoUtils = (function() {
    function CryptoUtils() {}

    // Định nghĩa key và iv cho việc mã hóa và giải mã thông thường
    CryptoUtils.key = "12345678abcdefgh";
    CryptoUtils.iv = "12345678abcdefgh";

    // Định nghĩa key và iv cho việc mã hóa và giải mã HTTP
    CryptoUtils.httpKey = "hj7x89HayuBI0456cddb0b864f79e5dd";
    CryptoUtils.httpIv = "NIfba95GUY86Gfgh";

    CryptoUtils.decrypt = function(encryptedText) {
        try {
            var key = CryptoJS.enc.Utf8.parse(CryptoUtils.key);
            var iv = CryptoJS.enc.Utf8.parse(CryptoUtils.iv);
            var decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Error during decryption:', error.message);
            return null;
        }
    };

    // Hàm giải mã HTTP
    CryptoUtils.httpDecrypt = function(encryptedText) {
        var key = CryptoJS.enc.Utf8.parse(CryptoUtils.httpKey);
        var iv = CryptoJS.enc.Utf8.parse(CryptoUtils.httpIv);
        var base64Text = CryptoJS.enc.Base64.parse(encryptedText);
        var base64String = CryptoJS.enc.Base64.stringify(base64Text);
        var decrypted = CryptoJS.AES.decrypt(base64String, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    };

    return CryptoUtils;
})();

// Export module nếu đang sử dụng mô hình module (ví dụ: Node.js)
module.exports = CryptoUtils;

// Sử dụng hàm giải mã
var decryptedData = CryptoUtils.decrypt('MMsDAAlnYW1lL3B1c2hBUWtwaVhvSTdRdkRGVWFjb1Y0cGQrSHV3UWxRenFFWkEvaHRCZHlsQXFBcUgzZ1ZPeUVEa2ZhV01XQ1lHT2tXVml6elYrTytnRGJvRXM4WTFsTmNkdHhmREZwNkVvTjRLMHEzcHJpWmwzQ3FZb1plcW1YMktEVWpzcnRuN09MYmViQUhlWU5Hdzg5R1BLQlQwMVRZUlZlaU1MRkIrMVVTSjZRWjhsL3k2UGUzakFtcnA5emFDRnhDWHkyeTJVWFRWTWxiTzhCWHloalZTMlhabW1FNmo4bDVvY1F0VnpuVmhqcXF0UytlZ2JKNG1tcGNlRDEzdHRwL1BaTTBVcGEvTE0zMy82TVM0UTB5MCt3eTNQQjB4TlZVSkZINWE2TFhNZXVrZitDeU9LZ1d4bUJxWm9LZUU2SkwwRWxJUGJSZVVBd0RaaC9zSTdwaTBKTUZLbHhlYjRZWFd4QWFnVEhVSFRnRlBJR2RaVVRmdmFlS3BkMG14MmdGWTl4d3Y1RldMbW9FR3JUd3gwTVV6L3c4ZHNUaTl5YitrVU9rQlNBV2JKckN3eDQyS0dUblBkNStwYU5vaU5OeEF2OTljNHR5');
console.log('Decrypted data:', decryptedData);

// Sử dụng hàm giải mã HTTP
var decryptedHttpData = CryptoUtils.httpDecrypt('MMsDAAlnYW1lL3B1c2hBUWtwaVhvSTdRdkRGVWFjb1Y0cGQrSHV3UWxRenFFWkEvaHRCZHlsQXFBcUgzZ1ZPeUVEa2ZhV01XQ1lHT2tXVml6elYrTytnRGJvRXM4WTFsTmNkdHhmREZwNkVvTjRLMHEzcHJpWmwzQ3FZb1plcW1YMktEVWpzcnRuN09MYmViQUhlWU5Hdzg5R1BLQlQwMVRZUlZlaU1MRkIrMVVTSjZRWjhsL3k2UGUzakFtcnA5emFDRnhDWHkyeTJVWFRWTWxiTzhCWHloalZTMlhabW1FNmo4bDVvY1F0VnpuVmhqcXF0UytlZ2JKNG1tcGNlRDEzdHRwL1BaTTBVcGEvTE0zMy82TVM0UTB5MCt3eTNQQjB4TlZVSkZINWE2TFhNZXVrZitDeU9LZ1d4bUJxWm9LZUU2SkwwRWxJUGJSZVVBd0RaaC9zSTdwaTBKTUZLbHhlYjRZWFd4QWFnVEhVSFRnRlBJR2RaVVRmdmFlS3BkMG14MmdGWTl4d3Y1RldMbW9FR3JUd3gwTVV6L3c4ZHNUaTl5YitrVU9rQlNBV2JKckN3eDQyS0dUblBkNStwYU5vaU5OeEF2OTljNHR5');
console.log('Decrypted HTTP data:', decryptedHttpData);