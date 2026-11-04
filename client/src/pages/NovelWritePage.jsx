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
