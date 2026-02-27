import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import ItemBox from '../components/ItemBox';
import TestCases from '../components/TestCases';
import VSScreen from '../components/VSScreen';
import {
  playCountdownTick, playGo, playTestPass, playTestFail,
  playHeartLost, playSabotageHit, playPowerupGrab,
  playVictory, playDefeat, playItemBoxSpawn
} from '../utils/sounds';
import { useAuth } from '../context/AuthContext';
import TypingFXOverlay from '../components/TypingFXOverlay';
import { ensureMonacoTheme } from '../utils/monacoThemeLoader';

const SERVER_URL = import.meta.env.PROD ? 'https://codekart-server.onrender.com' : 'http://localhost:3001';

const POWERUP_EMOJIS = {
  blur: '🌫️', shake: '📳', light_theme: '☀️',
  reverse_typing: '🔀', tiny_font: '🔍',
  vim_curse: '🟢', censor_bar: '█', ghost_typist: '👻'
};

const POWERUP_NAMES = {
  blur: 'Smoke Screen', shake: 'Earthquake', light_theme: 'Flashbang',
  reverse_typing: 'Dyslexia', tiny_font: 'Ant Font',
  vim_curse: 'Vim Curse', censor_bar: 'Censor', ghost_typist: 'Ghost Typist'
};

const GHOST_COMMENTS = [
  '// skill issue',
  '// ur too slow lol',
  '// have u tried console.log?',
  '// just use Python',
  '// copy paste from stackoverflow',
  '// git gud',
  '// ur opponent is almost done btw',
  '// maybe try a different career?',
  '// segfault incoming',
  '// this aint it chief',
];

function Arena() {

  const { profile } = useAuth();


  const location = useLocation();
  const { username, roomId, players, problem: problemData } = location.state || {};

  const [problem] = useState(problemData || null);
  const [code, setCode] = useState(problemData?.starterCode || '');
  const [runResults, setRunResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearts, setHearts] = useState(problemData?.maxHearts || 3);
  const [opponentHearts, setOpponentHearts] = useState(problemData?.maxHearts || 3);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState('');
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
  const [heartShake, setHeartShake] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('problem');
  const [customTests, setCustomTests] = useState(null);
  const [showVS, setShowVS] = useState(true);
  const [vimCurseActive, setVimCurseActive] = useState(false);
  const [ghostTypistActive, setGhostTypistActive] = useState(false);
  const [censorActive, setCensorActive] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const timerRef = useRef(null);
  const powerupIdCounter = useRef(0);
  const codeRef = useRef(code);
  const isRunningRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const gameStartedRef = useRef(false);
  const lastRunTime = useRef(0);
  const customTestsRef = useRef(null);
  const ghostIntervalRef = useRef(null);
  const censorDecorationsRef = useRef([]);
  const baseThemeRef = useRef('vs-dark');
  const particlesRef = useRef('none');
  const particleThrottleRef = useRef(0);
  const fxRef = useRef(null);
  const comboRef = useRef({ count: 0, last: 0 });
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);
  useEffect(() => { customTestsRef.current = customTests; }, [customTests]);

  const opponent = players?.find(p => p.username !== username);
  const functionName = problem?.starterCode?.match(/function\s+(\w+)/)?.[1] || 'fn';
useEffect(() => {
    const base = profile?.equipped_theme || 'vs-dark';
    baseThemeRef.current = base;

    if (activeSabotage !== 'light_theme') {
      if (monacoRef.current) {
        // Monaco is ready — load the theme definition first, THEN apply it
        ensureMonacoTheme(monacoRef.current, base).then(() => {
          setEditorTheme(base);
          monacoRef.current.editor.setTheme(base);
        });
      }
      // If monaco isn't mounted yet, do NOT call setEditorTheme(base) here.
      // handleEditorDidMount will handle it once the editor is ready.
    }

    particlesRef.current = profile?.equipped_particles || 'none';
  }, [profile, activeSabotage]);
  // ==========================================
  // SABOTAGE HANDLERS
  // ==========================================

  const startVimCurse = useCallback(() => {
    setVimCurseActive(true);
  }, []);

  const stopVimCurse = useCallback(() => {
    setVimCurseActive(false);
  }, []);

  const startGhostTypist = useCallback(() => {
    setGhostTypistActive(true);
    if (!editorRef.current) return;

    const editor = editorRef.current;

    ghostIntervalRef.current = setInterval(() => {
      const model = editor.getModel();
      if (!model) return;

      const lineCount = model.getLineCount();
      // Insert at a random line
      const targetLine = Math.floor(Math.random() * lineCount) + 1;
      const comment = GHOST_COMMENTS[Math.floor(Math.random() * GHOST_COMMENTS.length)];

      const lineContent = model.getLineContent(targetLine);
      const edit = {
        range: {
          startLineNumber: targetLine,
          startColumn: lineContent.length + 1,
          endLineNumber: targetLine,
          endColumn: lineContent.length + 1
        },
        text: '\n' + comment
      };

      model.pushEditOperations([], [edit], () => null);
    }, 1500);
  }, []);

  const stopGhostTypist = useCallback(() => {
    setGhostTypistActive(false);
    if (ghostIntervalRef.current) {
      clearInterval(ghostIntervalRef.current);
      ghostIntervalRef.current = null;
    }
  }, []);

  const startCensorBar = useCallback(() => {
    setCensorActive(true);
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const keywords = ['function', 'return', 'const', 'let', 'var', 'for', 'if', 'else', 'while', 'true', 'false', 'null', 'undefined'];
    const decorations = [];

    const lineCount = model.getLineCount();
    for (let line = 1; line <= lineCount; line++) {
      const content = model.getLineContent(line);
      for (const kw of keywords) {
        let idx = content.indexOf(kw);
        while (idx !== -1) {
          if (Math.random() < 0.6) {
            decorations.push({
              range: new monaco.Range(line, idx + 1, line, idx + 1 + kw.length),
              options: {
                inlineClassName: 'censor-decoration',
                stickiness: 1
              }
            });
          }
          idx = content.indexOf(kw, idx + kw.length);
        }
      }
    }

    censorDecorationsRef.current = editor.deltaDecorations([], decorations);
  }, []);

  const stopCensorBar = useCallback(() => {
    setCensorActive(false);
    if (editorRef.current && censorDecorationsRef.current.length > 0) {
      editorRef.current.deltaDecorations(censorDecorationsRef.current, []);
      censorDecorationsRef.current = [];
    }
  }, []);

  const applySabotage = useCallback((type, from) => {
    setSabotageAlert({ type, from });
    setActiveSabotage(type);
    playSabotageHit();

    if (type === 'light_theme') setEditorTheme('light');
    if (type === 'tiny_font') setEditorFontSize(8);
    if (type === 'reverse_typing') setReverseTyping(true);
    if (type === 'vim_curse') startVimCurse();
    if (type === 'ghost_typist') startGhostTypist();
    if (type === 'censor_bar') startCensorBar();

    const durations = {
      blur: 5000, shake: 5000, light_theme: 8000,
      reverse_typing: 5000, tiny_font: 5000,
      vim_curse: 8000, censor_bar: 6000, ghost_typist: 10000
    };
    const duration = durations[type] || 5000;

    setTimeout(() => {
      setActiveSabotage(null);
      setSabotageAlert(null);
      if (type === 'light_theme') setEditorTheme(baseThemeRef.current || 'vs-dark');
      if (type === 'tiny_font') setEditorFontSize(16);
      if (type === 'reverse_typing') setReverseTyping(false);
      if (type === 'vim_curse') stopVimCurse();
      if (type === 'ghost_typist') stopGhostTypist();
      if (type === 'censor_bar') stopCensorBar();
    }, duration);
  }, [startVimCurse, stopVimCurse, startGhostTypist, stopGhostTypist, startCensorBar, stopCensorBar]);

  // ==========================================
  // GAME ACTIONS
  // ==========================================

  const handleTestCasesChange = useCallback((testCases) => {
    const parsed = testCases.map(tc => {
      try {
        const argsArray = Function(`"use strict"; return [${tc.args}]`)();
        return { input: argsArray.map(a => typeof a === 'string' ? `"${a}"` : JSON.stringify(a)) };
      } catch {
        return { input: [tc.args] };
      }
    }).filter(t => t.input.some(i => i.length > 0));
    setCustomTests(parsed.length > 0 ? parsed : null);
  }, []);

  const doRun = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || isRunningRef.current || isSubmittingRef.current || !gameStartedRef.current) return;
    const now = Date.now();
    if (now - lastRunTime.current < 2000) return;
    lastRunTime.current = now;
    setIsRunning(true);
    setRunResults(null);
    setSubmitResults(null);
    setActiveTab('results');
    socket.emit('run_code', { roomId, code: codeRef.current, customTests: customTestsRef.current });
  }, [roomId]);

  const doSubmit = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || isRunningRef.current || isSubmittingRef.current || !gameStartedRef.current) return;
    if (hearts <= 0) return;
    setIsSubmitting(true);
    setRunResults(null);
    setSubmitResults(null);
    setActiveTab('results');
    socket.emit('submit_code', { roomId, code: codeRef.current, username });
  }, [roomId, username, hearts]);

  const handleClaimItemBox = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('claim_itembox', { roomId });
    playPowerupGrab();
  }, [roomId]);

  // ==========================================
  // COUNTDOWN (after VS screen)
  // ==========================================
  useEffect(() => {
    if (showVS) return;
    let count = 3;
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count > 0) playCountdownTick();
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGameStarted(true);
        playGo();
        timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
      }
    }, 1000);
    return () => { clearInterval(countdownInterval); clearInterval(timerRef.current); };
  }, [showVS]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ==========================================
  // SOCKET
  // ==========================================
  useEffect(() => {
    const newSocket = io(SERVER_URL, { forceNew: true });
    socketRef.current = newSocket;

    newSocket.on('connect', () => { setConnected(true); newSocket.emit('rejoin_room', { roomId, username }); });

    newSocket.on('run_results', (data) => {
      setRunResults(data);
      setIsRunning(false);
      if (data.passedCount === data.totalCount && data.totalCount > 0) playTestPass();
      else playTestFail();
    });

    newSocket.on('submit_results', (data) => {
      setSubmitResults(data);
      setIsSubmitting(false);
      setHearts(data.heartsLeft);
      if (data.allPassed) {
        playTestPass();
      } else {
        playHeartLost();
        setHeartShake(true);
        setTimeout(() => setHeartShake(false), 600);
      }
    });

    newSocket.on('opponent_update', (data) => { if (data.heartsLeft !== undefined) setOpponentHearts(data.heartsLeft); });

    newSocket.on('game_over', (data) => {
      setGameOver(true);
      setWinner(data.winner);
      setWinReason(data.reason || 'solved');
      clearInterval(timerRef.current);
      // Clean up any active sabotages
      stopVimCurse(); stopGhostTypist(); stopCensorBar();
      setActiveSabotage(null); setSabotageAlert(null);
      setEditorTheme('vs-dark'); setEditorFontSize(16); setReverseTyping(false);
      if (data.winner === username) playVictory();
      else playDefeat();
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

    newSocket.on('sabotage_receive', (data) => applySabotage(data.type, data.from));

    return () => newSocket.disconnect();
  }, [applySabotage, roomId, username, stopVimCurse, stopGhostTypist, stopCensorBar]);

  // ==========================================
  // REVERSE TYPING
  // ==========================================
  useEffect(() => {
    if (!reverseTyping || !editorRef.current) return;
    const editor = editorRef.current;
    const disposable = editor.onKeyDown((e) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        const swapMap = {
          'a':'s','s':'a','d':'f','f':'d','g':'h','h':'g','j':'k','k':'j',
          'q':'w','w':'q','e':'r','r':'e','t':'y','y':'t','u':'i','i':'u','o':'p','p':'o',
          'z':'x','x':'z','c':'v','v':'c','b':'n','n':'b',
          '(':')',')'  :'(','[':']',']':'[','{':'}','}':'{',
        };
        editor.trigger('keyboard', 'type', { text: swapMap[e.key.toLowerCase()] || e.key });
      }
    });
    return () => disposable.dispose();
  }, [reverseTyping]);

    // Vim curse interceptor
  useEffect(() => {
    if (!vimCurseActive || !editorRef.current) return;

    const editor = editorRef.current;
    let isProcessing = false;

    const vimCommands = [':wq', ':q!', 'dd', 'yy', 'gg', 'ZZ', 'hjkl', ':x', '/pattern', ':set nu', ':w !sudo tee %', 'dG'];

    const disposable = editor.onDidType(() => {
      if (isProcessing) return;
      isProcessing = true;

      const position = editor.getPosition();
      const model = editor.getModel();

      if (position && model && position.column > 1) {
        // 15% chance to INSERT vim text AFTER what they typed (doesn't delete their code)
        if (Math.random() < 0.25) {
          const cmd = vimCommands[Math.floor(Math.random() * vimCommands.length)];

          const insertRange = {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          };

          model.pushEditOperations([], [{
            range: insertRange,
            text: cmd
          }], () => null);
        }
      }

      setTimeout(() => { isProcessing = false; }, 50);
    });

    return () => disposable.dispose();
  }, [vimCurseActive]);
  // ==========================================
  // EDITOR MOUNT
  // ==========================================
async function handleEditorDidMount(editor, monaco) {
  editorRef.current = editor;
  monacoRef.current = monaco;
  editor.focus();

  const base = baseThemeRef.current;
  await ensureMonacoTheme(monaco, base);
  setEditorTheme(base);
  monaco.editor.setTheme(base);

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => doRun());
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => doSubmit());

  editor.onDidType(() => {
    const style = particlesRef.current;
    if (!style || style === 'none') return;

    // combo intensity (both simple + game-like)
    const now = Date.now();
    const c = comboRef.current;
    if (now - c.last < 1200) c.count += 1;
    else c.count = 1;
    c.last = now;

    const intensity = Math.min(2.5, 1 + c.count / 35);

    const pos = editor.getPosition();
    const dom = editor.getDomNode();
    if (!pos || !dom) return;

    const coords = editor.getScrolledVisiblePosition(pos);
    if (!coords) return;

    const rect = dom.getBoundingClientRect();
    const x = rect.left + coords.left;
    const y = rect.top + coords.top;

    // Rare lightning bonus when combo is high
    if (style === 'lightning' && Math.random() < Math.min(0.12, c.count / 120)) {
      fxRef.current?.spawn({ x, y, style: 'lightning', intensity });
    } else {
      fxRef.current?.spawn({ x, y, style, intensity });
    }
  });
}

  const handleUsePowerup = (powerupId, powerupType) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('use_powerup', { roomId, powerupType });
    setPowerups(prev => prev.filter(p => p.id !== powerupId));
  };

  // ==========================================
  // CSS CLASSES
  // ==========================================
  const sabotageClasses = [];
  if (activeSabotage === 'blur') sabotageClasses.push('sabotage-blur');
  if (activeSabotage === 'shake') sabotageClasses.push('sabotage-shake');
  if (activeSabotage === 'reverse_typing') sabotageClasses.push('sabotage-reverse');
  if (vimCurseActive) sabotageClasses.push('sabotage-vim');
  if (censorActive) sabotageClasses.push('sabotage-censor');
  if (ghostTypistActive) sabotageClasses.push('sabotage-ghost');

if (!problem || !roomId || !username) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p className="text-6xl">🏎️</p>
        <p className="text-gray-400 text-xl">No active game found</p>
        <p className="text-gray-600 text-sm">This page requires an active match to display.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-4 px-6 py-3 bg-yellow-400 text-black rounded-xl font-bold cursor-pointer hover:bg-yellow-300 transition-colors"
        >
          🏁 Back to Home
        </button>
      </div>
    );
  }
  const renderHearts = (count, max, color) =>
    Array.from({ length: max }, (_, i) => (
      <span key={i} className={`text-sm ${i < count ? color : 'text-gray-700'}`}>{i < count ? '❤️' : '🖤'}</span>
    ));

  // ==========================================
  // ACTIVE SABOTAGE BANNER TEXT
  // ==========================================
  const getSabotageBanner = () => {
    if (vimCurseActive) return '🟢 VIM MODE — How do you exit vim?';
    if (ghostTypistActive) return '👻 GHOST TYPIST — Someone is writing in your code...';
    if (censorActive) return '████ CENSORED — Some of your code is redacted!';
    if (reverseTyping) return '🔀 DYSLEXIA — Your keys are scrambled!';
    return null;
  };

  const activeBanner = getSabotageBanner();

  return (
    <div className={`h-screen flex flex-col bg-[#0a0a0f] ${sabotageClasses.join(' ')}`}>
      <ItemBox onClaim={handleClaimItemBox} gameStarted={gameStarted} gameOver={gameOver} />

      {/* Sabotage Alert (incoming hit) */}
      <AnimatePresence>
        {sabotageAlert && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 font-bold text-lg">
            💥 {sabotageAlert.from} used {POWERUP_NAMES[sabotageAlert.type]} on you!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setShowPanel(!showPanel)}
            className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors text-sm">
            {showPanel ? '◀' : '▶'}
          </button>
          <span className="text-lg md:text-xl font-bold">
            <span className="text-white">Code</span><span className="text-yellow-400">Kart</span>
          </span>
          <span className="text-yellow-400 text-xs md:text-sm font-mono">{formatTime(timer)}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-green-400 text-xs md:text-sm font-bold hidden sm:inline">{username}</span>
            <div className={`flex gap-0.5 ${heartShake ? 'animate-bounce' : ''}`}>
              {renderHearts(hearts, problem.maxHearts, 'text-green-400')}
            </div>
          </div>
          <span className="text-gray-600 font-bold text-xs md:text-sm">VS</span>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-red-400 text-xs md:text-sm font-bold hidden sm:inline">{opponent?.username || '???'}</span>
            <div className="flex gap-0.5">
              {renderHearts(opponentHearts, problem.maxHearts, 'text-red-400')}
            </div>
          </div>
        </div>

        <div className={`text-xs md:text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '⚡' : '🔴'}
          <span className="hidden md:inline"> {connected ? 'Live' : 'Reconnecting...'}</span>
        </div>
      </div>

      {/* Main Content */}
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-gray-900 border-r border-gray-800 overflow-hidden flex-shrink-0">
              <div className="w-80 md:w-96 h-full overflow-y-auto p-4 md:p-6">
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setActiveTab('problem')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      activeTab === 'problem' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    📋 Problem
                  </button>
                  <button onClick={() => setActiveTab('results')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      activeTab === 'results' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    📊 Results
                    {(runResults || submitResults) && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block" />}
                  </button>
                </div>

                {activeTab === 'problem' && (
                  <>
                    <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-3">{problem.title}</h2>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-line mb-4">{problem.description}</p>
                    <h3 className="text-xs font-bold text-gray-400 mb-2">EXAMPLES</h3>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-2 md:p-3 mb-2 font-mono text-xs md:text-sm">
                        <p className="text-gray-400">Input: <span className="text-green-400">{ex.input}</span></p>
                        <p className="text-gray-400">Output: <span className="text-yellow-400">{ex.output}</span></p>
                      </div>
                    ))}
                    <TestCases examples={problem.examples} functionName={functionName} onTestCasesChange={handleTestCasesChange} />
                    <div className="mt-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-gray-400 text-xs">🚀 Submit runs {problem.totalHiddenTests} hidden tests • {problem.maxHearts} attempts</p>
                    </div>
                  </>
                )}

                {activeTab === 'results' && (
                  <>
                    {!runResults && !submitResults && (
                      <div className="text-center py-12">
                        <p className="text-gray-600 text-3xl mb-3">📭</p>
                        <p className="text-gray-500 text-sm">No results yet</p>
                        <p className="text-gray-600 text-xs mt-1">Click Run or Submit</p>
                      </div>
                    )}

                    {runResults && (
                      <div>
                        <h3 className="text-sm font-bold text-blue-400 mb-3">▶ RUN — {runResults.passedCount}/{runResults.totalCount} passed</h3>
                        {runResults.results.map((r, i) => (
                          <div key={i} className={`rounded-lg p-3 mb-2 text-xs md:text-sm font-mono ${
                            r.passed ? 'bg-green-900/30 border border-green-800 text-green-400'
                                     : 'bg-red-900/30 border border-red-800 text-red-400'}`}>
                            <p>{r.passed ? '✅' : '❌'} Case {i + 1}: {r.input}</p>
                            {!r.passed && <p className="text-xs mt-1">Expected: {r.expected} | Got: {r.actual}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {submitResults && (
                      <div>
                        <h3 className={`text-sm font-bold mb-3 ${submitResults.allPassed ? 'text-green-400' : 'text-red-400'}`}>
                          🚀 SUBMIT — {submitResults.allPassed ? 'ALL PASSED! 🏆' : `${submitResults.passedCount}/${submitResults.totalCount}`}
                        </h3>
                        {submitResults.exampleResults.map((r, i) => (
                          <div key={`ex-${i}`} className={`rounded-lg p-2 mb-2 text-xs font-mono ${
                            r.passed ? 'bg-green-900/30 border border-green-800 text-green-400'
                                     : 'bg-red-900/30 border border-red-800 text-red-400'}`}>
                            <p>{r.passed ? '✅' : '❌'} Example {i + 1}</p>
                          </div>
                        ))}
                        <div className={`rounded-lg p-3 mb-2 text-sm font-mono ${
                          submitResults.hiddenPassed === submitResults.hiddenTotal
                            ? 'bg-green-900/30 border border-green-800 text-green-400'
                            : 'bg-yellow-900/30 border border-yellow-800 text-yellow-400'}`}>
                          <p>🔒 Hidden: {submitResults.hiddenPassed}/{submitResults.hiddenTotal}</p>
                        </div>
                        {submitResults.firstFailures.map((r, i) => (
                          <div key={`fail-${i}`} className="rounded-lg p-2 mb-2 text-xs font-mono bg-red-900/30 border border-red-800 text-red-400">
                            <p>❌ {r.input}</p>
                            <p className="text-xs mt-1">Expected: {r.expected} | Got: {r.actual}</p>
                          </div>
                        ))}
                        {!submitResults.allPassed && (
                          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-center">
                            <p className="text-red-400 font-bold text-lg">💔 -1 Heart!</p>
                            <p className="text-red-300 text-sm">{submitResults.heartsLeft} remaining</p>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel - Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Active sabotage banner */}
          <AnimatePresence>
            {activeBanner && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className={`text-center py-2 text-sm font-bold flex-shrink-0 ${
                  vimCurseActive ? 'bg-green-900 text-green-200' :
                  ghostTypistActive ? 'bg-emerald-900 text-emerald-200' :
                  censorActive ? 'bg-gray-700 text-red-300' :
                  'bg-purple-900 text-purple-200'
                }`}>
                {activeBanner}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme={editorTheme}
              value={code}
              onChange={(v) => setCode(v || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: editorFontSize, minimap: { enabled: false },
                scrollBeyondLastLine: false, padding: { top: 16 },
                lineNumbers: 'on', wordWrap: 'on', tabSize: 2, automaticLayout: true,
              }}
            />
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto max-w-[40%] flex-shrink-0">
              <span className="text-gray-500 text-xs mr-1 hidden md:inline flex-shrink-0">⚡</span>
              {powerups.length === 0 && <span className="text-gray-600 text-xs italic hidden md:inline whitespace-nowrap">Click ❓ to earn!</span>}
              {powerups.map((p) => (
                <motion.button key={p.id}
                  initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                  onClick={() => handleUsePowerup(p.id, p.type)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-900 border-2 border-purple-500 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-800 flex-shrink-0"
                  title={`Use ${POWERUP_NAMES[p.type]} on opponent`}>
                  <span className="text-base md:text-lg">{POWERUP_EMOJIS[p.type]}</span>
                  <span className="text-[7px] md:text-[8px] text-purple-300">{POWERUP_NAMES[p.type]?.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="text-gray-600 text-[10px] md:text-xs text-right leading-tight hidden lg:block">
                <p>Ctrl+Enter = Run</p>
                <p>Ctrl+Shift+Enter = Submit</p>
              </div>
              <button onClick={doRun} disabled={isRunning || isSubmitting || !gameStarted}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-md transition-all cursor-pointer whitespace-nowrap ${
                  isRunning || isSubmitting || !gameStarted
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-blue-500 text-white hover:bg-blue-400 hover:scale-105 active:scale-95'}`}>
                {isRunning ? '⏳...' : '▶ Run'}
              </button>
              <button onClick={doSubmit} disabled={isSubmitting || isRunning || !gameStarted || hearts <= 0}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-md transition-all cursor-pointer whitespace-nowrap ${
                  isSubmitting || isRunning || !gameStarted || hearts <= 0
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105 active:scale-95'}`}>
                {isSubmitting ? '⏳...' : `🚀 Submit (${hearts}❤️)`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VS Screen */}
      {showVS && (
        <VSScreen 
          p1Data={{ username, equipped_border: profile?.equipped_border }} 
          p2Data={opponent}
          problemTitle={problem.title} 
          onComplete={() => setShowVS(false)} 
        />
      )}
<TypingFXOverlay ref={fxRef} />
      {/* Countdown */}
      <AnimatePresence>
        {!showVS && !gameStarted && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="text-center">
              <motion.p key={countdown}
                initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.4 }}
                className="text-9xl font-black text-yellow-400">
                {countdown > 0 ? countdown : 'GO!'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center border-2 border-yellow-400 mx-4">
              <motion.p initial={{ rotateY: 0 }} animate={{ rotateY: 360 }} transition={{ duration: 1 }}
                className="text-5xl md:text-7xl mb-4">{winner === username ? '🏆' : '💀'}</motion.p>
              <h2 className="text-2xl md:text-4xl font-black mb-2">{winner === username ? 'YOU WIN!' : 'YOU LOSE!'}</h2>
              <p className="text-gray-400 text-lg md:text-xl mb-1">
                {winReason === 'opponent_eliminated' && winner === username && '💔 Opponent ran out of hearts!'}
                {winReason === 'opponent_eliminated' && winner !== username && '💔 You ran out of hearts!'}
                {winReason === 'solved' && `${winner} solved it!`}
                {winReason === 'opponent_disconnected' && 'Opponent disconnected'}
              </p>
              <p className="text-gray-500 text-sm">Time: {formatTime(timer)}</p>
              <button onClick={() => window.location.href = '/'}
                className="mt-6 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold text-lg cursor-pointer hover:bg-yellow-300 transition-all">
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