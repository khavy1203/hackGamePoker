import json
import sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
# Đọc dữ liệu từ file JSON
def read_user_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def create_features(data):
    features = []
    labels = []

    for user in data:
        feature = [
            user['bet_amount_tai'],
            user['ratio'],
            user['bet_amount_xiu'],
            user['total_win'],
            user['total_lose'],
            user['max_consecutive_win'],
            user['current_win_streak'],
            ]
        features.append(feature)
        labels.append(user['result'])  # 1 cho Tài, 2 cho Xỉu

    return np.array(features), np.array(labels)

# Huấn luyện mô hình
def train_model(features, labels):
    # Huấn luyện mô hình ngay cả khi chỉ có một mẫu dữ liệu
    model = RandomForestClassifier(n_estimators=100, max_depth=None, min_samples_split=2)
    model.fit(features, labels)
    return model, features  # Sử dụng cùng một tập dữ liệu để kiểm thử

# Hàm dự đoán kết quả cho dữ liệu kiểm thử
def predict_result(model, test_data):
    predictions = model.predict(test_data)
    return predictions

if __name__ == '__main__':
    data_file = sys.argv[1]
    data = read_user_data(data_file)
    features, labels = create_features(data)
    model, X_test = train_model(features, labels)

    predictions = predict_result(model, X_test)
    print(json.dumps({'predictions': predictions.tolist()}))