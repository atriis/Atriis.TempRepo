const dotenv = require('dotenv');
dotenv.config();

/**
 * Reads a required environment variable.
 * If it does not exist, the test suite stops immediately
 * with a clear error message.
 */
function getEnv(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Helper to define a single test user.
 * This avoids repeating the same structure everywhere.
 */
function createUser(emailEnvVar) {
  return {
    email: getEnv(emailEnvVar),
    password: getEnv('GENERAL_PASSWORD'),
  };
}

/**
 * Central test configuration.
 * This file defines:
 * - application URL
 * - test users per supplier
 *
 * No test should ever read process.env directly.
 */
const config = {
  baseUrl: getEnv('AUTOMATION_APP_BASEURL'),

  users: {
    amadeus: {
      user_one: createUser('AMADEUS_USER_ONE_EMAIL'),
      user_two: createUser('AMADEUS_USER_TWO_EMAIL'),
    },

    sabre: {
      user_one: createUser('SABRE_USER_ONE_EMAIL'),
    },

    galileo: {
      user_one: createUser('GALILEO_USER_ONE_EMAIL'),
    },

    ratehawk: {
      user_one: createUser('RATEHAWK_USER_ONE_EMAIL'),
    },

    expedia: {
      user_one: createUser('EXPEDIA_USER_ONE_EMAIL'),
    },

    bookingcom: {
      user_one: createUser('BOOKINGCOM_USER_ONE_EMAIL'),
    },

    ehotel: {
      user_one: createUser('EHOTEL_USER_ONE_EMAIL'),
    },

    travelodge: {
      user_one: createUser('TRAVELODGE_USER_ONE_EMAIL'),
    },

    premierinn: {
      user_one: createUser('PREMIER_INN_USER_ONE_EMAIL'),
    },

    afkl: {
      user_one: createUser('AFKL_USER_ONE_EMAIL'),
    },

    lufthansa: {
      user_one: createUser('LUFTHANSA_USER_ONE_EMAIL'),
    },

    british: {
      user_one: createUser('BRITISH_AIRWAYS_USER_ONE_EMAIL'),
    },

    united: {
      user_one: createUser('UNITED_USER_ONE_EMAIL'),
    },

    american: {
      user_one: createUser('AMERICAN_AIRLINES_USER_ONE_EMAIL'),
    },

    iberia: {
      user_one: createUser('IBERIA_USER_ONE_EMAIL'),
    },

    sunny: {
      user_one: createUser('SUNNY_CARS_USER_ONE_EMAIL'),
    },

    fusion: {
      user_one: createUser('FUSION_USER_ONE_EMAIL'),
    },

    ypsilon: {
      user_one: createUser('YPSILON_USER_ONE_EMAIL'),
    },

    amadeuslightticketing: {
      user_one: createUser('AMADEUS_LIGHT_TICKETING_USER_ONE_EMAIL'),
    },

    galileoach: {
      user_one: createUser('GALILEO_ACH_USER_ONE_EMAIL'),
    },

    benerail: {
      user_one: createUser('BENERAIL_USER_ONE_EMAIL'),
    },

    evolvi: {
      user_one: createUser('EVOLVI_USER_ONE_EMAIL'),
    },

    amtrak: {
      user_one: createUser('AMTRAK_USER_ONE_EMAIL'),
    },

    groundscope: {
      user_one: createUser('GROUNDSCOPE_USER_ONE_EMAIL'),
    },

    transferz: {
      user_one: createUser('TRANSFERZ_USER_ONE_EMAIL'),
    },

    ukparking: {
      user_one: createUser('UK_PARKING_USER_ONE_EMAIL'),
    },
  },
};

module.exports = config;