import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

const SERVER_URL = import.meta.env.PROD ? 'https://codekart-server.onrender.com' : 'http://localhost:3001';

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Anonymous';

  const [status, setStatus] = useState('connecting');
  const [queuePosition, setQueuePosition] = useState(null);
  const [dots, setDots] = useState('');
  const [matchData, setMatchData] = useState(null);
  const socketRef = useRef(null);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newSocket = io(SERVER_URL, { forceNew: true });
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🔌 Connected as:', newSocket.id);
      setStatus('waiting');
      newSocket.emit('join_queue', { username });
    });

    newSocket.on('queue_joined', (data) => {
      setQueuePosition(data.position);
    });

    newSocket.on('game_start', (data) => {
      setStatus('matched');
      setMatchData(data);

      setTimeout(() => {
        navigate('/arena', {
          state: {
            username,
            roomId: data.roomId,
            players: data.players,
            problem: data.problem,
            socketId: newSocket.id,
          }
        });
      }, 2000);
    });

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('queue_joined');
      newSocket.off('game_start');
      newSocket.off('disconnect');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <motion.h2 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl font-bold"
      >
        <span className="text-white">Code</span>
        <span className="text-yellow-400">Kart</span>
        <span className="ml-2">🏎️</span>
      </motion.h2>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-2xl p-10 flex flex-col items-center gap-6 min-w-[420px] border border-gray-700"
      >
        <p className="text-gray-400">Playing as</p>
        <p className="text-3xl font-bold text-yellow-400">{username}</p>

        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-lg">Connecting to server{dots}</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl"
            >
              🔍
            </motion.div>
            <p className="text-gray-300 text-lg">Searching for opponent{dots}</p>
            {queuePosition && (
              <p className="text-gray-500 text-sm">Position in queue: {queuePosition}</p>
            )}
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-3 h-3 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        {status === 'matched' && (
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.p 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-5xl"
            >
              🏁
            </motion.p>
            <p className="text-green-400 font-bold text-2xl">MATCH FOUND!</p>
            {matchData && (
              <div className="text-center">
                <p className="text-gray-400">
                  vs <span className="text-red-400 font-bold">
                    {matchData.players.find(p => p.username !== username)?.username}
                  </span>
                </p>
                <p className="text-yellow-400 mt-1">
                  Problem: {matchData.problem.title}
                </p>
              </div>
            )}
            <p className="text-gray-500 text-sm">Loading arena...</p>
          </motion.div>
        )}

        {status === 'disconnected' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-4xl">💔</p>
            <p className="text-red-400 font-bold text-lg">Disconnected from server</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold cursor-pointer
                         hover:bg-yellow-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-gray-600 text-sm"
      >
        Open another browser window to play against yourself
      </motion.p>
    </div>
  );
}

export default Lobby;