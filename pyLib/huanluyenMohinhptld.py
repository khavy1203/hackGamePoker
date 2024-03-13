import json
import sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
def read_data(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def create_features(data, true_result):
    features = []
    labels = []
    for user in data:
        feature = [
            user['bet_amount_tai'],
            user['bet_amount_xiu'],
            user['total_win'],
            user['total_lose'],
            user['max_consecutive_win'],
            user['current_win_streak'],
            user['result']  # Lựa chọn của người dùng
        ]
        # 'DUNG' nếu kết quả người dùng trùng với kết quả thực tế, ngược lại là 'SAI'
        labels.append(true_result)
        features.append(feature)
    return np.array(features), np.array(labels)

def train_new_model(data, true_result, model_file):
    features, labels = create_features(data, true_result)
    model = RandomForestClassifier()
    model.fit(features, labels)
    joblib.dump(model, model_file)

if __name__ == '__main__':
    data_path = sys.argv[1]  # Đường dẫn đến file JSON
    true_result = int(sys.argv[2])  # Kết quả thực tế của trận đấu (0 hoặc 1)
    model_file = sys.argv[3]  # Tên file mô hình cập nhật

    data = read_data(data_path)
    train_new_model(data, true_result, model_file)
