import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Wrap = styled.div`
  max-width: 400px; margin: 4rem auto; background: #fff;
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

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('nickname', data.nickname);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인 실패');
    }
  }

  return (
    <Wrap>
      <Title>로그인</Title>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>이메일</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </FormGroup>
        <FormGroup>
          <Label>비밀번호</Label>
          <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        </FormGroup>
        {error && <Msg>{error}</Msg>}
        <SubmitBtn type="submit">로그인</SubmitBtn>
      </form>
      <LinkWrap>계정이 없으신가요? <Link to="/register">회원가입</Link></LinkWrap>
    </Wrap>
  );
}
