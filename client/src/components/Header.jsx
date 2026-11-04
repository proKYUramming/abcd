import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  background: #2c1810;
  padding: 0 2rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const Logo = styled(Link)`color: #f5deb3; font-size: 1.4rem; font-weight: bold;`;
const NavLinks = styled.div`display: flex; gap: 1.5rem; align-items: center;`;
const NavLink = styled(Link)`color: #f5deb3; font-size: 0.9rem; &:hover { color: #fff; }`;
const NavBtn = styled.button`
  background: transparent; border: 1px solid #f5deb3; color: #f5deb3;
  padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.9rem;
  &:hover { background: #f5deb3; color: #2c1810; }
`;

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const nickname = localStorage.getItem('nickname');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    navigate('/');
    window.location.reload();
  }

  return (
    <Nav>
      <Logo to="/">📖 소설마당</Logo>
      <NavLinks>
        <NavLink to="/">홈</NavLink>
        <NavLink to="/authors">작가별 목록</NavLink>
        {token ? (
          <>
            <NavLink to="/novels/write">소설 쓰기</NavLink>
            <NavLink to="/mypage">{nickname}</NavLink>
            <NavBtn onClick={handleLogout}>로그아웃</NavBtn>
          </>
        ) : (
          <>
            <NavLink to="/login">로그인</NavLink>
            <NavBtn onClick={() => navigate('/register')}>회원가입</NavBtn>
          </>
        )}
      </NavLinks>
    </Nav>
  );
}
