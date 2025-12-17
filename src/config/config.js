const dotenv = require('dotenv');

dotenv.config();

function getEnv(name) {
  const val = process.env[name];
  if (!val || String(val).trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

const config = {
  baseUrl: getEnv('AUTOMATION_APP_BASEURL'),

  users: {
    amadeus: {
      user_one: {
        email: getEnv('AMADEUS_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
      user_two: {
        email: getEnv('AMADEUS_USER_TWO_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    sabre: {
      user_one: {
        email: getEnv('SABRE_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    galileo: {
      user_one: {
        email: getEnv('GALILEO_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    ratehawk: {
      user_one: {
        email: getEnv('RATEHAWK_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    expedia: {
      user_one: {
        email: getEnv('EXPEDIA_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    bookingcom: {
      user_one: {
        email: getEnv('BOOKINGCOM_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    ehotel: {
      user_one: {
        email: getEnv('EHOTEL_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    travelodge: {
      user_one: {
        email: getEnv('TRAVELODGE_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    premierinn: {
      user_one: {
        email: getEnv('PREMIER_INN_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    afkl: {
      user_one: {
        email: getEnv('AFKL_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    lufthansa: {
      user_one: {
        email: getEnv('LUFTHANSA_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    britishairways: {
      user_one: {
        email: getEnv('BRITISH_AIRWAYS_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    united: {
      user_one: {
        email: getEnv('UNITED_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    americanairlines: {
      user_one: {
        email: getEnv('AMERICAN_AIRLINES_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    iberia: {
      user_one: {
        email: getEnv('IBERIA_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    sunny: {
      user_one: {
        email: getEnv('SUNNY_CARS_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    fusion: {
      user_one: {
        email: getEnv('FUSION_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    ypsilon: {
      user_one: {
        email: getEnv('YPSILON_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    amadeuslightticketing: {
      user_one: {
        email: getEnv('AMADEUS_LIGHT_TICKETING_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    galileoach: {
      user_one: {
        email: getEnv('GALILEO_ACH_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    benerail: {
      user_one: {
        email: getEnv('BENERAIL_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    evolvi: {
      user_one: {
        email: getEnv('EVOLVI_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    amtrak: {
      user_one: {
        email: getEnv('AMTRAK_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    groundscope: {
      user_one: {
        email: getEnv('GROUNDSCOPE_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    transferz: {
      user_one: {
        email: getEnv('TRANSFERZ_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },

    ukparking: {
      user_one: {
        email: getEnv('UK_PARKING_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD'),
      },
    },
  },
};

module.exports = config;