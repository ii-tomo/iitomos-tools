
function calculateCredits(duration) {
  // 15 mins = 900 seconds
  return Math.max(1, Math.ceil(duration / 900));
}

const tests = [
  { duration: 1, expected: 1 },
  { duration: 899, expected: 1 },
  { duration: 900, expected: 1 },
  { duration: 901, expected: 2 },
  { duration: 1799, expected: 2 },
  { duration: 1800, expected: 2 },
  { duration: 1801, expected: 3 },
  { duration: 3600, expected: 4 }, // 1 hour
  { duration: 7200, expected: 8 }, // 2 hours
];

tests.forEach(t => {
  const result = calculateCredits(t.duration);
  console.log(`Duration: ${t.duration}s (${(t.duration/60).toFixed(1)}m) -> Expected: ${t.expected}, Result: ${result} ${result === t.expected ? '✅' : '❌'}`);
});
