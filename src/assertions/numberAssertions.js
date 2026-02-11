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

module.exports = {
  expectNumbersToBeEqual,
  expectNumberToBeGreaterThan,
  expectNumberToBeGreaterThanOrEqual,
  expectNumberToBeLessThan,
  expectNumberToBeLessThanOrEqual,
  expectSumToBeEqual,
};
