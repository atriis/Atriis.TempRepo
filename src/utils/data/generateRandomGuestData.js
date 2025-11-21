function generateRandomGuestData() {
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'
  ];

  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  const today = new Date();
  const birthYear = today.getFullYear() - Math.floor(Math.random() * 35) - 25;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;

  const dateOfBirth = `${birthDay.toString().padStart(2, '0')}/${birthMonth
    .toString()
    .padStart(2, '0')}/${birthYear}`;

  const emailDomain = '@atriistestautomation.com';
  const email = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}${Math.floor(
    Math.random() * 1000
  )}${emailDomain}`;

  const phone = `+44${Math.floor(Math.random() * 900000000 + 100000000)}`;

  return {
    firstName: randomFirstName,
    lastName: randomLastName,
    dateOfBirth,
    email,
    phone,
  };
}

module.exports = { generateRandomGuestData };
