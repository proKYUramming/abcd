import Header from './Header';
import styled from 'styled-components';

const Main = styled.main`
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <Main>{children}</Main>
    </>
  );
}
