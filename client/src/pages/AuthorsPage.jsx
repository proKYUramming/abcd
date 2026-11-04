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
      {authors.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: '2rem' }}>데이터가 없습니다.</p>
      )}
    </Wrap>
  );
}
