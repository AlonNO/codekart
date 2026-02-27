import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, elo, wins, losses, games_played')
      .order('elo', { ascending: false })
      .limit(50);

    if (!error && data) {
      setPlayers(data);
    }
    setLoading(false);
  }

  const getRankInfo = (elo) => {
    if (elo >= 2000) return { title: 'Grandmaster', color: 'text-red-400', bg: 'bg-red-900/20' };
    if (elo >= 1600) return { title: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-900/20' };
    if (elo >= 1300) return { title: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    if (elo >= 1100) return { title: 'Silver', color: 'text-gray-300', bg: 'bg-gray-700/20' };
    return { title: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-900/20' };
  };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-8">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg cursor-pointer
                     hover:bg-gray-700 transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-black">
          🏆 <span className="text-white">Leader</span><span className="text-yellow-400">board</span>
        </h1>
        <div className="w-20" />
      </div>

      {/* Your Rank */}
      {profile && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-2xl mb-6 bg-yellow-900/20 border border-yellow-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500
                              flex items-center justify-center font-black text-white">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-yellow-400 font-bold">{profile.username} (You)</p>
                <p className={`text-xs ${getRankInfo(profile.elo).color}`}>
                  {getRankInfo(profile.elo).title}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-xl">{profile.elo}</p>
              <p className="text-gray-500 text-xs">{profile.wins}W / {profile.losses}L</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No players yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, i) => {
              const rank = getRankInfo(player.elo);
              const isYou = profile?.username === player.username;

              return (
                <motion.div
                  key={player.username}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isYou
                      ? 'bg-yellow-900/20 border-yellow-700'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 text-center font-bold ${i < 3 ? 'text-xl' : 'text-gray-500 text-sm'}`}>
                      {getMedal(i)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isYou ? 'text-yellow-400' : 'text-white'}`}>
                        {player.username} {isYou && '(You)'}
                      </p>
                      <p className={`text-xs ${rank.color}`}>{rank.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{player.elo}</p>
                    <p className="text-gray-500 text-xs">
                      {player.wins}W {player.losses}L ({player.games_played}G)
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;