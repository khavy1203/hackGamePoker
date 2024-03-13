import xgboost as xgb
import json
import sys
import numpy as np
from sklearn.model_selection import train_test_split
import pickle

def read_user_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def create_features(data, session_result):
    features = []
    labels = []

    # Tính giá trị trung bình của số tiền cược
    avg_bet_tai = np.mean([user['bet_amount_tai'] for user in data])
    avg_bet_xiu = np.mean([user['bet_amount_xiu'] for user in data])

    for user in data:
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
            user['result']-1,# Thêm session_result vào đặc trưng
        ]
        features.append(feature)
        label = session_result  # Chuyển đổi nhãn từ [1, 2] sang [0, 1]
        labels.append(label)

    return np.array(features), np.array(labels)

def train_model(features, labels, bst=None):
    X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2)
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)

    param = {
        'max_depth': 5,
        'min_child_weight': 1,
        'gamma': 0.5,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'eta': 0.1,
        'objective': 'binary:logistic',
        'eval_metric': 'logloss'
    }
    num_round = 200

    eval_set = [(dtest, 'eval')]
    if bst:
        # Tiếp tục huấn luyện mô hình cũ với dữ liệu mới
        bst = xgb.train(param, dtrain, num_round, evals=eval_set, early_stopping_rounds=20, xgb_model=bst)
    else:
        # Huấn luyện mô hình mới từ đầu
        bst = xgb.train(param, dtrain, num_round, evals=eval_set, early_stopping_rounds=20)

    return bst, X_test

def predict_result(model, X_test_dmatrix):
    predictions = model.predict(X_test_dmatrix)
    return predictions > 0.5

# Đoạn mã tải mô hình
def load_model(model_path):
    # Dùng pickle để tải mô hình XGBoost
    return pickle.load(open(model_path, "rb"))

def save_model(model, model_path):
    # Dùng pickle để lưu mô hình XGBoost
    pickle.dump(model, open(model_path, "wb"))
        
if __name__ == '__main__':
    session_result = int(sys.argv[1])  # Giả sử đây là kết quả của phiên gần nhất
    model_path = sys.argv[2]
    data_file = sys.argv[3]

    data = read_user_data(data_file)
    features, labels = create_features(data, session_result)

    # Tải mô hình hiện có hoặc tạo mô hình mới nếu không tìm thấy
    try:
        bst = load_model(model_path)
    except (FileNotFoundError, EOFError):
        bst = None  # Không tìm thấy mô hình hoặc mô hình không hợp lệ

    # Tiếp tục huấn luyện mô hình với dữ liệu mới
    bst, X_test = train_model(features, labels, bst)

    # Lưu lại mô hình sau khi huấn luyện thêm
    save_model(bst, model_path)
