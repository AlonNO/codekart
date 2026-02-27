import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [guestUsername, setGuestUsername] = useState('');
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();

  // Pre-compute random values so they're stable across renders
  const particles = useMemo(() => {
    return ['{ }', '( )', '< />', 'fn()', '[ ]', '===', '++', '=>', '&&', '||'].map((text, i) => ({
      text,
      x: (i * 137.5 + 50) % 1000,
      rotate: (i * 47) % 360,
      duration: 8 + (i * 1.3) % 10,
      delay: (i * 0.7) % 5,
    }));
  }, []);

  const handlePlay = () => {
    const name = user && profile ? profile.username : guestUsername.trim();
    if (!name || name.length < 2) {
      alert('Enter a username (at least 2 characters)');
      return;
    }
    navigate('/lobby', {
      state: {
        username: name,
        userId: user?.id || null,
        isGuest: !user
      }
    });
  };

  const getRankTitle = (elo) => {
    if (elo >= 2000) return { title: 'Grandmaster', color: 'text-red-400' };
    if (elo >= 1600) return { title: 'Diamond', color: 'text-cyan-400' };
    if (elo >= 1300) return { title: 'Gold', color: 'text-yellow-400' };
    if (elo >= 1100) return { title: 'Silver', color: 'text-gray-300' };
    return { title: 'Bronze', color: 'text-orange-400' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.span
            key={i}
            initial={{ x: p.x, y: -50, opacity: 0 }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
              opacity: [0, 0.3, 0],
              rotate: p.rotate
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            className="absolute text-yellow-400/20 text-2xl font-mono"
          >
            {p.text}
          </motion.span>
        ))}
      </div>

      {/* Auth Buttons (top right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {user && profile ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-bold
                         hover:bg-gray-700 cursor-pointer transition-colors"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={signOut}
              className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm
                         hover:bg-gray-700 cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-gray-800 text-yellow-400 rounded-lg font-bold text-sm
                       hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700"
          >
            🔑 Login / Sign Up
          </button>
        )}
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

      {/* Features */}
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

      {/* Player Card / Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4 z-10"
      >
        {user && profile ? (
          /* Logged In Player Card */
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 w-80 text-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500
                            flex items-center justify-center text-2xl font-black text-white mx-auto mb-3
                            border-2 border-yellow-300">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <p className="text-xl font-bold text-white">{profile.username}</p>
            <p className={`text-sm font-bold ${getRankTitle(profile.elo).color}`}>
              {getRankTitle(profile.elo).title} — {profile.elo} ELO
            </p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-400">
              <span>🏆 {profile.wins}W</span>
              <span>💀 {profile.losses}L</span>
              <span>🎮 {profile.games_played} played</span>
            </div>
            <p className="text-yellow-400 text-sm mt-2 font-bold">
              💰 {profile.kart_coins} Kart Coins
            </p>
          </div>
        ) : (
          /* Guest Input */
          <input
            type="text"
            placeholder="Enter guest username..."
            value={guestUsername}
            onChange={(e) => setGuestUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            className="w-80 px-6 py-4 rounded-xl bg-gray-800/80 border-2 border-gray-700
                       text-white text-lg text-center outline-none
                       focus:border-yellow-400 transition-colors backdrop-blur-sm"
            maxLength={20}
            autoFocus
          />
        )}

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

        {!user && (
          <p className="text-gray-600 text-xs">
            <span className="cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => navigate('/auth')}>
              Sign up
            </span>
            {' '}to track ELO, earn coins & unlock cosmetics
          </p>
        )}
      </motion.div>

      {/* Footer */}
      <p className="text-gray-600 text-sm mt-8 z-10">
        Real-time multiplayer competitive coding
      </p>
    </div>
  );
}

export default Home;