import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/arena" element={<Arena />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;