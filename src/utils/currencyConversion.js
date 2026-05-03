const SUPPORTED_CURRENCY_CODES = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
};

const SUPPORTED_CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const FIXED_EXCHANGE_RATES = Object.freeze({
  USD: Object.freeze({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
  }),
  EUR: Object.freeze({
    USD: 1.09,
    EUR: 1,
    GBP: 0.86,
  }),
  GBP: Object.freeze({
    USD: 1.27,
    EUR: 1.16,
    GBP: 1,
  }),
});

function extractCurrencyCodesFromCacheKey(cacheKey) {
  if (typeof cacheKey !== 'string') {
    return undefined;
  }

  const matches = cacheKey.toUpperCase().match(/[A-Z]{3}/g);
  if (!matches || matches.length < 2) {
    return undefined;
  }

  const [fromCurrencyCode, toCurrencyCode] = matches;
  if (!FIXED_EXCHANGE_RATES[fromCurrencyCode] || typeof FIXED_EXCHANGE_RATES[fromCurrencyCode][toCurrencyCode] !== 'number') {
    return undefined;
  }

  return [fromCurrencyCode, toCurrencyCode];
}

class DeterministicExchangeRateCache extends Map {
  constructor() {
    super();

    for (const [fromCurrencyCode, ratesByTargetCurrency] of Object.entries(FIXED_EXCHANGE_RATES)) {
      for (const [toCurrencyCode, exchangeRate] of Object.entries(ratesByTargetCurrency)) {
        super.set(`${fromCurrencyCode}-${toCurrencyCode}`, exchangeRate);
      }
    }
  }

  has(cacheKey) {
    return super.has(cacheKey) || extractCurrencyCodesFromCacheKey(cacheKey) !== undefined;
  }

  get(cacheKey) {
    if (super.has(cacheKey)) {
      return super.get(cacheKey);
    }

    const currencyCodes = extractCurrencyCodesFromCacheKey(cacheKey);
    if (!currencyCodes) {
      return undefined;
    }

    const [fromCurrencyCode, toCurrencyCode] = currencyCodes;
    return FIXED_EXCHANGE_RATES[fromCurrencyCode][toCurrencyCode];
  }
}

const exchangeRateCache = new DeterministicExchangeRateCache();
const FRANKFURTER_LATEST_URL = '';
const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 0;

function extractCurrencySymbol(amountText, label) {
  if (!amountText || typeof amountText !== 'string') {
    throw new Error(`${label} amountText must be a non-empty string`);
  }

  const match = amountText.match(/[$€£]/);
  if (!match) {
    throw new Error(`Could not extract currency symbol from ${label}: "${amountText}"`);
  }

  return match[0];
}

function getCurrencyCodeFromSymbol(currencySymbol) {
  if (!currencySymbol || typeof currencySymbol !== 'string') {
    throw new Error('currencySymbol must be a non-empty string');
  }

  const currencyCode = SUPPORTED_CURRENCY_CODES[currencySymbol];
  if (!currencyCode) {
    throw new Error(`Unsupported currency symbol: ${currencySymbol}`);
  }

  return currencyCode;
}

function normalizeCurrencyCode(currencyCode, label = 'currencyCode') {
  if (!currencyCode || typeof currencyCode !== 'string') {
    throw new Error(`${label} must be a non-empty string`);
  }

  const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
  if (!SUPPORTED_CURRENCY_SYMBOLS[normalizedCurrencyCode]) {
    throw new Error(`Unsupported ${label}: ${currencyCode}`);
  }

  return normalizedCurrencyCode;
}

function getCurrencySymbolFromCode(currencyCode) {
  return SUPPORTED_CURRENCY_SYMBOLS[normalizeCurrencyCode(currencyCode)];
}

function getCurrencyConversionTolerance(expectedConvertedAmount) {
  if (typeof expectedConvertedAmount !== 'number' || Number.isNaN(expectedConvertedAmount)) {
    throw new Error(`expectedConvertedAmount must be a valid number, got: ${expectedConvertedAmount}`);
  }

  return Math.max(0.5, Number((expectedConvertedAmount * 0.03).toFixed(2)));
}

async function getExchangeRate(fromCurrencyCode, toCurrencyCode) {
  if (!fromCurrencyCode || typeof fromCurrencyCode !== 'string') {
    throw new Error('fromCurrencyCode must be a non-empty string');
  }

  if (!toCurrencyCode || typeof toCurrencyCode !== 'string') {
    throw new Error('toCurrencyCode must be a non-empty string');
  }

  if (fromCurrencyCode === toCurrencyCode) {
    return 1;
  }

  const cacheKey = `${fromCurrencyCode}->${toCurrencyCode}`;
  if (exchangeRateCache.has(cacheKey)) {
    return await exchangeRateCache.get(cacheKey);
  }

  const ratePromise = (async () => {
    if (typeof globalThis.fetch !== 'function') {
      throw new Error('global fetch is not available in this Node runtime');
    }

    const url = new URL(FRANKFURTER_LATEST_URL);
    url.searchParams.set('from', fromCurrencyCode);
    url.searchParams.set('to', toCurrencyCode);

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await globalThis.fetch(url, {
          headers: { accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to retrieve exchange rate ${fromCurrencyCode}->${toCurrencyCode}: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();
        const exchangeRate = payload?.rates?.[toCurrencyCode];

        if (typeof exchangeRate !== 'number' || Number.isNaN(exchangeRate)) {
          throw new Error(`Exchange rate ${fromCurrencyCode}->${toCurrencyCode} was missing from response`);
        }

        return exchangeRate;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError;
  })();

  exchangeRateCache.set(cacheKey, ratePromise);

  try {
    return await ratePromise;
  } catch (error) {
    exchangeRateCache.delete(cacheKey);
    throw error;
  }
}

module.exports = {
  extractCurrencySymbol,
  getCurrencyCodeFromSymbol,
  getCurrencySymbolFromCode,
  getCurrencyConversionTolerance,
  getExchangeRate,
  normalizeCurrencyCode,
};