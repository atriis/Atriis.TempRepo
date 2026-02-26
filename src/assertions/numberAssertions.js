const { expect } = require('@playwright/test');
const { toNumber } = require('../utils/numbers.js');

/**
 * Asserts that two values represent the same number
 */
function expectNumbersToBeEqual(actual, expected, label = 'Number') {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);

  expect(
    a,
    `${label} should be equal to ${e}, but got ${a}`
  ).toBe(e);
}

/**
 * Asserts that actual and expected are within tolerance
 */
function expectNumbersToBeEqualWithTolerance(
  actual,
  expected,
  tolerance = 0.02,
  label = 'Number'
) {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);
  const tol = toNumber(tolerance, `${label} (tolerance)`);

  if (tol < 0) {
    throw new Error(`${label} tolerance must be >= 0, got: ${tol}`);
  }

  const delta = Math.abs(a - e);

  expect(
    delta,
    `${label}: expected ${a} to be within ${tol} of ${e}`
  ).toBeLessThanOrEqual(tol);
}

/**
 * Asserts that actual > expected
 */
function expectNumberToBeGreaterThan(actual, expected, label = 'Number') {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);

  expect(
    a,
    `${label} should be greater than ${e}, but got ${a}`
  ).toBeGreaterThan(e);
}

/**
 * Asserts that actual >= expected
 */
function expectNumberToBeGreaterThanOrEqual(actual, expected, label = 'Number') {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);

  expect(
    a,
    `${label} should be greater than or equal to ${e}, but got ${a}`
  ).toBeGreaterThanOrEqual(e);
}

/**
 * Asserts that actual < expected
 */
function expectNumberToBeLessThan(actual, expected, label = 'Number') {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);

  expect(
    a,
    `${label} should be less than ${e}, but got ${a}`
  ).toBeLessThan(e);
}

/**
 * Asserts that actual <= expected
 */
function expectNumberToBeLessThanOrEqual(actual, expected, label = 'Number') {
  const a = toNumber(actual, `${label} (actual)`);
  const e = toNumber(expected, `${label} (expected)`);

  expect(
    a,
    `${label} should be less than or equal to ${e}, but got ${a}`
  ).toBeLessThanOrEqual(e);
}

/**
 * Asserts that (a + b) === expectedSum
 */
function expectSumToBeEqual(
  valueA,
  valueB,
  expectedSum,
  label = 'Sum'
) {
  const a = toNumber(valueA, `${label} (value A)`);
  const b = toNumber(valueB, `${label} (value B)`);
  const expected = toNumber(expectedSum, `${label} (expected)`);

  const actualSum = a + b;

  expect(
    actualSum,
    `${label}: expected ${a} + ${b} to equal ${expected}, but got ${actualSum}`
  ).toBe(expected);
}

/**
 * Asserts that (a + b) is within tolerance of expectedSum
 */
function expectSumToBeEqualWithTolerance(
  valueA,
  valueB,
  expectedSum,
  tolerance = 0.02,
  label = 'Sum'
) {
  const a = toNumber(valueA, `${label} (value A)`);
  const b = toNumber(valueB, `${label} (value B)`);
  const expected = toNumber(expectedSum, `${label} (expected)`);
  const tol = toNumber(tolerance, `${label} (tolerance)`);

  if (tol < 0) {
    throw new Error(`${label} tolerance must be >= 0, got: ${tol}`);
  }

  const actualSum = a + b;
  const delta = Math.abs(actualSum - expected);

  expect(
    delta,
    `${label}: expected ${a} + ${b} to be within ${tol} of ${expected}, but got ${actualSum}`
  ).toBeLessThanOrEqual(tol);
}

module.exports = {
  expectNumbersToBeEqual,
  expectNumbersToBeEqualWithTolerance,
  expectNumberToBeGreaterThan,
  expectNumberToBeGreaterThanOrEqual,
  expectNumberToBeLessThan,
  expectNumberToBeLessThanOrEqual,
  expectSumToBeEqual,
  expectSumToBeEqualWithTolerance,
};
