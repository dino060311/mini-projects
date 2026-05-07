# Study Tracker (공부 시간 기록 프로그램)

Java와 MySQL을 연동해서 만든 스터디 트래커입니다. 
프로그램을 종료해도 데이터가 날아가지 않도록 DB에 회원 정보와 공부 기록을 저장하도록 구현했습니다.

## 주요 기능
- **회원가입 및 로그인**: 아이디와 비밀번호를 받아 MySQL `users` 테이블에 저장하고, 로그인 시 인증합니다.
- **공부 시간 기록**: 로그인한 사용자가 오늘 공부한 시간(분 단위)을 입력하면 `study_records` 테이블에 저장됩니다.
- **기록 모아보기**: 지금까지 내가 기록한 전체 공부 내역을 최신순(날짜 포함)으로 확인할 수 있습니다.

## 사용한 기술 (Tech Stack)
- Java 
- MySQL 8.0
- JDBC (mysql-connector-j-9.6.0)
- VS Code

## 파일 구조
```text
Study-Tracker/
├── .vscode/
│   └── settings.json        # JDBC 라이브러리 경로 설정
├── lib/
│   └── mysql-connector-j-9.6.0.jar  # 외부 라이브러리 (MySQL 드라이버)
├── StudyTracker.java        # 메인 소스 코드
├── schema.sql               # DB 테이블 생성용 쿼리 모음
└── README.md
```

## DB 세팅 방법 (Schema)
프로그램을 실행하려면 먼저 MySQL에 DB와 테이블을 만들어야 합니다.  
아래 쿼리를 실행하거나, 동봉된 schema.sql 파일을 사용해주세요.

```sql
CREATE DATABASE study_db;
USE study_db;

-- 사용자 정보 테이블
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(50) NOT NULL,
    name VARCHAR(20)
);

-- 공부 기록 테이블
CREATE TABLE study_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    duration INT,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);