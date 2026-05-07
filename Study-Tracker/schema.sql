CREATE DATABASE IF NOT EXISTS study_db;
USE study_db;

-- 사용자 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(50) NOT NULL,
    name VARCHAR(20)
);

-- 공부 기록 테이블
CREATE TABLE IF NOT EXISTS study_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    duration INT,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);