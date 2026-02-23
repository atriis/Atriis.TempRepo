const { faker } = require('@faker-js/faker');

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
function generateRandomGuestData() {
  // Generate random names using Faker
  const randomFirstName = faker.person.firstName();
  const randomLastName = faker.person.lastName();

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
  const email = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}${faker.number.int({ min: 100, max: 999 })}${emailDomain}`;

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
