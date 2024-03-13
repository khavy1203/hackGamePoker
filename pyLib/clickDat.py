import pyautogui
import sys
import time

def click_at(x, y):
    pyautogui.click(x, y)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py x y")
        sys.exit(1)

    x = int(sys.argv[1])
    y = int(sys.argv[2])

    print(f"x: {x}, y: {y}")
    click_at(x, y)
    time.sleep(0.05)  # Đợi 100 milliseconds
