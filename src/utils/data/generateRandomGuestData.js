/**
 * generateRandomGuestData
 *
 * Generates realistic but fake guest data for test automation.
 *
 * Why this exists:
 * - Allows tests to add new travelers without hardcoding personal data
 * - Prevents collisions with real users
 * - Keeps tests repeatable and environment-safe
 *
 * IMPORTANT:
 * - Data is intentionally random
 * - This function is meant ONLY for test environments
 * - It should never be used in production code
 */
function generateRandomGuestData() {
  // Common first and last names to keep data realistic
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'
  ];

  // Randomly select a name combination
  const randomFirstName =
    firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName =
    lastNames[Math.floor(Math.random() * lastNames.length)];

  /**
   * Date of birth generation
   *
   * Logic:
   * - Guest age will be roughly between 25 and 60 years old
   * - Day is limited to 28 to avoid invalid dates (Feb 30, etc.)
   */
  const today = new Date();
  const birthYear =
    today.getFullYear() - Math.floor(Math.random() * 35) - 25;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;

  const dateOfBirth = `${birthDay.toString().padStart(2, '0')}/${birthMonth
    .toString()
    .padStart(2, '0')}/${birthYear}`;

  /**
   * Email generation
   *
   * Uses a test-only domain to avoid:
   * - sending real emails
   * - colliding with real users
   */
  const emailDomain = '@atriistestautomation.com';
  const email = `${randomFirstName.toLowerCase()}.${randomLastName
    .toLowerCase()}${Math.floor(Math.random() * 1000)}${emailDomain}`;

  /**
   * Phone number generation
   *
   * - Uses UK country code (+44)
   * - Generates a 9-digit number to look realistic
   */
  const phone = `+44${Math.floor(Math.random() * 900000000 + 100000000)}`;

  // Returned object shape is stable and used by Search DSL
  return {
    firstName: randomFirstName,
    lastName: randomLastName,
    dateOfBirth,
    email,
    phone,
  };
}

module.exports = { generateRandomGuestData };