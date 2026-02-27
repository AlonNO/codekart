import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;