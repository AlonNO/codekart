import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';

function VSScreen({ p1Data, p2Data, problemTitle, onComplete }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'clash' | 'problem' | 'done'

  useEffect(() => {
    const timers = [];

    // Phase 1: Players slide in (already happening via 'enter')
    // Phase 2: VS clash after 800ms
    timers.push(setTimeout(() => setPhase('clash'), 800));

    // Phase 3: Show problem after 1800ms
    timers.push(setTimeout(() => setPhase('problem'), 1800));

    // Phase 4: Done after 3500ms
    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-[60] bg-[#0a0a0f] flex items-center justify-center overflow-hidden"
        >
          {/* Animated background lines */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 0.1, 0] }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
                className="absolute h-[2px] w-full bg-yellow-400"
                style={{ top: `${5 + i * 5}%` }}
              />
            ))}
          </div>

          {/* Diagonal split background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/20 to-transparent"
              style={{ clipPath: 'polygon(0 0, 60% 0, 40% 100%, 0 100%)' }} />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-red-900/20 to-transparent"
              style={{ clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)' }} />
          </motion.div>

          {/* Main content */}
          <div className="relative flex items-center justify-center w-full px-8">
            {/* Player 1 - Slides from left */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex-1 flex flex-col items-center"
            >
              {/* Avatar circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              >
                <Avatar username={p1Data?.username} borderId={p1Data?.equipped_border} size="lg" />
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-xl md:text-3xl font-black text-green-400"
              >
                {p1Data?.username}
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-2 h-1 w-32 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full"
              />
            </motion.div>

            {/* VS Badge - Center */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={phase === 'clash' || phase === 'problem' ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ type: 'spring', damping: 8, stiffness: 200 }}
              className="mx-4 md:mx-8 flex-shrink-0"
            >
              <div className="relative">
                {/* Glow */}
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl"
                />
                {/* Badge */}
                <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full 
                                bg-gradient-to-br from-yellow-300 to-orange-500
                                flex items-center justify-center
                                border-4 border-yellow-200 shadow-2xl shadow-yellow-500/50">
                  <span className="text-3xl md:text-5xl font-black text-black">VS</span>
                </div>
              </div>
            </motion.div>

            {/* Player 2 - Slides from right */}
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex-1 flex flex-col items-center"
            >
                            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              >
                <Avatar username={p2Data?.username} borderId={p2Data?.equipped_border} size="lg" />
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-xl md:text-3xl font-black text-red-400"
              >
                {p2Data?.username || '???'}
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-2 h-1 w-32 bg-gradient-to-r from-transparent via-red-400 to-transparent rounded-full"
              />
            </motion.div>
          </div>

          {/* Problem Title - Appears at bottom */}
          <AnimatePresence>
            {(phase === 'problem') && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-16 md:bottom-20 left-0 right-0 text-center"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto w-64 md:w-96 h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-4"
                />
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Today's Challenge</p>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-yellow-400 text-2xl md:text-4xl font-black"
                >
                  {problemTitle}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top decoration */}
          <div className="absolute top-6 left-0 right-0 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold"
            >
              <span className="text-white">Code</span>
              <span className="text-yellow-400">Kart</span>
              <span className="ml-2">🏎️</span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VSScreen;