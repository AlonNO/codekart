const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const vm = require('vm');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jacgotvppetopxcrldgb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ status: 'alive', timestamp: Date.now() });
});

// ============================================
// CONSTANTS
// ============================================
const HIDDEN_TEST_COUNT = 20;
const MAX_HEARTS = 3;
const ITEM_BOX_COOLDOWN = 15000; // 15 seconds minimum between claims

const POWERUP_TYPES = [
  'blur', 'shake', 'light_theme', 'reverse_typing', 'tiny_font',
  'vim_curse', 'censor_bar', 'ghost_typist'
];
function getRandomPowerup() {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
}

// ============================================
// PROBLEMS DATABASE
// ============================================
const PROBLEMS = {
  twoSum: {
    id: 'twoSum',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as an array of two numbers.`,
    displayExamples: [
      { input: 'twoSum([2, 7, 11, 15], 9)', output: '[0, 1]' },
      { input: 'twoSum([3, 2, 4], 6)', output: '[1, 2]' },
      { input: 'twoSum([3, 3], 6)', output: '[0, 1]' },
    ],
    exampleTests: [
      { input: [JSON.stringify([2, 7, 11, 15]), '9'] },
      { input: [JSON.stringify([3, 2, 4]), '6'] },
      { input: [JSON.stringify([3, 3]), '6'] },
    ],
    starterCode: `function twoSum(nums, target) {\n  // Write your solution here\n\n}`,
    functionName: 'twoSum',
    solve: (nums, target) => {
      const map = {};
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (comp in map) return [map[comp], i];
        map[nums[i]] = i;
      }
    },
    validate: (inputArgs, userOutput) => {
      const nums = JSON.parse(inputArgs[0]);
      const target = parseInt(inputArgs[1]);
      if (!Array.isArray(userOutput) || userOutput.length !== 2) return false;
      const [i, j] = userOutput;
      if (typeof i !== 'number' || typeof j !== 'number') return false;
      if (i === j || i < 0 || j < 0 || i >= nums.length || j >= nums.length) return false;
      return nums[i] + nums[j] === target;
    },
    generateHiddenTests: (count) => {
      const tests = [];
      for (let t = 0; t < count; t++) {
        const len = 4 + Math.floor(Math.random() * 12);
        const nums = [];
        for (let j = 0; j < len; j++) {
          nums.push(200 + j * 17 + Math.floor(Math.random() * 10));
        }
        const idx1 = Math.floor(Math.random() * len);
        let idx2 = Math.floor(Math.random() * (len - 1));
        if (idx2 >= idx1) idx2++;
        nums[idx1] = Math.floor(Math.random() * 30) + 1;
        nums[idx2] = Math.floor(Math.random() * 30) + 1;
        const target = nums[idx1] + nums[idx2];
        tests.push({ input: [JSON.stringify(nums), String(target)] });
      }
      return tests;
    }
  },

  reverseString: {
    id: 'reverseString',
    title: 'Reverse String',
    description: `Write a function that reverses a string.\n\nThe input string is given as a string s.\n\nReturn the reversed string.`,
    displayExamples: [
      { input: 'reverseString("hello")', output: '"olleh"' },
      { input: 'reverseString("world")', output: '"dlrow"' },
      { input: 'reverseString("racecar")', output: '"racecar"' },
    ],
    exampleTests: [
      { input: ['"hello"'] },
      { input: ['"world"'] },
      { input: ['"racecar"'] },
    ],
    starterCode: `function reverseString(s) {\n  // Write your solution here\n\n}`,
    functionName: 'reverseString',
    solve: (s) => s.split('').reverse().join(''),
    validate: null,
    generateHiddenTests: (count) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const tests = [];
      for (let t = 0; t < count; t++) {
        const len = 3 + Math.floor(Math.random() * 20);
        let s = '';
        for (let j = 0; j < len; j++) s += chars[Math.floor(Math.random() * chars.length)];
        tests.push({ input: [`"${s}"`] });
      }
      return tests;
    }
  },

  fizzBuzz: {
    id: 'fizzBuzz',
    title: 'FizzBuzz',
    description: `Given an integer n, return a string array answer where:\n\n- answer[i] == "FizzBuzz" if i+1 is divisible by 3 and 5\n- answer[i] == "Fizz" if i+1 is divisible by 3\n- answer[i] == "Buzz" if i+1 is divisible by 5\n- answer[i] == the string of i+1 if none of the above`,
    displayExamples: [
      { input: 'fizzBuzz(5)', output: '["1","2","Fizz","4","Buzz"]' },
      { input: 'fizzBuzz(3)', output: '["1","2","Fizz"]' },
      { input: 'fizzBuzz(15)', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    exampleTests: [
      { input: ['5'] },
      { input: ['3'] },
      { input: ['15'] },
    ],
    starterCode: `function fizzBuzz(n) {\n  // Write your solution here\n\n}`,
    functionName: 'fizzBuzz',
    solve: (n) => {
      const result = [];
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) result.push("FizzBuzz");
        else if (i % 3 === 0) result.push("Fizz");
        else if (i % 5 === 0) result.push("Buzz");
        else result.push(String(i));
      }
      return result;
    },
    validate: null,
    generateHiddenTests: (count) => {
      const tests = [];
      const used = new Set();
      for (let t = 0; t < count; t++) {
        let n;
        do { n = 1 + Math.floor(Math.random() * 100); } while (used.has(n));
        used.add(n);
        tests.push({ input: [String(n)] });
      }
      return tests;
    }
  },

  isPalindrome: {
    id: 'isPalindrome',
    title: 'Valid Palindrome',
    description: `Given a string s, return true if it is a palindrome (reads the same forward and backward), false otherwise.\n\nOnly consider lowercase letters (no spaces or special chars will be given).`,
    displayExamples: [
      { input: 'isPalindrome("racecar")', output: 'true' },
      { input: 'isPalindrome("hello")', output: 'false' },
      { input: 'isPalindrome("abba")', output: 'true' },
    ],
    exampleTests: [
      { input: ['"racecar"'] },
      { input: ['"hello"'] },
      { input: ['"abba"'] },
    ],
    starterCode: `function isPalindrome(s) {\n  // Write your solution here\n\n}`,
    functionName: 'isPalindrome',
    solve: (s) => s === s.split('').reverse().join(''),
    validate: null,
    generateHiddenTests: (count) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const tests = [];
      for (let t = 0; t < count; t++) {
        if (Math.random() < 0.5) {
          const halfLen = 2 + Math.floor(Math.random() * 5);
          let half = '';
          for (let j = 0; j < halfLen; j++) half += chars[Math.floor(Math.random() * chars.length)];
          const mid = Math.random() < 0.5 ? chars[Math.floor(Math.random() * chars.length)] : '';
          const palindrome = half + mid + half.split('').reverse().join('');
          tests.push({ input: [`"${palindrome}"`] });
        } else {
          const len = 4 + Math.floor(Math.random() * 10);
          let s = '';
          for (let j = 0; j < len; j++) s += chars[Math.floor(Math.random() * chars.length)];
          if (s === s.split('').reverse().join('')) s += 'x';
          tests.push({ input: [`"${s}"`] });
        }
      }
      return tests;
    }
  },

  maxProfit: {
    id: 'maxProfit',
    title: 'Best Time to Buy & Sell Stock',
    description: `You are given an array prices where prices[i] is the price of a stock on the ith day.\n\nYou want to maximize profit by choosing a single day to buy and a single day to sell.\n\nReturn the maximum profit. If no profit is possible, return 0.`,
    displayExamples: [
      { input: 'maxProfit([7, 1, 5, 3, 6, 4])', output: '5' },
      { input: 'maxProfit([7, 6, 4, 3, 1])', output: '0' },
      { input: 'maxProfit([2, 4, 1])', output: '2' },
    ],
    exampleTests: [
      { input: [JSON.stringify([7, 1, 5, 3, 6, 4])] },
      { input: [JSON.stringify([7, 6, 4, 3, 1])] },
      { input: [JSON.stringify([2, 4, 1])] },
    ],
    starterCode: `function maxProfit(prices) {\n  // Write your solution here\n\n}`,
    functionName: 'maxProfit',
    solve: (prices) => {
      let min = prices[0], maxP = 0;
      for (let i = 1; i < prices.length; i++) {
        if (prices[i] < min) min = prices[i];
        else maxP = Math.max(maxP, prices[i] - min);
      }
      return maxP;
    },
    validate: null,
    generateHiddenTests: (count) => {
      const tests = [];
      for (let t = 0; t < count; t++) {
        const len = 3 + Math.floor(Math.random() * 15);
        const prices = [];
        for (let j = 0; j < len; j++) prices.push(Math.floor(Math.random() * 200) + 1);
        tests.push({ input: [JSON.stringify(prices)] });
      }
      return tests;
    }
  },

  countVowels: {
    id: 'countVowels',
    title: 'Count the Vowels',
    description: `Given a string s, return the number of vowels in the string.\n\nVowels are: a, e, i, o, u (lowercase only).`,
    displayExamples: [
      { input: 'countVowels("hello")', output: '2' },
      { input: 'countVowels("aeiou")', output: '5' },
      { input: 'countVowels("bcdfg")', output: '0' },
    ],
    exampleTests: [
      { input: ['"hello"'] },
      { input: ['"aeiou"'] },
      { input: ['"bcdfg"'] },
    ],
    starterCode: `function countVowels(s) {\n  // Write your solution here\n\n}`,
    functionName: 'countVowels',
    solve: (s) => {
      let count = 0;
      for (const c of s) if ('aeiou'.includes(c)) count++;
      return count;
    },
    validate: null,
    generateHiddenTests: (count) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const tests = [];
      for (let t = 0; t < count; t++) {
        const len = 3 + Math.floor(Math.random() * 25);
        let s = '';
        for (let j = 0; j < len; j++) s += chars[Math.floor(Math.random() * chars.length)];
        tests.push({ input: [`"${s}"`] });
      }
      return tests;
    }
  },

  findMax: {
    id: 'findMax',
    title: 'Find the Maximum',
    description: `Given an array of integers nums, return the largest number in the array.\n\nDo NOT use Math.max or built-in sort.`,
    displayExamples: [
      { input: 'findMax([1, 3, 2, 5, 4])', output: '5' },
      { input: 'findMax([-1, -3, -2])', output: '-1' },
      { input: 'findMax([42])', output: '42' },
    ],
    exampleTests: [
      { input: [JSON.stringify([1, 3, 2, 5, 4])] },
      { input: [JSON.stringify([-1, -3, -2])] },
      { input: [JSON.stringify([42])] },
    ],
    starterCode: `function findMax(nums) {\n  // Write your solution here\n  // Do NOT use Math.max\n\n}`,
    functionName: 'findMax',
    solve: (nums) => {
      let max = nums[0];
      for (let i = 1; i < nums.length; i++) if (nums[i] > max) max = nums[i];
      return max;
    },
    validate: null,
    generateHiddenTests: (count) => {
      const tests = [];
      for (let t = 0; t < count; t++) {
        const len = 3 + Math.floor(Math.random() * 15);
        const nums = [];
        for (let j = 0; j < len; j++) nums.push(Math.floor(Math.random() * 2000) - 1000);
        tests.push({ input: [JSON.stringify(nums)] });
      }
      return tests;
    }
  }
};

const PROBLEM_IDS = Object.keys(PROBLEMS);

// ============================================
// CODE EXECUTION ENGINE
// ============================================
function runSingleTest(userCode, test, problem) {
  const argsStr = test.input.join(', ');
  const functionName = problem.functionName;

  const fullCode = `
${userCode}

(function() {
  try {
    const result = ${functionName}(${argsStr});
    return JSON.stringify(result);
  } catch(e) {
    return "ERROR:" + e.message;
  }
})();
`;

  try {
    const sandbox = {};
    vm.createContext(sandbox);
    const output = vm.runInContext(fullCode, sandbox, { timeout: 2000 });

    if (typeof output === 'string' && output.startsWith('ERROR:')) {
      return { passed: false, error: output };
    }

    let userResult;
    try { userResult = JSON.parse(output); } catch { userResult = output; }

    // Compute expected answer using solve
    const parsedArgs = test.input.map(a => { try { return JSON.parse(a); } catch { return a; } });
    const expected = problem.solve(...parsedArgs);

    // Check if passed
    let passed;
    if (problem.validate) {
      passed = problem.validate(test.input, userResult);
    } else {
      passed = JSON.stringify(userResult) === JSON.stringify(expected);
    }

    return {
      passed,
      input: `${functionName}(${argsStr})`,
      expected: JSON.stringify(expected),
      actual: JSON.stringify(userResult)
    };
  } catch (err) {
    return {
      passed: false,
      input: `${functionName}(${argsStr})`,
      expected: '?',
      actual: err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT'
        ? 'Time limit exceeded (infinite loop?)'
        : `Error: ${err.message}`
    };
  }
}

function executeTests(userCode, tests, problem) {
  const results = [];
  let failCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const result = runSingleTest(userCode, tests[i], problem);
    result.testIndex = i;
    results.push(result);
    if (!result.passed) failCount++;
    // Stop early after 3 failures to save time
    if (failCount >= 3) break;
  }

  return results;
}

// ============================================
// GAME STATE
// ============================================
const waitingQueue = [];
const activeRooms = new Map();
const playerRooms = new Map();

// ============================================
// SOCKET.IO CONNECTION
// ============================================
// ============================================
// ELO & MATCH RECORDING
// ============================================
function calculateElo(winnerElo, loserElo) {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  const winnerChange = Math.round(K * (1 - expectedWinner));
  const loserChange = Math.round(K * (0 - expectedLoser));
  return { winnerChange, loserChange };
}

async function recordMatch(roomId, room, winnerPlayer, problem) {
  if (!supabase) return;

  const loserPlayer = room.players.find(p => p.username !== winnerPlayer.username);
  if (!loserPlayer) return;

  try {
    const { data: winnerProfile } = await supabase
      .from('profiles').select('*').eq('username', winnerPlayer.username).maybeSingle();
    const { data: loserProfile } = await supabase
      .from('profiles').select('*').eq('username', loserPlayer.username).maybeSingle();

    const winnerElo = winnerProfile?.elo || 1000;
    const loserElo = loserProfile?.elo || 1000;
    const { winnerChange, loserChange } = calculateElo(winnerElo, loserElo);
    const duration = Math.round((Date.now() - room.startTime) / 1000);

    // Update winner if they have an account
    if (winnerProfile) {
      await supabase.from('profiles').update({
        elo: winnerProfile.elo + winnerChange,
        wins: winnerProfile.wins + 1,
        games_played: winnerProfile.games_played + 1,
        kart_coins: winnerProfile.kart_coins + 50,
        updated_at: new Date().toISOString()
      }).eq('id', winnerProfile.id);
      console.log(`📊 ${winnerPlayer.username}: +${winnerChange} ELO, +50 coins`);
    }

    // Update loser if they have an account
    if (loserProfile) {
      await supabase.from('profiles').update({
        elo: Math.max(0, loserProfile.elo + loserChange),
        losses: loserProfile.losses + 1,
        games_played: loserProfile.games_played + 1,
        kart_coins: loserProfile.kart_coins + 10,
        updated_at: new Date().toISOString()
      }).eq('id', loserProfile.id);
      console.log(`📊 ${loserPlayer.username}: ${loserChange} ELO, +10 coins`);
    }

    // Record match if at least one player has an account
    if (winnerProfile || loserProfile) {
      await supabase.from('matches').insert({
        room_id: roomId,
        winner_id: winnerProfile?.id || null,
        loser_id: loserProfile?.id || null,
        winner_username: winnerPlayer.username,
        loser_username: loserPlayer.username,
        problem_id: room.problemId,
        problem_title: problem.title,
        win_reason: 'solved',
        duration_seconds: duration,
        winner_elo_change: winnerProfile ? winnerChange : 0,
        loser_elo_change: loserProfile ? loserChange : 0
      });
    }
  } catch (err) {
    console.error('Failed to record match:', err.message);
  }
}

async function recordMatchElimination(roomId, room, winnerPlayer, loserPlayer, problem) {
  if (!supabase) return;

  try {
    const { data: winnerProfile } = await supabase
      .from('profiles').select('*').eq('username', winnerPlayer.username).maybeSingle();
    const { data: loserProfile } = await supabase
      .from('profiles').select('*').eq('username', loserPlayer.username).maybeSingle();

    const winnerElo = winnerProfile?.elo || 1000;
    const loserElo = loserProfile?.elo || 1000;
    const { winnerChange, loserChange } = calculateElo(winnerElo, loserElo);
    const reducedWinnerChange = Math.round(winnerChange * 0.6);
    const duration = Math.round((Date.now() - room.startTime) / 1000);

    if (winnerProfile) {
      await supabase.from('profiles').update({
        elo: winnerProfile.elo + reducedWinnerChange,
        wins: winnerProfile.wins + 1,
        games_played: winnerProfile.games_played + 1,
        kart_coins: winnerProfile.kart_coins + 30,
        updated_at: new Date().toISOString()
      }).eq('id', winnerProfile.id);
      console.log(`📊 ${winnerPlayer.username}: +${reducedWinnerChange} ELO (elim), +30 coins`);
    }

    if (loserProfile) {
      await supabase.from('profiles').update({
        elo: Math.max(0, loserProfile.elo + loserChange),
        losses: loserProfile.losses + 1,
        games_played: loserProfile.games_played + 1,
        kart_coins: loserProfile.kart_coins + 5,
        updated_at: new Date().toISOString()
      }).eq('id', loserProfile.id);
      console.log(`📊 ${loserPlayer.username}: ${loserChange} ELO (elim), +5 coins`);
    }

    if (winnerProfile || loserProfile) {
      await supabase.from('matches').insert({
        room_id: roomId,
        winner_id: winnerProfile?.id || null,
        loser_id: loserProfile?.id || null,
        winner_username: winnerPlayer.username,
        loser_username: loserPlayer.username,
        problem_id: room.problemId,
        problem_title: problem.title,
        win_reason: 'opponent_eliminated',
        duration_seconds: duration,
        winner_elo_change: winnerProfile ? reducedWinnerChange : 0,
        loser_elo_change: loserProfile ? loserChange : 0
      });
    }
  } catch (err) {
    console.error('Failed to record match:', err.message);
  }
}
io.on('connection', (socket) => {
  console.log(`⚡ Player connected: ${socket.id}`);

  // === MATCHMAKING ===
  socket.on('join_queue', (data) => {
    const alreadyInQueue = waitingQueue.some(p => p.id === socket.id);
    if (alreadyInQueue) return;

    const player = {
      id: socket.id,
      username: data.username || `Player_${socket.id.slice(0, 4)}`
    };

    waitingQueue.push(player);
    console.log(`🎮 ${player.username} joined queue. Size: ${waitingQueue.length}`);
    socket.emit('queue_joined', { position: waitingQueue.length });

    if (waitingQueue.length >= 2) {
      const player1 = waitingQueue.shift();
      const player2 = waitingQueue.shift();
      const roomId = `room_${Date.now()}`;
      const problemId = PROBLEM_IDS[Math.floor(Math.random() * PROBLEM_IDS.length)];
      const problem = PROBLEMS[problemId];

      activeRooms.set(roomId, {
        players: [
          { ...player1, hearts: MAX_HEARTS, powerups: [], finished: false, eliminated: false, lastItemBox: 0 },
          { ...player2, hearts: MAX_HEARTS, powerups: [], finished: false, eliminated: false, lastItemBox: 0 }
        ],
        problemId,
        startTime: Date.now()
      });

      playerRooms.set(player1.id, roomId);
      playerRooms.set(player2.id, roomId);

      const s1 = io.sockets.sockets.get(player1.id);
      const s2 = io.sockets.sockets.get(player2.id);
      if (s1) s1.join(roomId);
      if (s2) s2.join(roomId);

      io.to(roomId).emit('game_start', {
        roomId,
        players: [
          { id: player1.id, username: player1.username },
          { id: player2.id, username: player2.username }
        ],
        problem: {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          examples: problem.displayExamples,
          starterCode: problem.starterCode,
          totalHiddenTests: HIDDEN_TEST_COUNT,
          maxHearts: MAX_HEARTS
        }
      });

      console.log(`🏁 Match! ${roomId} | ${player1.username} vs ${player2.username} | ${problem.title}`);
    }
  });

  // === REJOIN ROOM ===
  socket.on('rejoin_room', (data) => {
    const { roomId, username } = data;
    socket.join(roomId);
    const room = activeRooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.username === username);
      if (player) {
        playerRooms.delete(player.id);
        player.id = socket.id;
        playerRooms.set(socket.id, roomId);
      }
    }
    console.log(`🔄 ${username} rejoined ${roomId}`);
  });

  // === RUN CODE (Examples only, infinite uses) ===
  // === RUN CODE (Custom tests, infinite uses) ===
  socket.on('run_code', (data) => {
    const { roomId, code, customTests } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const problem = PROBLEMS[room.problemId];

    // Use custom tests if provided, otherwise use examples
    let testsToRun;
    if (customTests && customTests.length > 0) {
      // Parse custom test inputs from strings
      testsToRun = customTests.map(test => ({
        input: test.input
      }));
    } else {
      testsToRun = problem.exampleTests;
    }

    // Limit to 10 custom tests max
    testsToRun = testsToRun.slice(0, 10);

    const results = executeTests(code, testsToRun, problem);

    socket.emit('run_results', {
      results,
      passedCount: results.filter(r => r.passed).length,
      totalCount: results.length
    });

    console.log(`▶ Run: ${results.filter(r => r.passed).length}/${results.length} passed`);
  });

  // === SUBMIT CODE (Hidden tests, costs a heart) ===
  socket.on('submit_code', (data) => {
    const { roomId, code, username } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const problem = PROBLEMS[room.problemId];
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.eliminated || player.finished) return;

    if (player.hearts <= 0) {
      socket.emit('submit_error', { message: 'No hearts left!' });
      return;
    }

    // FORCE_WIN cheat code for demos
    if (code.includes('// FORCE_WIN')) {
      player.finished = true;
      socket.emit('submit_results', {
        allPassed: true,
        heartsLeft: player.hearts,
        passedCount: HIDDEN_TEST_COUNT + problem.exampleTests.length,
        totalCount: HIDDEN_TEST_COUNT + problem.exampleTests.length,
        exampleResults: problem.exampleTests.map((t, i) => ({
          testIndex: i, passed: true,
          input: `${problem.functionName}(${t.input.join(', ')})`,
          expected: 'OK', actual: 'OK'
        })),
        hiddenPassed: HIDDEN_TEST_COUNT,
        hiddenTotal: HIDDEN_TEST_COUNT,
        firstFailures: []
      });
      room.gameEnded = true;
      io.to(roomId).emit('game_over', { winner: username, reason: 'solved' });
      console.log(`🏆 ${username} WINS (cheat code)!`);
      // Record match in database
      recordMatch(roomId, room, player, problem);
      return;
    }

    // Run examples first
    const exampleResults = executeTests(code, problem.exampleTests, problem);
    const examplesPassed = exampleResults.filter(r => r.passed).length;

    // Generate fresh hidden tests
    const hiddenTests = problem.generateHiddenTests(HIDDEN_TEST_COUNT);
    const hiddenResults = executeTests(code, hiddenTests, problem);
    const hiddenPassed = hiddenResults.filter(r => r.passed).length;

    const totalPassed = examplesPassed + hiddenPassed;
    const totalTests = problem.exampleTests.length + HIDDEN_TEST_COUNT;
    const allPassed = totalPassed === totalTests;

    if (!allPassed) {
      player.hearts -= 1;
      console.log(`💔 ${username} failed submit. Hearts: ${player.hearts}`);
    }

    // Get first 2 hidden failures for display
    const firstFailures = hiddenResults.filter(r => !r.passed).slice(0, 2);

    socket.emit('submit_results', {
      allPassed,
      heartsLeft: player.hearts,
      passedCount: totalPassed,
      totalCount: totalTests,
      exampleResults,
      hiddenPassed,
      hiddenTotal: HIDDEN_TEST_COUNT,
      firstFailures
    });

    // Notify opponent
    const opponent = room.players.find(p => p.id !== socket.id);
    if (opponent) {
      io.to(opponent.id).emit('opponent_update', {
        heartsLeft: player.hearts,
        submitted: true
      });
    }

    if (allPassed) {
      player.finished = true;
      room.gameEnded = true;
      io.to(roomId).emit('game_over', { winner: username, reason: 'solved' });
      console.log(`🏆 ${username} WINS!`);
    } else if (player.hearts <= 0) {
      player.eliminated = true;
      room.gameEnded = true;
      io.to(roomId).emit('game_over', {
        winner: opponent?.username || 'Unknown',
        reason: 'opponent_eliminated'
      });
      console.log(`💀 ${username} ELIMINATED! ${opponent?.username} wins!`);
            // Record match in database
        const winnerPlayer = room.players.find(p => p.id !== socket.id);
        recordMatchElimination(roomId, room, winnerPlayer, player, problem);
    }
  });

  // === CLAIM ITEM BOX ===
  socket.on('claim_itembox', (data) => {
    const { roomId } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.eliminated || player.finished) return;

    // Anti-cheat: cooldown check
    const now = Date.now();
    if (now - player.lastItemBox < ITEM_BOX_COOLDOWN) {
      console.log(`⚠️ ${player.username} item box cooldown`);
      return;
    }

    player.lastItemBox = now;
    const powerup = getRandomPowerup();
    player.powerups.push(powerup);

    socket.emit('powerup_earned', { powerup });
    console.log(`🎁 ${player.username} claimed item box: ${powerup}`);
  });

  // === USE POWERUP ===
  socket.on('use_powerup', (data) => {
    const { roomId, powerupType } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const idx = player.powerups.indexOf(powerupType);
    if (idx === -1) return;

    player.powerups.splice(idx, 1);

    const opponent = room.players.find(p => p.id !== socket.id);
    if (opponent) {
      io.to(opponent.id).emit('sabotage_receive', {
        type: powerupType,
        from: player.username
      });
      console.log(`💥 ${player.username} used ${powerupType} on ${opponent.username}`);
    }

    socket.emit('powerups_updated', { powerups: player.powerups });
  });

  // === DISCONNECT ===
  // === DISCONNECT ===
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);

    const queueIndex = waitingQueue.findIndex(p => p.id === socket.id);
    if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1);

    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        // Only send game_over if the game hasn't already ended
        if (!room.gameEnded) {
          const opponent = room.players.find(p => p.id !== socket.id);
          if (opponent && !opponent.finished && !opponent.eliminated) {
            room.gameEnded = true;
            io.to(opponent.id).emit('game_over', {
              winner: opponent.username,
              reason: 'opponent_disconnected'
            });
          }
        }
        // Clean up the room if both players disconnected
        const otherPlayer = room.players.find(p => p.id !== socket.id);
        if (!otherPlayer || !io.sockets.sockets.get(otherPlayer.id)) {
          activeRooms.delete(roomId);
        }
      }
      playerRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 CodeKart server running on http://localhost:${PORT}`);
});