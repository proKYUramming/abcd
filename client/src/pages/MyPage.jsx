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
