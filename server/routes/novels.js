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
    if (!title || !genre || !synopsis || !content) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }
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
