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
