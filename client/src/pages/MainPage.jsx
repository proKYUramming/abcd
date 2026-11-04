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
