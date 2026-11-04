import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyPage from './pages/MyPage';
import NovelWritePage from './pages/NovelWritePage';
import NovelDetailPage from './pages/NovelDetailPage';
import NovelEditPage from './pages/NovelEditPage';
import AuthorsPage from './pages/AuthorsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/novels/write" element={<NovelWritePage />} />
        <Route path="/novels/:id" element={<NovelDetailPage />} />
        <Route path="/novels/:id/edit" element={<NovelEditPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
      </Routes>
    </Layout>
  );
}
