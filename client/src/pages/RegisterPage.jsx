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
