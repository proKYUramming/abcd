# 소설 공유 플랫폼 - 설계 문서

**작성일**: 2026-11-04
**프로젝트**: 학교 수행평가 - 소설 공유 웹 서비스

---

## 1. 개요

회원가입/로그인/마이페이지 기능과 소설 CRUD 기능을 갖춘 웹 서비스.
React(Vite) + Node.js(Express) + MySQL 스택 사용.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, Vite, React Router v7, styled-components, axios |
| Backend | Node.js, Express 5, JWT, bcrypt, multer |
| DB | MySQL (mysql2/promise) |
| 인증 | JWT (Bearer token) |

---

## 3. 프로젝트 구조

```
프로젝트명/
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── components/     # 공통 컴포넌트 (Header, Layout 등)
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── MainPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── MyPage.jsx
│   │   │   ├── NovelWritePage.jsx
│   │   │   ├── NovelDetailPage.jsx
│   │   │   ├── NovelEditPage.jsx
│   │   │   └── AuthorsPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── server/
    ├── middlewares/
    │   └── auth.js         # JWT 인증 미들웨어
    ├── routes/
    │   ├── auth.js         # 회원가입/로그인
    │   ├── users.js        # 마이페이지 (조회/수정/탈퇴)
    │   └── novels.js       # 소설 CRUD + JOIN 조회
    ├── db.js
    ├── index.js
    ├── .env
    └── package.json
```

---

## 4. DB 스키마

### users 테이블
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,       -- bcrypt 암호화
  nickname VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  entry_year INT NOT NULL,              -- 입학년도
  student_id VARCHAR(10) NOT NULL,      -- 학번
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### novels 테이블
```sql
CREATE TABLE novels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  genre VARCHAR(20) NOT NULL,           -- '로맨스','판타지','호러','기타'
  synopsis VARCHAR(255) NOT NULL,       -- 1줄 요약
  content TEXT NOT NULL,                -- 본문
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 5. API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/register | 회원가입 | X |
| POST | /api/auth/login | 로그인 | X |

### 유저
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/users/me | 내 정보 조회 | O |
| PUT | /api/users/me | 프로필 수정 | O |
| DELETE | /api/users/me | 회원탈퇴 | O |

### 소설
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/novels | 전체 목록 (장르 필터) | X |
| POST | /api/novels | 소설 작성 | O |
| GET | /api/novels/authors | JOIN 조회 - 작가별 소설 | X |
| GET | /api/novels/:id | 소설 상세 | X |
| PUT | /api/novels/:id | 소설 수정 (본인만) | O |
| DELETE | /api/novels/:id | 소설 삭제 (본인만) | O |

---

## 6. 페이지 구성

| 경로 | 페이지 | 주요 기능 |
|------|--------|-----------|
| `/` | 메인 | 전체 소설 목록, 장르 필터 |
| `/register` | 회원가입 | 폼 + bcrypt 처리 |
| `/login` | 로그인 | JWT 발급 |
| `/mypage` | 마이페이지 | 프로필 조회/수정, 내 소설 목록, 탈퇴 |
| `/novels/write` | 소설 작성 | 로그인 필요 |
| `/novels/:id` | 소설 상세 | 읽기, 본인이면 수정/삭제 버튼 |
| `/novels/:id/edit` | 소설 수정 | 본인만 접근 |
| `/authors` | 작가별 목록 | **JOIN 조회** - 작가 닉네임 + 소설 목록 |

---

## 7. 수행평가 체크리스트

- [x] 회원가입 (bcrypt 암호화)
- [x] 로그인
- [x] 마이페이지 프로필 수정
- [x] 회원탈퇴
- [x] 소설 작성 (로그인 필요)
- [x] 소설 전체 목록 조회
- [x] 소설 수정 (본인만)
- [x] 소설 삭제 (본인만)
- [x] JOIN 조회 메뉴 1개 (authors 페이지)
