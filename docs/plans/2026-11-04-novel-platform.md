# 소설 공유 플랫폼 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 회원관리(가입/로그인/마이페이지) + 소설 CRUD + JOIN 조회 기능을 갖춘 소설 공유 웹 서비스 구현

**Architecture:** React(Vite) SPA 프론트엔드 + Node.js/Express REST API 백엔드 + MySQL DB. client/server 분리 구조로 Vite 프록시를 통해 `/api/*` 요청을 Express로 전달. JWT 토큰을 localStorage에 저장해 인증 상태 유지.

**Tech Stack:** React 19, Vite, React Router v7, styled-components, axios / Express 5, bcrypt, jsonwebtoken, mysql2/promise, dotenv

---

## Task 1: DB 스키마 작성

**Files:**
- Create: `server/schema.sql`

**Step 1: schema.sql 작성**

```sql
-- server/schema.sql
-- DB 이름은 본인 학번으로 변경할 것 (예: novel_platform_10315)
CREATE DATABASE IF NOT EXISTS novel_platform_학번;
USE novel_platform_학번;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  entry_year INT NOT NULL,
  student_id VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE novels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  genre VARCHAR(20) NOT NULL,
  synopsis VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Step 2: MySQL에서 실행**

학교 컴퓨터에서 MySQL Workbench 또는 CLI로 실행:
```
mysql -u 학번 -p < server/schema.sql
```

---

## Task 2: Server 폴더 초기 설정

**Files:**
- Create: `server/package.json`
- Create: `server/.env`

**Step 1: server 폴더 생성 후 package.json 작성**

```bash
mkdir server
cd server
npm init -y
```

그 다음 `server/package.json`을 아래 내용으로 덮어쓰기:

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^18.0.7",
    "express": "^5.3.0",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.24.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

**Step 2: 패키지 설치**

```bash
cd server
npm install
npm install -D nodemon
```

**Step 3: .env 작성**

```
PORT=5000
DB_HOST=127.0.0.1
DB_USER=학번
DB_PASSWORD=본인비밀번호
DB_NAME=novel_platform_학번
DB_PORT=3306
JWT_SECRET=super_secret_jwt_key_2026
```

> ⚠️ .gitignore에 `.env` 추가 필수

---

## Task 3: server/db.js + server/index.js

**Files:**
- Create: `server/db.js`
- Create: `server/index.js`
- Create: `server/.gitignore`

**Step 1: server/db.js 작성**

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  const connection = await pool.getConnection();
  console.log('✅ MySQL 데이터베이스 연결 성공!');
  connection.release();
} catch (error) {
  console.error('❌ MySQL 데이터베이스 연결 실패:', error.message);
}

export default pool;
```

**Step 2: server/index.js 작성**

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import novelsRouter from './routes/novels.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/novels', novelsRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

**Step 3: server/.gitignore 작성**

```
node_modules
.env
```

**Step 4: routes 폴더와 middlewares 폴더 생성**

```bash
mkdir server/routes
mkdir server/middlewares
```

**Step 5: 서버 실행 확인**

```bash
cd server
npm run dev
```
Expected: `✅ MySQL 데이터베이스 연결 성공!` + `✅ Server running on port 5000`

---

## Task 4: server/routes/auth.js (회원가입/로그인)

**Files:**
- Create: `server/routes/auth.js`

**Step 1: auth.js 작성**

```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  const { email, password, nickname, phone_number, entry_year, student_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password, nickname, phone_number, entry_year, student_id) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, nickname, phone_number, entry_year, student_id]
    );
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 사용 중인 이메일 또는 전화번호입니다.' });
    }
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, nickname: user.nickname });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

export default router;
```

**Step 2: 동작 확인 (서버 재시작 후)**

브라우저 또는 Postman에서:
```
POST http://localhost:5000/api/auth/register
Body: { "email": "test@test.com", "password": "1234", "nickname": "테스터", "phone_number": "010-1234-5678", "entry_year": 2024, "student_id": "10315" }
```
Expected: `{ "message": "회원가입 성공" }`

---

## Task 5: server/middlewares/auth.js (JWT 미들웨어)

**Files:**
- Create: `server/middlewares/auth.js`

**Step 1: auth.js 작성**

```javascript
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}
```

---

## Task 6: server/routes/users.js (마이페이지 API)

**Files:**
- Create: `server/routes/users.js`

**Step 1: users.js 작성**

```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// 내 정보 조회
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nickname, phone_number, entry_year, student_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 프로필 수정
router.put('/me', authMiddleware, async (req, res) => {
  const { nickname, phone_number, password } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET nickname = ?, phone_number = ?, password = ? WHERE id = ?',
        [nickname, phone_number, hashed, req.user.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET nickname = ?, phone_number = ? WHERE id = ?',
        [nickname, phone_number, req.user.id]
      );
    }
    res.json({ message: '프로필이 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 회원탈퇴
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

export default router;
```

---

## Task 7: server/routes/novels.js (소설 CRUD + JOIN)

**Files:**
- Create: `server/routes/novels.js`

**Step 1: novels.js 작성**

> ⚠️ `/authors` 라우트를 `/:id` 보다 먼저 등록해야 함 (Express 라우팅 순서 주의)

```javascript
import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// 전체 목록 조회 (장르 필터)
router.get('/', async (req, res) => {
  const { genre } = req.query;
  try {
    let query = `
      SELECT n.*, u.nickname as author_nickname
      FROM novels n
      JOIN users u ON n.author_id = u.id
    `;
    const params = [];
    if (genre && genre !== '전체') {
      query += ' WHERE n.genre = ?';
      params.push(genre);
    }
    query += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// JOIN 조회 - 작가별 소설 목록 (/:id 보다 위에 위치해야 함)
router.get('/authors', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id as user_id, u.nickname, u.entry_year,
             COUNT(n.id) as novel_count,
             GROUP_CONCAT(n.title ORDER BY n.created_at DESC SEPARATOR ', ') as novel_titles
      FROM users u
      LEFT JOIN novels n ON u.id = n.author_id
      GROUP BY u.id, u.nickname, u.entry_year
      ORDER BY novel_count DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 소설 상세
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.nickname as author_nickname
       FROM novels n JOIN users u ON n.author_id = u.id
       WHERE n.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: '소설을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 소설 작성 (로그인 필요)
router.post('/', authMiddleware, async (req, res) => {
  const { title, genre, synopsis, content } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO novels (title, genre, synopsis, content, author_id) VALUES (?, ?, ?, ?, ?)',
      [title, genre, synopsis, content, req.user.id]
    );
    res.status(201).json({ message: '소설이 등록되었습니다.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 소설 수정 (본인만)
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, genre, synopsis, content } = req.body;
  try {
    const [rows] = await pool.query('SELECT author_id FROM novels WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: '소설을 찾을 수 없습니다.' });
    if (rows[0].author_id !== req.user.id) return res.status(403).json({ message: '수정 권한이 없습니다.' });
    await pool.query(
      'UPDATE novels SET title = ?, genre = ?, synopsis = ?, content = ? WHERE id = ?',
      [title, genre, synopsis, content, req.params.id]
    );
    res.json({ message: '소설이 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 소설 삭제 (본인만)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT author_id FROM novels WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: '소설을 찾을 수 없습니다.' });
    if (rows[0].author_id !== req.user.id) return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    await pool.query('DELETE FROM novels WHERE id = ?', [req.params.id]);
    res.json({ message: '소설이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

export default router;
```

---

## Task 8: Client 초기 설정

**Files:**
- Create: `client/` (Vite 프로젝트)

**Step 1: Vite 프로젝트 생성**

```bash
# 프로젝트 루트에서
npm create vite@latest
# 프로젝트명: client
# React -> Javascript -> ESLint -> Yes 선택
```

**Step 2: client/package.json을 아래 내용으로 교체**

```json
{
  "name": "client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.20.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-icons": "^5.7.0",
    "react-router-dom": "^7.18.4",
    "styled-components": "^6.5.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^10.13.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.13.0",
    "vite": "^8.3.5"
  }
}
```

**Step 3: 패키지 설치**

```bash
cd client
npm install
npm install -D
```

---

## Task 9: vite.config.js + main.jsx + index.css

**Files:**
- Modify: `client/vite.config.js`
- Modify: `client/src/main.jsx`
- Modify: `client/src/index.css`

**Step 1: vite.config.js - 프록시 설정 추가**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 2: client/src/main.jsx - BrowserRouter로 감싸기**

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 3: client/src/index.css - 초기화 CSS**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  background-color: #f8f5f0;
  color: #333;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  cursor: pointer;
}
```

---

## Task 10: components/Header.jsx + components/Layout.jsx

**Files:**
- Create: `client/src/components/Header.jsx`
- Create: `client/src/components/Layout.jsx`

**Step 1: Header.jsx 작성**

```javascript
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  background: #2c1810;
  padding: 0 2rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const Logo = styled(Link)`color: #f5deb3; font-size: 1.4rem; font-weight: bold;`;
const NavLinks = styled.div`display: flex; gap: 1.5rem; align-items: center;`;
const NavLink = styled(Link)`color: #f5deb3; font-size: 0.9rem; &:hover { color: #fff; }`;
const NavBtn = styled.button`
  background: transparent; border: 1px solid #f5deb3; color: #f5deb3;
  padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.9rem;
  &:hover { background: #f5deb3; color: #2c1810; }
`;

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const nickname = localStorage.getItem('nickname');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    navigate('/');
    window.location.reload();
  }

  return (
    <Nav>
      <Logo to="/">📖 소설마당</Logo>
      <NavLinks>
        <NavLink to="/">홈</NavLink>
        <NavLink to="/authors">작가별 목록</NavLink>
        {token ? (
          <>
            <NavLink to="/novels/write">소설 쓰기</NavLink>
            <NavLink to="/mypage">{nickname}</NavLink>
            <NavBtn onClick={handleLogout}>로그아웃</NavBtn>
          </>
        ) : (
          <>
            <NavLink to="/login">로그인</NavLink>
            <NavBtn onClick={() => navigate('/register')}>회원가입</NavBtn>
          </>
        )}
      </NavLinks>
    </Nav>
  );
}
```

**Step 2: Layout.jsx 작성**

```javascript
import Header from './Header';
import styled from 'styled-components';

const Main = styled.main`
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <Main>{children}</Main>
    </>
  );
}
```

---

## Task 11: App.jsx (라우터 설정)

**Files:**
- Modify: `client/src/App.jsx`

**Step 1: App.jsx 전체 교체**

```javascript
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyPage from './pages/MyPage';
import NovelWritePage from './pages/NovelWritePage';
import NovelDetailPage from './pages/NovelDetailPage';
import NovelEditPage from './pages/NovelEditPage';
import AuthorsPage from './pages/AuthorsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/novels/write" element={<NovelWritePage />} />
        <Route path="/novels/:id" element={<NovelDetailPage />} />
        <Route path="/novels/:id/edit" element={<NovelEditPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
      </Routes>
    </Layout>
  );
}
```

**Step 2: pages 폴더 생성**

```bash
mkdir client/src/pages
```

---

## Task 12: pages/LoginPage.jsx + pages/RegisterPage.jsx

**Files:**
- Create: `client/src/pages/LoginPage.jsx`
- Create: `client/src/pages/RegisterPage.jsx`

**Step 1: LoginPage.jsx 작성**

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`
  max-width: 400px; margin: 4rem auto; background: #fff;
  padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;
const Title = styled.h2`margin-bottom: 1.5rem; text-align: center;`;
const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; margin-bottom: 0.4rem; font-size: 0.9rem;`;
const Input = styled.input`
  width: 100%; padding: 0.6rem 0.8rem;
  border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const SubmitBtn = styled.button`
  width: 100%; padding: 0.8rem; background: #2c1810; color: #fff;
  border: none; border-radius: 4px; font-size: 1rem; margin-top: 1rem;
  &:hover { background: #4a2c1a; }
`;
const Msg = styled.p`color: red; margin-top: 0.5rem; font-size: 0.9rem;`;
const LinkWrap = styled.p`text-align: center; margin-top: 1rem; font-size: 0.9rem;`;

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('nickname', data.nickname);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인 실패');
    }
  }

  return (
    <Wrap>
      <Title>로그인</Title>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>이메일</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>비밀번호</Label>
          <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        </FormGroup>
        {error && <Msg>{error}</Msg>}
        <SubmitBtn type="submit">로그인</SubmitBtn>
      </form>
      <LinkWrap>계정이 없으신가요? <Link to="/register">회원가입</Link></LinkWrap>
    </Wrap>
  );
}
```

**Step 2: RegisterPage.jsx 작성**

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`
  max-width: 450px; margin: 3rem auto; background: #fff;
  padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;
const Title = styled.h2`margin-bottom: 1.5rem; text-align: center;`;
const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; margin-bottom: 0.4rem; font-size: 0.9rem;`;
const Input = styled.input`
  width: 100%; padding: 0.6rem 0.8rem;
  border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const SubmitBtn = styled.button`
  width: 100%; padding: 0.8rem; background: #2c1810; color: #fff;
  border: none; border-radius: 4px; font-size: 1rem; margin-top: 1rem;
  &:hover { background: #4a2c1a; }
`;
const Msg = styled.p`color: red; margin-top: 0.5rem; font-size: 0.9rem;`;
const LinkWrap = styled.p`text-align: center; margin-top: 1rem; font-size: 0.9rem;`;

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', nickname: '', phone_number: '', entry_year: '', student_id: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/auth/register', form);
      alert('회원가입 완료! 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || '회원가입 실패');
    }
  }

  return (
    <Wrap>
      <Title>회원가입</Title>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>이메일</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>비밀번호</Label>
          <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>닉네임</Label>
          <Input name="nickname" value={form.nickname} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>전화번호</Label>
          <Input name="phone_number" value={form.phone_number} onChange={handleChange} required placeholder="010-0000-0000" />
        </FormGroup>
        <FormGroup>
          <Label>입학년도</Label>
          <Input name="entry_year" type="number" value={form.entry_year} onChange={handleChange} required placeholder="2024" />
        </FormGroup>
        <FormGroup>
          <Label>학번</Label>
          <Input name="student_id" value={form.student_id} onChange={handleChange} required placeholder="10315" />
        </FormGroup>
        {error && <Msg>{error}</Msg>}
        <SubmitBtn type="submit">가입하기</SubmitBtn>
      </form>
      <LinkWrap>이미 계정이 있으신가요? <Link to="/login">로그인</Link></LinkWrap>
    </Wrap>
  );
}
```

---

## Task 13: pages/MainPage.jsx

**Files:**
- Create: `client/src/pages/MainPage.jsx`

**Step 1: MainPage.jsx 작성**

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const genres = ['전체', '로맨스', '판타지', '호러', '기타'];

const FilterBar = styled.div`display: flex; gap: 0.5rem; margin-bottom: 2rem;`;
const FilterBtn = styled.button`
  padding: 0.4rem 1rem; border: 1px solid #2c1810; border-radius: 20px;
  background: ${({ $active }) => $active ? '#2c1810' : '#fff'};
  color: ${({ $active }) => $active ? '#fff' : '#2c1810'};
  font-size: 0.9rem;
`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;
`;
const Card = styled(Link)`
  background: #fff; border-radius: 8px; padding: 1.2rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08); display: block;
  transition: transform 0.2s; &:hover { transform: translateY(-3px); }
`;
const CardGenre = styled.span`
  font-size: 0.75rem; background: #f5deb3; color: #2c1810; padding: 0.2rem 0.6rem; border-radius: 10px;
`;
const CardTitle = styled.h3`margin: 0.6rem 0 0.4rem; font-size: 1rem;`;
const CardSynopsis = styled.p`
  font-size: 0.85rem; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const CardAuthor = styled.p`font-size: 0.8rem; color: #999; margin-top: 0.6rem;`;

export default function MainPage() {
  const [novels, setNovels] = useState([]);
  const [genre, setGenre] = useState('전체');

  useEffect(() => {
    axios.get('/api/novels', { params: { genre } })
      .then(res => setNovels(res.data))
      .catch(console.error);
  }, [genre]);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>소설 목록</h2>
      <FilterBar>
        {genres.map(g => (
          <FilterBtn key={g} $active={genre === g} onClick={() => setGenre(g)}>{g}</FilterBtn>
        ))}
      </FilterBar>
      <Grid>
        {novels.map(novel => (
          <Card key={novel.id} to={`/novels/${novel.id}`}>
            <CardGenre>{novel.genre}</CardGenre>
            <CardTitle>{novel.title}</CardTitle>
            <CardSynopsis>{novel.synopsis}</CardSynopsis>
            <CardAuthor>✍️ {novel.author_nickname}</CardAuthor>
          </Card>
        ))}
      </Grid>
      {novels.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: '3rem' }}>소설이 없습니다.</p>
      )}
    </div>
  );
}
```

---

## Task 14: pages/NovelWritePage.jsx

**Files:**
- Create: `client/src/pages/NovelWritePage.jsx`

**Step 1: NovelWritePage.jsx 작성**

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`max-width: 700px; margin: 2rem auto;`;
const Title = styled.h2`margin-bottom: 1.5rem;`;
const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; margin-bottom: 0.4rem; font-size: 0.9rem;`;
const Input = styled.input`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const Select = styled.select`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const Textarea = styled.textarea`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px;
  font-size: 1rem; min-height: 350px; resize: vertical; font-family: inherit;
`;
const SubmitBtn = styled.button`
  padding: 0.7rem 2rem; background: #2c1810; color: #fff;
  border: none; border-radius: 4px; font-size: 1rem; &:hover { background: #4a2c1a; }
`;

export default function NovelWritePage() {
  const [form, setForm] = useState({ title: '', genre: '로맨스', synopsis: '', content: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    navigate('/login');
    return null;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/novels', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/novels/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || '등록 실패');
    }
  }

  return (
    <Wrap>
      <Title>소설 쓰기</Title>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>제목</Label>
          <Input name="title" value={form.title} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>장르</Label>
          <Select name="genre" value={form.genre} onChange={handleChange}>
            <option>로맨스</option>
            <option>판타지</option>
            <option>호러</option>
            <option>기타</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>한 줄 요약</Label>
          <Input name="synopsis" value={form.synopsis} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>본문</Label>
          <Textarea name="content" value={form.content} onChange={handleChange} required />
        </FormGroup>
        <SubmitBtn type="submit">등록하기</SubmitBtn>
      </form>
    </Wrap>
  );
}
```

---

## Task 15: pages/NovelDetailPage.jsx

**Files:**
- Create: `client/src/pages/NovelDetailPage.jsx`

**Step 1: NovelDetailPage.jsx 작성**

```javascript
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`
  max-width: 700px; margin: 2rem auto; background: #fff; padding: 2rem;
  border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);
`;
const Genre = styled.span`
  font-size: 0.8rem; background: #f5deb3; color: #2c1810; padding: 0.2rem 0.6rem; border-radius: 10px;
`;
const Title = styled.h1`margin: 0.8rem 0 0.4rem; font-size: 1.6rem;`;
const Meta = styled.p`font-size: 0.85rem; color: #888; margin-bottom: 1.5rem;`;
const Synopsis = styled.p`
  background: #f8f5f0; padding: 1rem; border-radius: 6px;
  font-style: italic; margin-bottom: 1.5rem; color: #555;
`;
const Content = styled.div`line-height: 2; white-space: pre-wrap;`;
const BtnRow = styled.div`display: flex; gap: 0.8rem; margin-top: 2rem;`;
const EditBtn = styled(Link)`
  padding: 0.5rem 1.2rem; background: #2c1810; color: #fff; border-radius: 4px; font-size: 0.9rem;
`;
const DeleteBtn = styled.button`
  padding: 0.5rem 1.2rem; background: #c0392b; color: #fff;
  border: none; border-radius: 4px; font-size: 0.9rem;
`;

export default function NovelDetailPage() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`/api/novels/${id}`)
      .then(res => setNovel(res.data))
      .catch(() => navigate('/'));
  }, [id]);

  if (!novel) return <p>로딩중...</p>;

  let myId = null;
  if (token) {
    try { myId = JSON.parse(atob(token.split('.')[1])).id; } catch {}
  }
  const isAuthor = myId === novel.author_id;

  async function handleDelete() {
    if (!window.confirm('정말 삭제할까요?')) return;
    try {
      await axios.delete(`/api/novels/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || '삭제 실패');
    }
  }

  return (
    <Wrap>
      <Genre>{novel.genre}</Genre>
      <Title>{novel.title}</Title>
      <Meta>✍️ {novel.author_nickname} · {new Date(novel.created_at).toLocaleDateString()}</Meta>
      <Synopsis>💬 {novel.synopsis}</Synopsis>
      <Content>{novel.content}</Content>
      {isAuthor && (
        <BtnRow>
          <EditBtn to={`/novels/${id}/edit`}>수정</EditBtn>
          <DeleteBtn onClick={handleDelete}>삭제</DeleteBtn>
        </BtnRow>
      )}
    </Wrap>
  );
}
```

---

## Task 16: pages/NovelEditPage.jsx

**Files:**
- Create: `client/src/pages/NovelEditPage.jsx`

**Step 1: NovelEditPage.jsx 작성**

```javascript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`max-width: 700px; margin: 2rem auto;`;
const Title = styled.h2`margin-bottom: 1.5rem;`;
const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; margin-bottom: 0.4rem; font-size: 0.9rem;`;
const Input = styled.input`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const Select = styled.select`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;
`;
const Textarea = styled.textarea`
  width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ccc; border-radius: 4px;
  font-size: 1rem; min-height: 350px; resize: vertical; font-family: inherit;
`;
const SubmitBtn = styled.button`
  padding: 0.7rem 2rem; background: #2c1810; color: #fff;
  border: none; border-radius: 4px; font-size: 1rem;
`;

export default function NovelEditPage() {
  const { id } = useParams();
  const [form, setForm] = useState({ title: '', genre: '', synopsis: '', content: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`/api/novels/${id}`)
      .then(res => {
        const { title, genre, synopsis, content } = res.data;
        setForm({ title, genre, synopsis, content });
      })
      .catch(() => navigate('/'));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.put(`/api/novels/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/novels/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || '수정 실패');
    }
  }

  return (
    <Wrap>
      <Title>소설 수정</Title>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>제목</Label>
          <Input name="title" value={form.title} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>장르</Label>
          <Select name="genre" value={form.genre} onChange={handleChange}>
            <option>로맨스</option>
            <option>판타지</option>
            <option>호러</option>
            <option>기타</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>한 줄 요약</Label>
          <Input name="synopsis" value={form.synopsis} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>본문</Label>
          <Textarea name="content" value={form.content} onChange={handleChange} required />
        </FormGroup>
        <SubmitBtn type="submit">수정 완료</SubmitBtn>
      </form>
    </Wrap>
  );
}
```

---

## Task 17: pages/MyPage.jsx

**Files:**
- Create: `client/src/pages/MyPage.jsx`

**Step 1: MyPage.jsx 작성**

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`max-width: 600px; margin: 2rem auto;`;
const Section = styled.div`
  background: #fff; padding: 1.5rem; border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 1.5rem;
`;
const SectionTitle = styled.h3`margin-bottom: 1rem; font-size: 1.1rem;`;
const FormGroup = styled.div`margin-bottom: 0.8rem;`;
const Label = styled.label`display: block; margin-bottom: 0.3rem; font-size: 0.85rem; color: #666;`;
const Input = styled.input`
  width: 100%; padding: 0.5rem 0.7rem; border: 1px solid #ccc; border-radius: 4px;
`;
const SaveBtn = styled.button`
  padding: 0.5rem 1.5rem; background: #2c1810; color: #fff; border: none; border-radius: 4px;
`;
const DeleteBtn = styled.button`
  padding: 0.5rem 1.5rem; background: #c0392b; color: #fff; border: none; border-radius: 4px;
`;
const NovelItem = styled.div`
  padding: 0.5rem 0; border-bottom: 1px solid #eee; font-size: 0.9rem; cursor: pointer;
  &:last-child { border-bottom: none; }
`;

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ nickname: '', phone_number: '', password: '' });
  const [myNovels, setMyNovels] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    axios.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data);
        setForm({ nickname: res.data.nickname, phone_number: res.data.phone_number, password: '' });
      });

    let myId = null;
    try { myId = JSON.parse(atob(token.split('.')[1])).id; } catch {}

    axios.get('/api/novels')
      .then(res => setMyNovels(res.data.filter(n => n.author_id === myId)));
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await axios.put('/api/users/me', form, { headers: { Authorization: `Bearer ${token}` } });
      alert('프로필이 수정되었습니다.');
      localStorage.setItem('nickname', form.nickname);
    } catch (err) {
      alert(err.response?.data?.message || '수정 실패');
    }
  }

  async function handleDelete() {
    if (!window.confirm('정말 탈퇴할까요? 작성한 소설도 모두 삭제됩니다.')) return;
    try {
      await axios.delete('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('token');
      localStorage.removeItem('nickname');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || '탈퇴 실패');
    }
  }

  if (!user) return <p>로딩중...</p>;

  return (
    <Wrap>
      <h2 style={{ marginBottom: '1.5rem' }}>마이페이지</h2>

      <Section>
        <SectionTitle>프로필 수정</SectionTitle>
        <form onSubmit={handleUpdate}>
          <FormGroup>
            <Label>이메일 (변경 불가)</Label>
            <Input value={user.email} disabled />
          </FormGroup>
          <FormGroup>
            <Label>닉네임</Label>
            <Input
              name="nickname" value={form.nickname} required
              onChange={e => setForm({ ...form, nickname: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>전화번호</Label>
            <Input
              name="phone_number" value={form.phone_number} required
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>새 비밀번호 (변경 시에만 입력)</Label>
            <Input
              type="password" placeholder="변경 없으면 비워두세요"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </FormGroup>
          <SaveBtn type="submit">저장</SaveBtn>
        </form>
      </Section>

      <Section>
        <SectionTitle>내가 쓴 소설 ({myNovels.length}편)</SectionTitle>
        {myNovels.length === 0
          ? <p style={{ color: '#999', fontSize: '0.9rem' }}>아직 쓴 소설이 없습니다.</p>
          : myNovels.map(n => (
            <NovelItem key={n.id} onClick={() => navigate(`/novels/${n.id}`)}>
              📖 {n.title} <span style={{ color: '#999', fontSize: '0.8rem' }}>({n.genre})</span>
            </NovelItem>
          ))
        }
      </Section>

      <Section>
        <SectionTitle style={{ color: '#c0392b' }}>회원탈퇴</SectionTitle>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.8rem' }}>
          탈퇴 시 모든 데이터가 삭제되며 복구가 불가능합니다.
        </p>
        <DeleteBtn onClick={handleDelete}>탈퇴하기</DeleteBtn>
      </Section>
    </Wrap>
  );
}
```

---

## Task 18: pages/AuthorsPage.jsx (JOIN 조회)

**Files:**
- Create: `client/src/pages/AuthorsPage.jsx`

**Step 1: AuthorsPage.jsx 작성**

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`max-width: 800px; margin: 2rem auto;`;
const Table = styled.table`
  width: 100%; border-collapse: collapse; background: #fff;
  border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.08);
`;
const Th = styled.th`
  background: #2c1810; color: #fff; padding: 0.8rem 1rem; text-align: left; font-size: 0.9rem;
`;
const Td = styled.td`padding: 0.8rem 1rem; border-bottom: 1px solid #f0ebe4; font-size: 0.9rem;`;
const Tr = styled.tr`&:last-child td { border-bottom: none; }`;

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    axios.get('/api/novels/authors').then(res => setAuthors(res.data));
  }, []);

  return (
    <Wrap>
      <h2 style={{ marginBottom: '1.5rem' }}>작가별 소설 목록</h2>
      <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#888' }}>
        users + novels 테이블 JOIN 결과
      </p>
      <Table>
        <thead>
          <tr>
            <Th>작가 닉네임</Th>
            <Th>입학년도</Th>
            <Th>작품 수</Th>
            <Th>작품 목록</Th>
          </tr>
        </thead>
        <tbody>
          {authors.map(a => (
            <Tr key={a.user_id}>
              <Td><strong>{a.nickname}</strong></Td>
              <Td>{a.entry_year}년</Td>
              <Td>{a.novel_count}편</Td>
              <Td style={{ color: '#555' }}>{a.novel_titles || '없음'}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Wrap>
  );
}
```

---

## Task 19: 최종 확인 및 실행

**Step 1: 서버 실행**

```bash
cd server
npm run dev
```

**Step 2: 클라이언트 실행 (새 터미널)**

```bash
cd client
npm run dev
```

**Step 3: 브라우저에서 http://localhost:5173 접속**

**Step 4: 전체 기능 체크리스트**

- [ ] 회원가입 → DB에 bcrypt 암호화된 password 확인
- [ ] 로그인 → JWT 토큰 발급 확인
- [ ] 마이페이지 → 프로필 수정 확인
- [ ] 소설 작성 (로그인 필요) → 비로그인 시 로그인 페이지로 이동
- [ ] 메인 페이지 → 전체 소설 목록 출력, 장르 필터 동작
- [ ] 소설 상세 → 본인 소설에만 수정/삭제 버튼 표시
- [ ] 소설 수정/삭제 → 본인만 가능
- [ ] 작가별 목록 → users + novels JOIN 결과 출력
- [ ] 회원탈퇴 → CASCADE로 소설도 함께 삭제

---

## Task 20: .gitignore 작성 (루트)

**Files:**
- Create: `.gitignore`

```
node_modules
.env
dist
```
