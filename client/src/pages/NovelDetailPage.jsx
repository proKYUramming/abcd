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
