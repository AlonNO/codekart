import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } else {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        setLoading(false);
        return;
      }
      if (username.trim().length > 20) {
        setError('Username must be 20 characters or less');
        setLoading(false);
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setError('Username can only contain letters, numbers, and underscores');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, username.trim());
      if (error) {
        setError(error.message);
      } else {
        setSignupSuccess(true);
      }
    }

    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 max-w-md"
        >
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-2xl font-bold text-green-400 mb-3">Account Created!</h2>
          <p className="text-gray-400 mb-6">
            Check your email to confirm your account, then log in.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
            className="px-6 py-3 bg-yellow-400 text-black rounded-xl font-bold cursor-pointer
                       hover:bg-yellow-300 transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-5xl font-black">
          <span className="text-white">Code</span>
          <span className="text-yellow-400">Kart</span>
          <span className="ml-2">🏎️</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700"
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-bold cursor-pointer transition-colors ${
              isLogin ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-bold cursor-pointer transition-colors ${
              !isLogin ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cool_coder_42"
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700
                           text-white outline-none focus:border-yellow-400 transition-colors"
                maxLength={20}
              />
            </div>
          )}

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700
                         text-white outline-none focus:border-yellow-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700
                         text-white outline-none focus:border-yellow-400 transition-colors"
              required
              minLength={6}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center bg-red-900/30 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-lg cursor-pointer transition-all ${
              loading
                ? 'bg-gray-700 text-gray-500'
                : 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {loading ? '⏳ Please wait...' : isLogin ? '🏁 Log In' : '🏎️ Create Account'}
          </button>
        </form>

        {/* Guest play option */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors"
          >
            or play as guest →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;