import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Home() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handlePlay = () => {
    if (username.trim().length < 2) {
      alert('Enter a username (at least 2 characters)');
      return;
    }
    navigate('/lobby', { state: { username: username.trim() } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Code Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['{ }', '( )', '< />', 'fn()', '[ ]', '===', '++', '=>', '&&', '||'].map((text, i) => (
          <motion.span
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: -50, 
              opacity: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50, 
              opacity: [0, 0.3, 0],
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: 8 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: 'linear'
            }}
            className="absolute text-yellow-400/20 text-2xl font-mono"
          >
            {text}
          </motion.span>
        ))}
      </div>

      {/* Title */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <h1 className="text-8xl font-black tracking-tight">
          <span className="text-white">Code</span>
          <span className="text-yellow-400">Kart</span>
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-xl mt-4"
        >
          Solve. Sabotage. Survive.
        </motion.p>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-6 text-center z-10"
      >
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl mb-1">⚔️</p>
          <p className="text-gray-400 text-sm">1v1 Real-time</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl mb-1">💻</p>
          <p className="text-gray-400 text-sm">Solve Algorithms</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl mb-1">💥</p>
          <p className="text-gray-400 text-sm">Sabotage Opponent</p>
        </div>
      </motion.div>

      {/* Username Input */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4 z-10"
      >
        <input
          type="text"
          placeholder="Enter your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
          className="w-80 px-6 py-4 rounded-xl bg-gray-800/80 border-2 border-gray-700 
                     text-white text-lg text-center outline-none
                     focus:border-yellow-400 transition-colors backdrop-blur-sm"
          maxLength={20}
          autoFocus
        />
        <motion.button
          onClick={handlePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-80 px-6 py-4 rounded-xl bg-yellow-400 text-black 
                     text-xl font-bold cursor-pointer
                     hover:bg-yellow-300 transition-colors"
        >
          🏁 PLAY
        </motion.button>
      </motion.div>

      {/* Powerup Preview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 z-10 mt-4"
      >
        {Object.entries(POWERUP_EMOJIS_HOME).map(([key, emoji], i) => (
          <motion.div
            key={key}
            initial={{ rotate: 0 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500/50
                       flex items-center justify-center text-lg"
            title={key}
          >
            {emoji}
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <p className="text-gray-600 text-sm mt-8 z-10">
        Real-time multiplayer competitive coding
      </p>
    </div>
  );
}

const POWERUP_EMOJIS_HOME = {
  'Smoke Screen': '🌫️',
  'Earthquake': '📳',
  'Flashbang': '☀️',
  'Dyslexia': '🔀',
  'Ant Font': '🔍'
};

export default Home;