import { useState } from 'react';
import { motion } from 'framer-motion';

function TestCases({ examples, functionName, onTestCasesChange }) {
  const [testCases, setTestCases] = useState(
    examples.map((ex) => {
      const match = ex.input.match(/\((.+)\)/);
      const originalArgs = match ? match[1] : '';
      return {
        id: Date.now() + Math.random(),
        args: originalArgs,
        originalArgs,
        expectedOutput: ex.output,
        isModified: false
      };
    })
  );

  const updateTestCase = (id, newArgs) => {
    const updated = testCases.map(tc => {
      if (tc.id !== id) return tc;
      const isModified = newArgs !== tc.originalArgs;
      return {
        ...tc,
        args: newArgs,
        isModified,
        // Clear expected if user changed the input
        expectedOutput: isModified ? null : tc.expectedOutput
      };
    });
    setTestCases(updated);
    onTestCasesChange(updated);
  };

  const addTestCase = () => {
    if (testCases.length >= 10) return;
    const newCase = {
      id: Date.now() + Math.random(),
      args: '',
      originalArgs: '',
      expectedOutput: null,
      isModified: true
    };
    const updated = [...testCases, newCase];
    setTestCases(updated);
    onTestCasesChange(updated);
  };

  const removeTestCase = (id) => {
    if (testCases.length <= 1) return;
    const updated = testCases.filter(tc => tc.id !== id);
    setTestCases(updated);
    onTestCasesChange(updated);
  };

  const resetToExamples = () => {
    const reset = examples.map((ex) => {
      const match = ex.input.match(/\((.+)\)/);
      const originalArgs = match ? match[1] : '';
      return {
        id: Date.now() + Math.random(),
        args: originalArgs,
        originalArgs,
        expectedOutput: ex.output,
        isModified: false
      };
    });
    setTestCases(reset);
    onTestCasesChange(reset);
  };

  const hasModifications = testCases.some(tc => tc.isModified) || testCases.length !== examples.length;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400">TEST CASES</h3>
        <div className="flex gap-2">
          {hasModifications && (
            <button
              onClick={resetToExamples}
              className="text-xs px-2 py-1 bg-gray-700 text-yellow-400 rounded-lg
                         hover:bg-gray-600 cursor-pointer transition-colors"
            >
              ↺ Reset
            </button>
          )}
          <button
            onClick={addTestCase}
            disabled={testCases.length >= 10}
            className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded-lg
                       hover:bg-gray-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {testCases.map((tc, i) => (
        <motion.div
          key={tc.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gray-800 rounded-lg p-3 mb-2 border ${
            tc.isModified ? 'border-yellow-700' : 'border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-bold">Case {i + 1}</span>
              {tc.isModified && (
                <span className="text-yellow-500 text-[10px]">• custom</span>
              )}
            </div>
            {testCases.length > 1 && (
              <button
                onClick={() => removeTestCase(tc.id)}
                className="text-gray-600 hover:text-red-400 text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 font-mono text-sm">
            <span className="text-gray-500 flex-shrink-0">{functionName}(</span>
            <input
              type="text"
              value={tc.args}
              onChange={(e) => updateTestCase(tc.id, e.target.value)}
              className="flex-1 bg-gray-900 text-green-400 px-2 py-1 rounded border border-gray-600
                         outline-none focus:border-yellow-400 transition-colors text-sm font-mono
                         min-w-0"
              placeholder="args..."
            />
            <span className="text-gray-500 flex-shrink-0">)</span>
          </div>
          {tc.expectedOutput && !tc.isModified && (
            <p className="text-gray-500 text-xs mt-1 font-mono">
              Expected: <span className="text-yellow-400">{tc.expectedOutput}</span>
            </p>
          )}
          {tc.isModified && (
            <p className="text-gray-600 text-xs mt-1 font-mono italic">
              Run to see output
            </p>
          )}
        </motion.div>
      ))}

      <p className="text-gray-600 text-xs mt-2">
        {testCases.length}/10 cases • Edit inputs or add your own
      </p>
    </div>
  );
}

export default TestCases;