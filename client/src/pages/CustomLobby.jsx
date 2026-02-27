import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { playMatchFound } from '../utils/sounds';

const SERVER_URL = import.meta.env.PROD ? 'https://codekart-server.onrender.com' : 'http://localhost:3001';

function CustomLobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, loadout, equipped_border, mode } = location.state || {};

  const [status, setStatus] = useState('connecting'); // connecting | waiting | joining | matched | error
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState('');

  const socketRef = useRef(null);
  const matchedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const newSocket = io(SERVER_URL, { forceNew: true });
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🔌 Connected:', newSocket.id);

      if (mode === 'create') {
        newSocket.emit('create_lobby', { username, loadout, equipped_border });
      } else {
        setStatus('joining');
      }
    });

    newSocket.on('lobby_created', (data) => {
      setLobbyCode(data.code);
      setStatus('waiting');
    });

    newSocket.on('lobby_error', (data) => {
      setError(data.message);
      setStatus('error');
    });

    newSocket.on('lobby_closed', (data) => {
      setError(data.reason || 'Lobby was closed');
      setStatus('error');
    });

    newSocket.on('game_start', (data) => {
      setStatus('matched');
      matchedRef.current = true;
      setMatchData(data);
      playMatchFound();

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
      if (status !== 'matched') {
        setError('Disconnected from server');
        setStatus('error');
      }
    });

    return () => {
      if (lobbyCode && status === 'waiting') {
        newSocket.emit('leave_lobby', { code: lobbyCode });
      }
      // Don't disconnect if we matched — Arena needs the room to stay alive
      // until its own socket connects and calls rejoin_room
      if (!matchedRef.current) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleJoin = () => {
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    setError('');
    socketRef.current?.emit('join_lobby', {
      code,
      username,
      loadout,
      equipped_border
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!username) return null;

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

        {/* CONNECTING */}
        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-lg">Connecting{dots}</p>
          </div>
        )}

        {/* HOST: WAITING FOR FRIEND */}
        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm">Share this code with your friend:</p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="flex items-center gap-3"
            >
              <div className="bg-gray-900 border-2 border-yellow-400 rounded-xl px-6 py-4 flex items-center gap-2">
                {lobbyCode.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className="text-4xl font-black text-yellow-400 font-mono tracking-widest"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyCode}
                className="px-4 py-4 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600 
                           cursor-pointer transition-colors text-sm font-bold"
              >
                {copied ? '✅' : '📋'}
              </motion.button>
            </motion.div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="text-4xl mt-2"
            >
              ⏳
            </motion.div>

            <p className="text-gray-300 text-lg">Waiting for friend{dots}</p>

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

        {/* GUEST: ENTER CODE */}
        {status === 'joining' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm">Enter the room code:</p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="ABCDEF"
              maxLength={6}
              className="w-64 px-6 py-4 rounded-xl bg-gray-900 border-2 border-gray-700
                         text-yellow-400 text-3xl text-center font-mono font-black tracking-[0.3em]
                         outline-none focus:border-yellow-400 transition-colors uppercase"
              autoFocus
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              className={`w-64 px-6 py-3 rounded-xl font-bold text-lg cursor-pointer transition-all ${
                joinCode.length !== 6
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-green-500 text-black hover:bg-green-400'
              }`}
            >
              🚀 Join Game
            </motion.button>
          </div>
        )}

        {/* MATCHED */}
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

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <p className="text-red-400 text-sm text-center bg-red-900/30 py-3 rounded-lg">
              ❌ {error}
            </p>
          </motion.div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold cursor-pointer
                       hover:bg-yellow-300 transition-colors"
          >
            ← Back to Home
          </button>
        )}
      </motion.div>

      {/* Back button */}
      {status !== 'matched' && status !== 'error' && (
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 text-sm hover:text-gray-300 cursor-pointer transition-colors"
        >
          ← Back to Home
        </button>
      )}
    </div>
  );
}

export default CustomLobby;