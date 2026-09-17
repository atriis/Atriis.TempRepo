const {
  faker,
  fakerEN_GB, fakerEN_US, fakerEN_AU, fakerEN_CA,
  fakerFR, fakerDE, fakerES, fakerIT, fakerNL, fakerPL,
  fakerPT_BR, fakerSV, fakerDA, fakerNB_NO, fakerFI, fakerTR,
} = require('@faker-js/faker');

/**
 * generateRandomGuestData
 *
 * Generates realistic but fake guest data for test automation using Faker.
 *
 * Why this exists:
 * - Allows tests to add new travelers without hardcoding personal data
 * - Prevents collisions with real users
 * - Keeps tests repeatable and environment-safe
 * - Uses Faker for more realistic and diverse test data
 *
 * IMPORTANT:
 * - Data is intentionally random
 * - This function is meant ONLY for test environments
 * - It should never be used in production code
 */

// add-guest-form.ts derives the guest's gender from the title (handleTitleChange): Mr means Male,
// Ms/Mrs/Miss mean Female, and Dr/Prof are deliberately neutral -- picking one of those leaves the
// mandatory gender field empty and the form will not submit, so they are kept out of the pool.
const TITLES_BY_GENDER = Object.freeze({
  Male: ['Mr'],
  Female: ['Mrs', 'Ms', 'Miss'],
});

// Latin-script locales only, and only those whose person data actually splits first names by sex.
// A nationality outside this map (or none at all) falls back to faker's default English list.
const FAKER_BY_NATIONALITY = Object.freeze({
  US: fakerEN_US, GB: fakerEN_GB, UK: fakerEN_GB, AU: fakerEN_AU, CA: fakerEN_CA,
  FR: fakerFR, DE: fakerDE, ES: fakerES, IT: fakerIT, NL: fakerNL, PL: fakerPL,
  BR: fakerPT_BR, SE: fakerSV, DK: fakerDA, NO: fakerNB_NO, FI: fakerFI, TR: fakerTR,
});

// Letters that Unicode decomposition alone will not reduce to plain ASCII, because they are
// distinct letters rather than a base letter carrying an accent.
const NON_DECOMPOSABLE_LETTERS = Object.freeze({
  'ł': 'l', 'Ł': 'L', 'ø': 'o', 'Ø': 'O',
  'æ': 'ae', 'Æ': 'Ae', 'œ': 'oe', 'Œ': 'Oe',
  'ß': 'ss', 'đ': 'd', 'Đ': 'D', 'ð': 'd', 'Ð': 'D',
  'þ': 'th', 'Þ': 'Th', 'ı': 'i', 'İ': 'I',
});

/**
 * Reduces a name to the plain A-Z letters the add-guest form accepts. Its firstName/lastName
 * validators are /^[a-zA-Z\s]*$/ (add-guest-form.ts), so an accented national name is rejected
 * outright -- flattening it keeps the national flavour of the name while still submitting.
 * @param {string} value
 * @returns {string} The same name written in unaccented ASCII letters
 */
function toPlainLatinLetters(value) {
  return value
    .replace(/[^\u0000-\u007F]/g, (char) => NON_DECOMPOSABLE_LETTERS[char] ?? char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Draws a name from a Faker word list until one survives the form's validation rule. Hyphens and
 * apostrophes are rejected by the app, so those are redrawn rather than rewritten -- unlike
 * accents, stripping them would produce a name nobody is actually called.
 * @param {string[]} pool - Candidate names from one locale's person definitions
 * @param {string} label - Field name, used only to make a failure readable
 * @returns {string}
 */
function drawAcceptableName(pool, label) {
  if (!Array.isArray(pool) || pool.length === 0) {
    throw new Error(`[generateRandomGuestData] No ${label} candidates available for this locale`);
  }

  // Bounded rather than open-ended: an unbounded do/while would hang the whole test run if a
  // locale's list turned out to be entirely names the app rejects.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = toPlainLatinLetters(faker.helpers.arrayElement(pool)).trim();
    if (/^[A-Za-z][A-Za-z ]*$/.test(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `[generateRandomGuestData] Could not draw a ${label} free of hyphens and apostrophes after 50 ` +
    `attempts. The locale's name list may be entirely made up of names the app rejects.`
  );
}

/**
 * Reads one locale's first/last name lists for a given sex.
 *
 * Reads faker.definitions directly instead of calling person.firstName(sex), because that helper
 * blends in the locale's large unisex "generic" list: sampling 500 English "female" names returned
 * 27 outright men's names and 154 more from the mixed list. The per-sex definition lists are clean.
 * @param {object} localeFaker - A locale-bound Faker instance
 * @param {'female'|'male'} sex
 * @returns {{ firstNames: string[], lastNames: string[] }}
 */
function getNamePools(localeFaker, sex) {
  const { first_name: firstNameDef, last_name: lastNameDef } = localeFaker.definitions.person;

  const firstNames = firstNameDef[sex] ?? firstNameDef.generic ?? firstNameDef;
  // A few locales gender their surnames too; most expose a single generic list.
  const lastNames = Array.isArray(lastNameDef)
    ? lastNameDef
    : lastNameDef[sex] ?? lastNameDef.generic;

  return { firstNames, lastNames };
}

// Built once at load from every supported locale, so a caller-supplied name can be matched against
// the same word lists the generator draws from. ~6.4k names, cheap enough to hold in memory.
const FIRST_NAMES_BY_SEX = (() => {
  const female = new Set();
  const male = new Set();

  for (const localeFaker of [faker, ...Object.values(FAKER_BY_NATIONALITY)]) {
    const definition = localeFaker.definitions.person.first_name;
    for (const name of definition.female ?? []) female.add(toPlainLatinLetters(name).toLowerCase());
    for (const name of definition.male ?? []) male.add(toPlainLatinLetters(name).toLowerCase());
  }

  return { female, male };
})();

/**
 * Works out which title suits a name the caller supplied, for the guest forms where the name comes
 * from a feature file rather than from this generator.
 *
 * Deliberately deterministic, unlike generateRandomGuestData: a scenario that names its traveller
 * should get the same title on every run. A name found on both lists ("Robin", "Jordan") or on
 * neither is left at Mr, which is the title those guests have always been given -- so this can
 * correct a wrong title but never destabilise a test that was already right.
 *
 * @param {string} firstName - The guest's first name as the scenario spells it
 * @returns {'Mr'|'Ms'} 'Ms' for a recognised woman's name, 'Mr' otherwise
 */
function resolveTitleForName(firstName) {
  if (!firstName || typeof firstName !== 'string') {
    return 'Mr';
  }

  const normalised = toPlainLatinLetters(firstName).trim().toLowerCase();
  const isFemale = FIRST_NAMES_BY_SEX.female.has(normalised);
  const isMale = FIRST_NAMES_BY_SEX.male.has(normalised);

  return isFemale && !isMale ? 'Ms' : 'Mr';
}

/**
 * Generates a guest whose title, gender and first name all agree.
 *
 * Both arguments are optional, so existing callers keep working unchanged: with neither, the title
 * is drawn at random from Mr/Mrs/Ms/Miss and the name is picked to match it.
 *
 * @param {'Male'|'Female'|null} [gender=null] - Pins the guest's gender; the title is then drawn
 *   only from that gender's titles. Case-insensitive.
 * @param {string|null} [nationality=null] - ISO country code, e.g. 'FR', 'DE', 'ES'. Takes the
 *   first AND last name from that country's list so the two belong together. Unknown or omitted
 *   falls back to the default English list.
 * @returns {{ firstName: string, lastName: string, gender: string, title: string,
 *   nationality: string|null, dateOfBirth: string, email: string, phone: string }}
 */
function generateRandomGuestData(gender = null, nationality = null) {
  if (gender !== null && typeof gender !== 'string') {
    throw new Error(`gender, when provided, must be a string, got: ${typeof gender}`);
  }
  if (nationality !== null && typeof nationality !== 'string') {
    throw new Error(`nationality, when provided, must be a string, got: ${typeof nationality}`);
  }

  const requestedGender = gender ? gender.trim().toLowerCase() : null;
  if (requestedGender && requestedGender !== 'male' && requestedGender !== 'female') {
    throw new Error(`gender must be 'Male' or 'Female', got: "${gender}"`);
  }

  // With no gender pinned, draw across all four titles evenly and let the title decide the gender --
  // the same direction the form itself works in, so Mrs/Ms/Miss all get exercised.
  const titlePool = requestedGender === 'male'
    ? TITLES_BY_GENDER.Male
    : requestedGender === 'female'
      ? TITLES_BY_GENDER.Female
      : [...TITLES_BY_GENDER.Male, ...TITLES_BY_GENDER.Female];
  const title = faker.helpers.arrayElement(titlePool);
  const resolvedGender = TITLES_BY_GENDER.Male.includes(title) ? 'Male' : 'Female';
  const sex = resolvedGender === 'Male' ? 'male' : 'female';

  const localeKey = nationality ? nationality.trim().toUpperCase() : null;
  const resolvedNationality = localeKey && FAKER_BY_NATIONALITY[localeKey] ? localeKey : null;
  const localeFaker = resolvedNationality ? FAKER_BY_NATIONALITY[resolvedNationality] : faker;

  const { firstNames, lastNames } = getNamePools(localeFaker, sex);
  const randomFirstName = drawAcceptableName(firstNames, 'first name');
  const randomLastName = drawAcceptableName(lastNames, 'last name');

  /**
   * Date of birth generation
   *
   * Logic:
   * - Guest age will be between 25 and 60 years old
   * - Uses Faker's birthdate method for realistic dates
   */
  const birthDate = faker.date.birthdate({ min: 25, max: 60, mode: 'age' });
  const day = birthDate.getDate().toString().padStart(2, '0');
  const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
  const year = birthDate.getFullYear();
  const dateOfBirth = `${day}/${month}/${year}`;

  /**
   * Email generation
   *
   * Uses a test-only domain to avoid:
   * - sending real emails
   * - colliding with real users
   */
  const emailDomain = "@atriistestautomation.com";
  // Spanish surnames in particular arrive as two words, which the name field accepts but an
  // address does not.
  const emailLocalPart = `${randomFirstName}.${randomLastName}`.toLowerCase().replace(/\s+/g, '');
  const email = `${emailLocalPart}${faker.number.int({ min: 100, max: 999 })}${emailDomain}`;

  /**
   * Phone number generation
   *
   * Format: XXX-XXX-XXXX (standard US phone format)
   * - Area code: 200-999 (3 digits)
   * - Exchange code: 200-999 (3 digits)
   * - Line number: 0000-9999 (4 digits)
   */
  const areaCode = faker.number.int({ min: 200, max: 999 });
  const exchangeCode = faker.number.int({ min: 200, max: 999 });
  const lineNumber = faker.number.int({ min: 1000, max: 9999 });
  const phone = `${areaCode}-${exchangeCode}-${lineNumber}`;

  // Returned object shape is stable and used by Search DSL. title/gender/nationality are additive --
  // callers that ignore them keep the behaviour they had.
  return {
    firstName: randomFirstName,
    lastName: randomLastName,
    gender: resolvedGender,
    title,
    nationality: resolvedNationality,
    dateOfBirth,
    email,
    phone,
  };
}

module.exports = { generateRandomGuestData, resolveTitleForName };
