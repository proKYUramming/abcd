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
