import xgboost as xgb
import json
import sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import numpy as np
import pickle
# Các hàm khác giữ nguyên
def read_user_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def create_features(data):
    features = []
    avg_bet_tai = np.mean([user['bet_amount_tai'] for user in data])
    avg_bet_xiu = np.mean([user['bet_amount_xiu'] for user in data])

    for user in data:
        # Tính độ lệch so với giá trị trung bình
        dev_from_avg_tai = user['bet_amount_tai'] - avg_bet_tai
        dev_from_avg_xiu = user['bet_amount_xiu'] - avg_bet_xiu
        feature = [
            user['bet_amount_tai'],
            user['bet_amount_xiu'],
            user['total_win'],
            user['total_lose'],
            user['max_consecutive_win'],
            user['current_win_streak'],
            dev_from_avg_tai,
            dev_from_avg_xiu,
            user['result']-1,
            ]
        features.append(feature)

    return np.array(features)

def load_model(model_path):
    with open(model_path, 'rb') as file:
        loaded_model = pickle.load(file)
    return loaded_model

def predict_result(model, features, threshold=0.5):
    dmatrix = xgb.DMatrix(features)
    predictions = model.predict(dmatrix)
    print("Raw predictions (probabilities):", predictions)
    return [pred > threshold for pred in predictions]

if __name__ == '__main__':
    model_path = sys.argv[1]
    data_file = sys.argv[2]

    model = load_model(model_path)
    data = read_user_data(data_file)
    features = create_features(data)

    threshold = 0.5  # Thử với một ngưỡng khác như 0.3
    predictions = predict_result(model, features, threshold=threshold)
    
    print(predictions)