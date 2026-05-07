import java.sql.*;
import java.util.Scanner;

public class StudyTracker {
    // 1. DB 접속 정보 설정
    static final String URL = "jdbc:mysql://localhost:3306/study_db?serverTimezone=UTC";
    static final String USER = "root";
    static final String PASSWORD = "여기에_본인의_DB_비밀번호를_입력하세요";

    static Scanner sc = new Scanner(System.in);
    static String currentUserId = ""; 
    static boolean isLoggedIn = false; 

    public static void main(String[] args) {
        while (true) {
            try {
                if (!isLoggedIn) {
                    System.out.println("\n--- Study Tracker (접속 전) ---");
                    System.out.println("1. 회원가입");
                    System.out.println("2. 로그인");
                    System.out.println("3. 종료");
                    System.out.print("선택: ");
                    
                    int menu = sc.nextInt();
                    if (menu == 1) signUp();
                    else if (menu == 2) login();
                    else if (menu == 3) {
                        System.out.println("프로그램을 종료합니다.");
                        break;
                    } else {
                        System.out.println("잘못된 입력입니다. 다시 선택해 주세요.");
                    }
                } else {
                    System.out.println("\n--- " + currentUserId + "님의 스터디룸 ---");
                    System.out.println("1. 공부 시간 기록");
                    System.out.println("2. 기록 리스트 보기");
                    System.out.println("3. 로그아웃");
                    System.out.print("선택: ");

                    int menu = sc.nextInt();
                    if (menu == 1) saveRecord();
                    else if (menu == 2) showRecords();
                    else if (menu == 3) {
                        isLoggedIn = false;
                        currentUserId = "";
                        System.out.println("로그아웃 되었습니다.");
                    } else {
                        System.out.println("잘못된 입력입니다. 다시 선택해 주세요.");
                    }
                }
            } catch (Exception e) {
                System.out.println("입력 오류가 발생했습니다. 숫자를 입력해 주세요.");
                sc.nextLine(); // 잘못된 입력 버퍼 비우기
            }
        }
        sc.close();
    }

    // [공통 모듈] DB 연결 메서드 분리 (코드 중복 방지)
    private static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    // [회원가입] users 테이블에 저장
    static void signUp() {
        System.out.print("사용할 아이디 입력: ");
        String id = sc.next();
        System.out.print("사용할 비밀번호 입력: ");
        String pw = sc.next();

        String sql = "INSERT INTO users (id, password, name) VALUES (?, ?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, id);
            pstmt.setString(2, pw);
            pstmt.setString(3, id); 

            pstmt.executeUpdate();
            System.out.println("회원가입이 완료되었습니다. 로그인해 주세요.");

        } catch (SQLException e) {
            System.out.println("회원가입 실패: 이미 존재하는 아이디이거나 DB 오류입니다.");
        }
    }

    // [로그인] users 테이블에서 확인
    static void login() {
        System.out.print("아이디: ");
        String id = sc.next();
        System.out.print("비밀번호: ");
        String pw = sc.next();

        String sql = "SELECT id FROM users WHERE id = ? AND password = ?";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, id);
            pstmt.setString(2, pw);
            ResultSet rs = pstmt.executeQuery();

            if (rs.next()) {
                isLoggedIn = true;
                currentUserId = rs.getString("id");
                System.out.println("로그인 성공! 반갑습니다, " + currentUserId + "님.");
            } else {
                System.out.println("로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
            }

        } catch (SQLException e) {
            System.out.println("로그인 처리 중 DB 오류가 발생했습니다.");
        }
    }

    // [기록 저장] study_records 테이블에 저장
    static void saveRecord() {
        System.out.print("오늘 공부한 시간(분): ");
        try {
            int duration = sc.nextInt();
            String sql = "INSERT INTO study_records (user_id, duration) VALUES (?, ?)";

            try (Connection conn = getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql)) {
                
                pstmt.setString(1, currentUserId);
                pstmt.setInt(2, duration);

                pstmt.executeUpdate();
                System.out.println("공부 기록이 정상적으로 저장되었습니다.");

            } catch (SQLException e) {
                System.out.println("기록 저장 실패: DB 오류가 발생했습니다.");
            }
        } catch (Exception e) {
            System.out.println("입력 오류: 시간은 숫자로만 입력해 주세요.");
            sc.nextLine(); // 잘못된 입력 버퍼 비우기
        }
    }

    // [기록 보기] study_records 테이블에서 해당 사용자의 기록만 가져오기
    static void showRecords() {
        System.out.println("\n--- 누적 공부 기록 ---");

        String sql = "SELECT duration, record_date FROM study_records WHERE user_id = ? ORDER BY record_date DESC";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, currentUserId);
            ResultSet rs = pstmt.executeQuery();

            boolean hasData = false;
            while (rs.next()) {
                hasData = true;
                int duration = rs.getInt("duration");
                String date = rs.getString("record_date");
                System.out.println("[" + date + "] " + duration + "분");
            }

            if (!hasData) {
                System.out.println("아직 등록된 공부 기록이 없습니다.");
            }

        } catch (SQLException e) {
            System.out.println("기록 조회 실패: DB 오류가 발생했습니다.");
        }
    }
}