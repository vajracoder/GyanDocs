/**
 * Helper to derive question priority based on the number of years it appeared.
 * Rules:
 * 5+ years -> 5
 * 4 years  -> 5
 * 3 years  -> 4
 * 2 years  -> 3
 * 1 year   -> 2
 * 0 years  -> 1
 *
 * @param {Array<number>} years Array of years
 * @returns {number} Priority number from 1 to 5
 */
const calculatePriority = (years) => {
  const count = Array.isArray(years) ? years.length : 0;
  if (count >= 4) return 5;
  if (count === 3) return 4;
  if (count === 2) return 3;
  if (count === 1) return 2;
  return 1;
};

module.exports = {
  calculatePriority,
};
