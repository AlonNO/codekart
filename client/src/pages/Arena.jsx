import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = import.meta.env.PROD ? 'https://codekart-server.onrender.com' : 'http://localhost:3001';

const POWERUP_EMOJIS = {
  blur: '🌫️',
  shake: '📳',
  light_theme: '☀️',
  reverse_typing: '🔀',
  tiny_font: '🔍'
};

const POWERUP_NAMES = {
  blur: 'Smoke Screen',
  shake: 'Earthquake',
  light_theme: 'Flashbang',
  reverse_typing: 'Dyslexia',
  tiny_font: 'Ant Font'
};

function Arena() {
  const location = useLocation();
  const { username, roomId, players, problem: problemData } = location.state || {};

  const [problem] = useState(problemData || null);
  const [code, setCode] = useState(problemData?.starterCode || '');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [myTestsPassed, setMyTestsPassed] = useState(0);
  const [opponentTestsPassed, setOpponentTestsPassed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [connected, setConnected] = useState(false);
  const [powerups, setPowerups] = useState([]);
  const [activeSabotage, setActiveSabotage] = useState(null);
  const [sabotageAlert, setSabotageAlert] = useState(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [timer, setTimer] = useState(0);
  const [reverseTyping, setReverseTyping] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const powerupIdCounter = useRef(0);
  const codeRef = useRef(code);
  const isRunningRef = useRef(false);
  const gameStartedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

  const opponent = players?.find(p => p.username !== username);
  const totalTests = problem?.totalTests || 5;

  // Sabotage handler
  const applySabotage = useCallback((type, from) => {
    setSabotageAlert({ type, from });
    setActiveSabotage(type);

    if (type === 'light_theme') setEditorTheme('light');
    if (type === 'tiny_font') setEditorFontSize(8);
    if (type === 'reverse_typing') setReverseTyping(true);

    const duration = type === 'light_theme' ? 8000 : 5000;
    setTimeout(() => {
      setActiveSabotage(null);
      setSabotageAlert(null);
      if (type === 'light_theme') setEditorTheme('vs-dark');
      if (type === 'tiny_font') setEditorFontSize(16);
      if (type === 'reverse_typing') setReverseTyping(false);
    }, duration);
  }, []);

  // Submit handler
  const lastSubmitTime = useRef(0);

  const doSubmit = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || isRunningRef.current || !gameStartedRef.current) return;

    // 2 second cooldown between submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < 2000) return;
    lastSubmitTime.current = now;

    setIsRunning(true);
    setTestResults([]);
    socket.emit('code_submit', { roomId, code: codeRef.current, username });
  }, [roomId, username]);

  // Countdown then Timer
  useEffect(() => {
    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGameStarted(true);
        timerRef.current = setInterval(() => {
          setTimer(prev => prev + 1);
        }, 1000);
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, { forceNew: true });
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🎮 Arena connected:', newSocket.id);
      setConnected(true);
      newSocket.emit('rejoin_room', { roomId, username });
    });

    newSocket.on('test_results', (data) => {
      setTestResults(data.results);
      setIsRunning(false);
      const passed = data.results.filter(r => r.passed).length;
      setMyTestsPassed(passed);
    });

    newSocket.on('opponent_progress', (data) => {
      setOpponentTestsPassed(data.testsPassed);
    });

    newSocket.on('game_over', (data) => {
      setGameOver(true);
      setWinner(data.winner);
      clearInterval(timerRef.current);
    });

    newSocket.on('powerup_earned', (data) => {
      powerupIdCounter.current += 1;
      setPowerups(prev => [...prev, { id: powerupIdCounter.current, type: data.powerup }]);
    });

    newSocket.on('powerups_updated', (data) => {
      setPowerups(data.powerups.map((type) => {
        powerupIdCounter.current += 1;
        return { id: powerupIdCounter.current, type };
      }));
    });

    newSocket.on('sabotage_receive', (data) => {
      console.log('💥 SABOTAGED:', data.type, 'from', data.from);
      applySabotage(data.type, data.from);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [applySabotage, roomId, username]);

  // Reverse typing interceptor
  useEffect(() => {
    if (!reverseTyping || !editorRef.current) return;

    const editor = editorRef.current;

    const disposable = editor.onKeyDown((e) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        const swapMap = {
          'a': 's', 's': 'a', 'd': 'f', 'f': 'd',
          'g': 'h', 'h': 'g', 'j': 'k', 'k': 'j',
          'l': ';', ';': 'l', 'q': 'w', 'w': 'q',
          'e': 'r', 'r': 'e', 't': 'y', 'y': 't',
          'u': 'i', 'i': 'u', 'o': 'p', 'p': 'o',
          'z': 'x', 'x': 'z', 'c': 'v', 'v': 'c',
          'b': 'n', 'n': 'b', 'm': ',', ',': 'm',
          '(': ')', ')': '(', '[': ']', ']': '[',
          '{': '}', '}': '{',
        };

        const original = e.key;
        const swapped = swapMap[original.toLowerCase()] || original;
        const finalChar = original === original.toUpperCase() && original !== original.toLowerCase()
          ? swapped.toUpperCase()
          : swapped;

        editor.trigger('keyboard', 'type', { text: finalChar });
      }
    });

    return () => disposable.dispose();
  }, [reverseTyping]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    editor.focus();

    // Ctrl+Enter to submit
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        doSubmit();
      }
    );
  }

  const handleUsePowerup = (powerupId, powerupType) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('use_powerup', { roomId, powerupType });
    setPowerups(prev => prev.filter(p => p.id !== powerupId));
  };

  const sabotageClasses = [];
  if (activeSabotage === 'blur') sabotageClasses.push('sabotage-blur');
  if (activeSabotage === 'shake') sabotageClasses.push('sabotage-shake');
  if (activeSabotage === 'reverse_typing') sabotageClasses.push('sabotage-reverse');

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-xl">Loading problem...</p>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col bg-[#0a0a0f] ${sabotageClasses.join(' ')}`}>
      {/* Sabotage Alert Banner */}
      <AnimatePresence>
        {sabotageAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 font-bold text-lg"
          >
            💥 {sabotageAlert.from} used {POWERUP_NAMES[sabotageAlert.type] || sabotageAlert.type} on you!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">
            <span className="text-white">Code</span>
            <span className="text-yellow-400">Kart</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-yellow-400 text-sm font-mono">{formatTime(timer)}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm font-bold">{username}</span>
            <div className="w-40 h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-500"
                style={{ width: `${(myTestsPassed / totalTests) * 100}%` }}
              />
            </div>
            <span className="text-green-400 text-xs">{myTestsPassed}/{totalTests}</span>
          </div>
          <span className="text-gray-600 font-bold">VS</span>
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-sm font-bold">{opponent?.username || '???'}</span>
            <div className="w-40 h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-500"
                style={{ width: `${(opponentTestsPassed / totalTests) * 100}%` }}
              />
            </div>
            <span className="text-red-400 text-xs">{opponentTestsPassed}/{totalTests}</span>
          </div>
        </div>

        <div className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '⚡ Live' : '🔴 Reconnecting...'}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">{problem.title}</h2>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-6">
            {problem.description}
          </p>

          <h3 className="text-sm font-bold text-gray-400 mb-3">EXAMPLES</h3>
          {problem.examples.map((ex, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 mb-3 font-mono text-sm">
              <p className="text-gray-400">Input: <span className="text-green-400">{ex.input}</span></p>
              <p className="text-gray-400">Output: <span className="text-yellow-400">{ex.output}</span></p>
            </div>
          ))}

          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-xs">
              📋 {problem.examples.length} examples shown | {totalTests} total hidden tests
            </p>
          </div>

          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-400 mb-3">
                TEST RESULTS — {testResults.filter(r => r.passed).length}/{testResults.length} passed
              </h3>
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 mb-2 text-sm font-mono ${
                    result.passed
                      ? 'bg-green-900/30 border border-green-800 text-green-400'
                      : 'bg-red-900/30 border border-red-800 text-red-400'
                  }`}
                >
                  <p>{result.passed ? '✅' : '❌'} Test {i + 1}: {result.input}</p>
                  {!result.passed && (
                    <p className="text-xs mt-1">
                      Expected: {result.expected} | Got: {result.actual}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          {/* Reverse typing warning */}
          <AnimatePresence>
            {reverseTyping && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-purple-900 text-purple-200 text-center py-2 text-sm font-bold"
              >
                🔀 DYSLEXIA ACTIVE — Your keys are scrambled!
              </motion.div>
            )}
          </AnimatePresence>

          <Editor
            height="calc(100vh - 120px)"
            defaultLanguage="javascript"
            theme={editorTheme}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: editorFontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              lineNumbers: 'on',
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
            }}
          />

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs mr-2">⚡ POWERUPS:</span>
              {powerups.length === 0 && (
                <span className="text-gray-600 text-xs italic">Pass tests to earn powerups!</span>
              )}
              {powerups.map((p) => (
                <motion.button
                  key={p.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleUsePowerup(p.id, p.type)}
                  className="w-12 h-12 rounded-lg bg-purple-900 border-2 border-purple-500 
                             flex flex-col items-center justify-center cursor-pointer
                             hover:bg-purple-800 transition-colors"
                  title={`Use ${POWERUP_NAMES[p.type]} on opponent`}
                >
                  <span className="text-lg">{POWERUP_EMOJIS[p.type]}</span>
                  <span className="text-[8px] text-purple-300">{POWERUP_NAMES[p.type]?.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-xs">Ctrl+Enter</span>
              <button
                onClick={doSubmit}
                disabled={isRunning || !gameStarted}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all cursor-pointer
                  ${isRunning || !gameStarted
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105 active:scale-95'
                  }`}
              >
                {isRunning ? '⏳ Running...' : '▶ Run Tests'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <p className="text-gray-400 text-xl mb-4">
                {opponent?.username || '???'} vs {username}
              </p>
              <p className="text-yellow-400 text-lg mb-8">{problem.title}</p>
              <motion.p
                key={countdown}
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-9xl font-black text-yellow-400"
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-gray-900 rounded-2xl p-12 text-center border-2 border-yellow-400"
            >
              <motion.p
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 1 }}
                className="text-7xl mb-4"
              >
                {winner === username ? '🏆' : '💀'}
              </motion.p>
              <h2 className="text-4xl font-black mb-2">
                {winner === username ? 'YOU WIN!' : 'YOU LOSE!'}
              </h2>
              <p className="text-gray-400 text-xl mb-1">
                {winner} finished first!
              </p>
              <p className="text-gray-500 text-sm">
                Time: {formatTime(timer)}
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-6 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold text-lg cursor-pointer
                           hover:bg-yellow-300 transition-all"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Arena;