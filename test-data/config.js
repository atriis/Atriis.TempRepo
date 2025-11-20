// test-data/config.js
const dotenv = require('dotenv');

// Load variables from .env into process.env (local runs).
// In CI, env vars will come from the pipeline and this is harmless.
dotenv.config();

const config = {
  baseUrl: process.env.AUTOMATION_APP_BASEURL,

  users: {
    amadeusUserOne: {
      email: process.env.AMADEUS_USER_ONE_EMAIL,
      password: process.env.GENERAL_PASSWORD,
    },
    // later you can add more users here
  },
};

module.exports = config;
