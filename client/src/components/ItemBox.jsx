import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playItemBoxSpawn } from '../utils/sounds';

function ItemBox({ onClaim, gameStarted, gameOver }) {
  const [box, setBox] = useState(null);
  const timeoutRef = useRef(null);
  const despawnRef = useRef(null);

  const spawnBox = useCallback(() => {
    if (gameOver) return;

    // Random delay between 20-40 seconds
    const delay = 20000 + Math.random() * 20000;

    timeoutRef.current = setTimeout(() => {
      if (gameOver) return;

      // Random position (constrained to right 60% of screen, middle 60% vertically)
      const x = window.innerWidth * 0.35 + Math.random() * (window.innerWidth * 0.55);
      const y = window.innerHeight * 0.15 + Math.random() * (window.innerHeight * 0.55);

      const newBox = {
        id: Date.now(),
        x: Math.min(x, window.innerWidth - 80),
        y: Math.min(y, window.innerHeight - 80),
      };

      setBox(newBox);
      playItemBoxSpawn();

      // Auto-despawn after 6 seconds if not clicked
      despawnRef.current = setTimeout(() => {
        setBox(null);
        spawnBox(); // Schedule next box
      }, 6000);
    }, delay);
  }, [gameOver]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // First box appears after 15-25 seconds
      const initialDelay = 15000 + Math.random() * 10000;
      timeoutRef.current = setTimeout(() => {
        spawnBox();
        // Trigger the first spawn cycle
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        spawnBox();
      }, initialDelay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (despawnRef.current) clearTimeout(despawnRef.current);
    };
  }, [gameStarted, gameOver, spawnBox]);

  const handleClick = () => {
    if (!box) return;
    setBox(null);
    if (despawnRef.current) clearTimeout(despawnRef.current);
    onClaim();
    // Schedule next box
    spawnBox();
  };

  return (
    <AnimatePresence>
      {box && (
        <motion.div
          key={box.id}
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: 0,
            opacity: 1,
            y: [0, -8, 0],
          }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{
            scale: { repeat: Infinity, duration: 1.5 },
            y: { repeat: Infinity, duration: 1.5 },
            rotate: { duration: 0.4 },
            opacity: { duration: 0.3 },
          }}
          onClick={handleClick}
          className="fixed z-40 cursor-pointer select-none"
          style={{ left: box.x, top: box.y }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-400 rounded-xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
            {/* The box */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 
                            rounded-xl border-4 border-yellow-300
                            flex items-center justify-center text-3xl
                            hover:scale-125 active:scale-90 transition-transform
                            shadow-lg shadow-yellow-500/50">
              ❓
            </div>
            {/* Click hint */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold whitespace-nowrap"
            >
              CLICK!
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ItemBox;