const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

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
// PROBLEMS DATABASE
// ============================================
const PROBLEMS = {
  twoSum: {
    id: 'twoSum',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as an array of two numbers.`,
    examples: [
      { input: 'twoSum([2, 7, 11, 15], 9)', output: '[0, 1]' },
      { input: 'twoSum([3, 2, 4], 6)', output: '[1, 2]' },
    ],
    testCases: [
      { input: [JSON.stringify([2, 7, 11, 15]), '9'], expected: [0, 1] },
      { input: [JSON.stringify([3, 2, 4]), '6'], expected: [1, 2] },
      { input: [JSON.stringify([3, 3]), '6'], expected: [0, 1] },
      { input: [JSON.stringify([1, 5, 3, 7]), '8'], expected: [1, 2] },
      { input: [JSON.stringify([4, 1, 2, 3, 5]), '7'], expected: [2, 4] },
    ],
    starterCode: `function twoSum(nums, target) {\n  // Write your solution here\n\n}`,
    functionName: 'twoSum'
  },
  reverseString: {
    id: 'reverseString',
    title: 'Reverse String',
    description: `Write a function that reverses a string.\n\nThe input string is given as a string s.\n\nReturn the reversed string.`,
    examples: [
      { input: 'reverseString("hello")', output: '"olleh"' },
      { input: 'reverseString("world")', output: '"dlrow"' },
    ],
    testCases: [
      { input: ['"hello"'], expected: 'olleh' },
      { input: ['"world"'], expected: 'dlrow' },
      { input: ['"abcdef"'], expected: 'fedcba' },
      { input: ['"a"'], expected: 'a' },
      { input: ['"racecar"'], expected: 'racecar' },
    ],
    starterCode: `function reverseString(s) {\n  // Write your solution here\n\n}`,
    functionName: 'reverseString'
  },
  fizzBuzz: {
    id: 'fizzBuzz',
    title: 'FizzBuzz',
    description: `Given an integer n, return a string array answer where:\n\n- answer[i] == "FizzBuzz" if i+1 is divisible by 3 and 5\n- answer[i] == "Fizz" if i+1 is divisible by 3\n- answer[i] == "Buzz" if i+1 is divisible by 5\n- answer[i] == the string of i+1 if none of the above`,
    examples: [
      { input: 'fizzBuzz(5)', output: '["1","2","Fizz","4","Buzz"]' },
      { input: 'fizzBuzz(3)', output: '["1","2","Fizz"]' },
    ],
    testCases: [
      { input: ['3'], expected: ["1","2","Fizz"] },
      { input: ['5'], expected: ["1","2","Fizz","4","Buzz"] },
      { input: ['15'], expected: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"] },
      { input: ['1'], expected: ["1"] },
      { input: ['6'], expected: ["1","2","Fizz","4","Buzz","Fizz"] },
    ],
    starterCode: `function fizzBuzz(n) {\n  // Write your solution here\n\n}`,
    functionName: 'fizzBuzz'
  },
  isPalindrome: {
    id: 'isPalindrome',
    title: 'Valid Palindrome',
    description: `Given a string s, return true if it is a palindrome (reads the same forward and backward), false otherwise.\n\nOnly consider lowercase letters (no spaces or special chars will be given).`,
    examples: [
      { input: 'isPalindrome("racecar")', output: 'true' },
      { input: 'isPalindrome("hello")', output: 'false' },
    ],
    testCases: [
      { input: ['"racecar"'], expected: true },
      { input: ['"hello"'], expected: false },
      { input: ['"abba"'], expected: true },
      { input: ['"a"'], expected: true },
      { input: ['"abcba"'], expected: true },
    ],
    starterCode: `function isPalindrome(s) {\n  // Write your solution here\n\n}`,
    functionName: 'isPalindrome'
  }
  ,
  maxProfit: {
    id: 'maxProfit',
    title: 'Best Time to Buy & Sell Stock',
    description: `You are given an array prices where prices[i] is the price of a stock on the ith day.\n\nYou want to maximize profit by choosing a single day to buy and a single day to sell.\n\nReturn the maximum profit. If no profit is possible, return 0.`,
    examples: [
      { input: 'maxProfit([7, 1, 5, 3, 6, 4])', output: '5' },
      { input: 'maxProfit([7, 6, 4, 3, 1])', output: '0' },
    ],
    testCases: [
      { input: [JSON.stringify([7, 1, 5, 3, 6, 4])], expected: 5 },
      { input: [JSON.stringify([7, 6, 4, 3, 1])], expected: 0 },
      { input: [JSON.stringify([2, 4, 1])], expected: 2 },
      { input: [JSON.stringify([1, 2])], expected: 1 },
      { input: [JSON.stringify([3, 8, 2, 10, 1])], expected: 8 },
    ],
    starterCode: `function maxProfit(prices) {\n  // Write your solution here\n\n}`,
    functionName: 'maxProfit'
  },
  countVowels: {
    id: 'countVowels',
    title: 'Count the Vowels',
    description: `Given a string s, return the number of vowels in the string.\n\nVowels are: a, e, i, o, u (lowercase only).`,
    examples: [
      { input: 'countVowels("hello")', output: '2' },
      { input: 'countVowels("aeiou")', output: '5' },
    ],
    testCases: [
      { input: ['"hello"'], expected: 2 },
      { input: ['"aeiou"'], expected: 5 },
      { input: ['"bcdfg"'], expected: 0 },
      { input: ['"programming"'], expected: 3 },
      { input: ['"a"'], expected: 1 },
    ],
    starterCode: `function countVowels(s) {\n  // Write your solution here\n\n}`,
    functionName: 'countVowels'
  },
  findMax: {
    id: 'findMax',
    title: 'Find the Maximum',
    description: `Given an array of integers nums, return the largest number in the array.\n\nDo NOT use Math.max or built-in sort.`,
    examples: [
      { input: 'findMax([1, 3, 2, 5, 4])', output: '5' },
      { input: 'findMax([-1, -3, -2])', output: '-1' },
    ],
    testCases: [
      { input: [JSON.stringify([1, 3, 2, 5, 4])], expected: 5 },
      { input: [JSON.stringify([-1, -3, -2])], expected: -1 },
      { input: [JSON.stringify([42])], expected: 42 },
      { input: [JSON.stringify([10, 20, 30, 5, 25])], expected: 30 },
      { input: [JSON.stringify([0, 0, 0, 1, 0])], expected: 1 },
    ],
    starterCode: `function findMax(nums) {\n  // Write your solution here\n  // Do NOT use Math.max\n\n}`,
    functionName: 'findMax'
  }
};

const PROBLEM_IDS = Object.keys(PROBLEMS);

// ============================================
// PISTON API CODE EXECUTION
// ============================================
const vm = require('vm');

async function executeCode(userCode, testCases, functionName) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    const argsStr = test.input.join(', ');

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
      const output = vm.runInContext(fullCode, sandbox, { timeout: 3000 });

      if (typeof output === 'string' && output.startsWith('ERROR:')) {
        results.push({
          testIndex: i,
          input: `${functionName}(${argsStr})`,
          expected: JSON.stringify(test.expected),
          actual: output,
          passed: false
        });
      } else {
        let actualResult;
        try {
          actualResult = JSON.parse(output);
        } catch {
          actualResult = output;
        }

        const passed = JSON.stringify(actualResult) === JSON.stringify(test.expected);

        results.push({
          testIndex: i,
          input: `${functionName}(${argsStr})`,
          expected: JSON.stringify(test.expected),
          actual: JSON.stringify(actualResult),
          passed
        });
      }
    } catch (err) {
      results.push({
        testIndex: i,
        input: `${functionName}(${argsStr})`,
        expected: JSON.stringify(test.expected),
        actual: err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' 
          ? 'Time limit exceeded (infinite loop?)' 
          : `Error: ${err.message}`,
        passed: false
      });
    }
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
// POWERUP SYSTEM
// ============================================
const POWERUP_TYPES = ['blur', 'shake', 'light_theme', 'reverse_typing', 'tiny_font'];

function getRandomPowerup() {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
}

// ============================================
// SOCKET.IO CONNECTION
// ============================================
io.on('connection', (socket) => {
  console.log(`⚡ Player connected: ${socket.id}`);

  socket.on('join_queue', (data) => {
    const alreadyInQueue = waitingQueue.some(p => p.id === socket.id);
    if (alreadyInQueue) {
      console.log(`⚠️ ${socket.id} already in queue, ignoring`);
      return;
    }

    const player = {
      id: socket.id,
      username: data.username || `Player_${socket.id.slice(0, 4)}`
    };

    waitingQueue.push(player);
    console.log(`🎮 ${player.username} joined the queue. Queue size: ${waitingQueue.length}`);

    socket.emit('queue_joined', { position: waitingQueue.length });
    
    if (waitingQueue.length >= 2) {
      const player1 = waitingQueue.shift();
      const player2 = waitingQueue.shift();

      const roomId = `room_${Date.now()}`;
      
      // Pick a random problem
      const problemId = PROBLEM_IDS[Math.floor(Math.random() * PROBLEM_IDS.length)];
      const problem = PROBLEMS[problemId];

      activeRooms.set(roomId, {
        players: [
          { ...player1, testsPassed: 0, powerups: [], finished: false },
          { ...player2, testsPassed: 0, powerups: [], finished: false }
        ],
        problemId,
        startTime: Date.now()
      });

      playerRooms.set(player1.id, roomId);
      playerRooms.set(player2.id, roomId);

      const socket1 = io.sockets.sockets.get(player1.id);
      const socket2 = io.sockets.sockets.get(player2.id);

      if (socket1) socket1.join(roomId);
      if (socket2) socket2.join(roomId);

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
          examples: problem.examples,
          starterCode: problem.starterCode,
          totalTests: problem.testCases.length
        }
      });

      console.log(`🏁 Match started! Room: ${roomId} | ${player1.username} vs ${player2.username} | Problem: ${problem.title}`);
    }
  });

  // Player rejoins room from Arena page
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

    console.log(`🔄 ${username} rejoined room ${roomId} with socket ${socket.id}`);
  });

  // Player submits code
  socket.on('code_submit', async (data) => {
    const { roomId, code, username } = data;
    console.log(`📝 Code submitted by ${username}`);

    const room = activeRooms.get(roomId);
    if (!room) {
      socket.emit('test_results', { results: [{ passed: false, input: 'N/A', expected: 'N/A', actual: 'Room not found' }] });
      return;
    }

    const problem = PROBLEMS[room.problemId || 'twoSum'];
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Initialize highestPassed tracker if not exists
    if (player.highestPassed === undefined) {
      player.highestPassed = 0;
    }

    // Check for cheat code (demo fallback)
    if (code.includes('// FORCE_WIN')) {
      const fakeResults = problem.testCases.map((t, i) => ({
        testIndex: i,
        input: `${problem.functionName}(${t.input.join(', ')})`,
        expected: JSON.stringify(t.expected),
        actual: JSON.stringify(t.expected),
        passed: true
      }));

      socket.emit('test_results', { results: fakeResults });
      player.testsPassed = problem.testCases.length;
      player.highestPassed = problem.testCases.length;
      player.finished = true;

      const opponentId = room.players.find(p => p.id !== socket.id)?.id;
      if (opponentId) {
        io.to(opponentId).emit('opponent_progress', { testsPassed: player.testsPassed });
      }

      io.to(roomId).emit('game_over', { winner: player.username });
      console.log(`🏆 ${player.username} WINS (cheat code)!`);
      return;
    }

    // Execute code
    try {
      const results = await executeCode(code, problem.testCases, problem.functionName);
      const passed = results.filter(r => r.passed).length;

      // Send results back to the player
      socket.emit('test_results', { results });

      // Update current tests passed
      player.testsPassed = passed;

      // Only award powerups for BEATING your previous best
      if (passed > player.highestPassed && !player.finished) {
        const newTestsBeyondRecord = passed - player.highestPassed;
        const powerupsToAward = Math.max(1, Math.floor(newTestsBeyondRecord / 2));

        for (let i = 0; i < powerupsToAward; i++) {
          const newPowerup = getRandomPowerup();
          player.powerups.push(newPowerup);
          socket.emit('powerup_earned', { powerup: newPowerup, totalPassed: passed });
          console.log(`🎁 ${username} earned powerup: ${newPowerup} (new record: ${passed}/${problem.testCases.length})`);
        }

        // Update the high water mark
        player.highestPassed = passed;
      }

      // Notify opponent of progress
      const opponentId = room.players.find(p => p.id !== socket.id)?.id;
      if (opponentId) {
        io.to(opponentId).emit('opponent_progress', { testsPassed: passed });
      }

      // Check win condition
      if (passed === problem.testCases.length && !player.finished) {
        player.finished = true;
        io.to(roomId).emit('game_over', { winner: player.username });
        console.log(`🏆 ${player.username} WINS!`);
      }
    } catch (err) {
      console.error('Execution error:', err.message);
      socket.emit('test_results', {
        results: [{ passed: false, input: 'N/A', expected: 'N/A', actual: 'Server execution error' }]
      });
    }
  });

  // Player uses a power-up
  socket.on('use_powerup', (data) => {
    const { roomId, powerupType } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check if player actually has this powerup
    const powerupIndex = player.powerups.indexOf(powerupType);
    if (powerupIndex === -1) {
      socket.emit('powerup_error', { message: 'You don\'t have that powerup!' });
      return;
    }

    // Remove the used powerup
    player.powerups.splice(powerupIndex, 1);

    // Find opponent and send sabotage
    const opponent = room.players.find(p => p.id !== socket.id);
    if (opponent) {
      io.to(opponent.id).emit('sabotage_receive', {
        type: powerupType,
        from: player.username
      });
      console.log(`💥 ${player.username} used ${powerupType} on ${opponent.username}`);
    }

    // Tell the player their updated powerup inventory
    socket.emit('powerups_updated', { powerups: player.powerups });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);

    const queueIndex = waitingQueue.findIndex(p => p.id === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
    }

    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        const opponent = room.players.find(p => p.id !== socket.id);
        if (opponent) {
          io.to(opponent.id).emit('game_over', {
            winner: opponent.username,
            reason: 'opponent_disconnected'
          });
        }
        activeRooms.delete(roomId);
      }
      playerRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 CodeKart server running on http://localhost:${PORT}`);
});