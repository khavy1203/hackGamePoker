import cv2
import pytesseract
import re
import numpy as np
import pyautogui
import json 
import win32gui
import win32ui
import win32con
import win32api
import win32process
import io
import sys

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def get_all_windows():
    """Hàm này liệt kê tất cả các cửa sổ và trả về một danh sách các tuple chứa handle, PID và tiêu đề của cửa sổ."""
    def enum_windows_proc(hwnd, lParam):
        if win32gui.IsWindowVisible(hwnd):
            pid = win32process.GetWindowThreadProcessId(hwnd)
            title = win32gui.GetWindowText(hwnd)
            lParam.append((hwnd, pid[1], title))
        return True

    windows = []
    win32gui.EnumWindows(enum_windows_proc, windows)
    return windows

def find_window_handle_by_pid(pid):
    def callback(hwnd, hwnds):
        _, found_pid = win32process.GetWindowThreadProcessId(hwnd)
        if found_pid == pid:
            hwnds.append(hwnd)
        return True

    hwnds = []
    win32gui.EnumWindows(callback, hwnds)
    return hwnds[0] if hwnds else None

def window_capture(region, hwnd):
    # hwnd = find_window_handle_by_pid(pid)
    left, top, width, height = region

    # Tìm handle của cửa sổ nếu cần

    wDC = win32gui.GetWindowDC(hwnd)
    dcObj = win32ui.CreateDCFromHandle(wDC)
    cDC = dcObj.CreateCompatibleDC()
    dataBitMap = win32ui.CreateBitmap()
    dataBitMap.CreateCompatibleBitmap(dcObj, width, height)
    cDC.SelectObject(dataBitMap)
    cDC.BitBlt((0, 0), (width, height), dcObj, (left, top), win32con.SRCCOPY)

    # Chuyển bitmap thành numpy array
    signedIntsArray = dataBitMap.GetBitmapBits(True)
    img = np.frombuffer(signedIntsArray, dtype='uint8')
    img.shape = (height, width, 4)

    # Giải phóng tài nguyên
    dcObj.DeleteDC()
    cDC.DeleteDC()
    win32gui.ReleaseDC(hwnd, wDC)
    win32gui.DeleteObject(dataBitMap.GetHandle())

    # Chỉ lấy kênh BGR, loại bỏ kênh alpha
    img = img[..., :3]

    return img

def extract_numbers(region, hwnd):
    frame = window_capture(region, hwnd)
    gray_image = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    _, thresh_image = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    extracted_text = pytesseract.image_to_string(thresh_image, config='--psm 6')
    numbers = re.findall(r'\d+', extracted_text)
    return numbers

def get_color_at_cursor(x, y):
    x = int(x)
    y = int(y)
    # Lấy màu tại vị trí con trỏ chuột
    return pyautogui.pixel(x, y)

if __name__ == "__main__":
    # Định nghĩa vị trí và kích thước của hai khu vực cần chụp\
    # Lấy danh sách cửa sổ
    all_windows = get_all_windows()

    # with open('windows_list.txt', 'w', encoding='utf-8') as f:
    #     for hwnd, pid, title in all_windows:
    #         f.write(f"Handle: {hwnd}, PID: {pid}, Title: {title}\n")

        
    region = (860,631,191,178)
    # hwnd = 657042
    # numbers1 = extract_numbers(region,hwnd)
     # Tọa độ cho trỏ chuột
  

    # Lấy màu tại vị trí con trỏ
    color_at_cursor = get_color_at_cursor(sys.argv[1], sys.argv[2])
    # Tạo một đối tượng JSON
    json_output = json.dumps({
        "times": 50,
        "colors": color_at_cursor
    })
    print(json_output)