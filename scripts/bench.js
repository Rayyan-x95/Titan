import { performance } from 'perf_hooks';
import { parseQuickCapture } from '../src/lib/core/parserEngine.ts';
import { calculateTotalOwed } from '../src/lib/core/splitEngine.ts';

function benchParse(iterations = 10000) {
  const sample = 'Paid $12.50 to Starbucks on 2024-03-01 for coffee';
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    parseQuickCapture(sample, new Date('2024-03-02'));
  }
  const end = performance.now();
  console.log(`parseQuickCapture ${iterations} runs: ${(end - start).toFixed(2)}ms`);
}

function benchSplit(iterations = 10000) {
  const sample = Array.from({ length: 50 }, (_, i) => ({
    id: String(i),
    amount: 100 + i,
    participants: [{ id: 'user-1', amount: 100 + i }],
  }));
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    calculateTotalOwed(sample);
  }
  const end = performance.now();
  console.log(`calculateTotalOwed ${iterations} runs: ${(end - start).toFixed(2)}ms`);
}

const iters = parseInt(process.argv[2], 10) || 2000;
benchParse(iters);
benchSplit(iters);
