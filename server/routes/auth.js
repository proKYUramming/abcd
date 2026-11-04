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
