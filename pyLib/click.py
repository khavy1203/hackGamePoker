import pyautogui
import sys
import time

def click_at(x, y, num_clicks, interval=0.1):
    for _ in range(num_clicks):
        pyautogui.click(x, y)
        # time.sleep(interval)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python script.py num_clicks x y")
        sys.exit(1)

    num_clicks = int(sys.argv[1])
    x = int(sys.argv[2])
    y = int(sys.argv[3])

    print(f"x: {x}, y: {y}")
    click_at(x, y, num_clicks)
    time.sleep(0.05)  # Đợi 100 milliseconds
    
