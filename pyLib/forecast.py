import numpy as np
import json
import sys
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

def load_data(data_file):
    with open(data_file, 'r') as file:
        file_data = file.read().strip()
        all_data = [int(i) for i in file_data]
    return all_data

def add_features(data, sequence_length, betting_data):
    X, y = [], []
    for i in range(len(data) - sequence_length):
        sequence = data[i:i+sequence_length]
        betting_features = extract_betting_features(betting_data, i)
        features = [
            np.mean(sequence),  # Trung bình
            np.std(sequence),   # Độ lệch chuẩn
            sequence[-1]        # Giá trị cuối cùng của chuỗi
        ] + betting_features
        X.append(features)
        y.append(data[i+sequence_length])
    return np.array(X), np.array(y)

def extract_betting_features(betting_data, index):
    # Trích xuất đặc trưng từ dữ liệu đặt cược
    # Ví dụ: Tổng số tiền đặt cược cho Tài và Xỉu
    tai_total = sum([bet['BetAmount'] for username, bet in betting_data if bet['type'] == 'TAI'])
    xiu_total = sum([bet['BetAmount'] for username, bet in betting_data if bet['type'] == 'XIU'])
    return [tai_total, xiu_total]

def train_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Chuẩn hóa dữ liệu
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, scaler

def predict_next(model, scaler, data, sequence_length, betting_data):
    last_sequence = data[-sequence_length:]
    betting_features = extract_betting_features(betting_data, len(data) - sequence_length)
    features = np.array([
        np.mean(last_sequence),
        np.std(last_sequence),
        last_sequence[-1]
    ] + betting_features).reshape(1, -1)
    features = scaler.transform(features)
    prediction = model.predict(features)
    probability = model.predict_proba(features)[0]
    return prediction[0], probability

if __name__ == "__main__":
    data_file = sys.argv[1]
    betting_data = json.loads(sys.argv[2])  # Gửi dữ liệu cược dưới dạng JSON

    data = load_data(data_file)

    sequence_length = 30
    X, y = add_features(data, sequence_length, betting_data)

    model, scaler = train_model(X, y)
    prediction, probability = predict_next(model, scaler, data, sequence_length, betting_data)

    probability_percent = [round(prob * 100, 2) for prob in probability]
    print(json.dumps({'prediction': int(prediction), 'probability': probability_percent}))