'use strict';

/**
 * Transportation Domain Orchestration Configuration
 *
 * Single source of truth for:
 * - All transportation suppliers and metadata
 * - Transport types and test flows
 * - Per-supplier user mappings from .env
 * - Execution policies and shared business rules
 *
 * EXTENSIBILITY:
 * - Add supplier: append to SUPPLIERS
 * - Add user mapping: update SUPPLIER_USER_MAPPING
 * - Add flow: extend TRANSPORT_FLOWS
 * - Deactivate supplier: set TRANSPORT_SKIP_SUPPLIERS in .env
 */

// ── Supplier Definitions ────────────────────────────────────────────────────
const SUPPLIERS = [
  // ── GDS Car Rental ────────────────────
  {
    name: 'AMADEUS',
    category: 'cars',
    type: 'GDS',
    transportTypes: ['car_rental'],
    endpoint: 'https://atriis.staging.com/api/amadeus',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/cars',
    providerTag: 'amadeus',
    supportedFlows: [
      'CarSearch', 'CarAvailability', 'CarPricing', 'CarBooking',
      'CarCancellation', 'CarModification', 'AgreementValidation',
    ],
    knownLimitations: [
      'Cannot cancel real GDS cars - use test profiles only',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 60000,
  },
  {
    name: 'UAPIGALILEO',
    category: 'cars',
    type: 'GDS',
    transportTypes: ['car_rental'],
    endpoint: 'https://atriis.staging.com/api/galileo',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/cars',
    providerTag: 'galileo',
    supportedFlows: [
      'CarSearch', 'CarAvailability', 'CarPricing', 'CarBooking',
      'CarCancellation', 'CarModification', 'AgreementValidation',
    ],
    knownLimitations: [
      'Limited car class availability in test environment',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 60000,
  },
  {
    name: 'SABRE',
    category: 'cars',
    type: 'GDS',
    transportTypes: ['car_rental'],
    endpoint: 'https://atriis.staging.com/api/sabre',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/cars',
    providerTag: 'sabre',
    supportedFlows: [
      'CarSearch', 'CarAvailability', 'CarPricing', 'CarBooking',
      'CarCancellation', 'AgreementValidation',
    ],
    knownLimitations: [
      'Sabre API rate-limited to 100 req/min',
    ],
    retryPolicy: { maxRetries: 3, delayMs: 5000 },
    timeoutMs: 60000,
  },
  {
    name: 'SUNNYCARS',
    category: 'cars',
    type: 'Aggregator',
    transportTypes: ['car_rental'],
    endpoint: 'https://atriis.staging.com/api/sunnycars',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/cars',
    providerTag: 'sunnycars',
    supportedFlows: [
      'CarSearch', 'CarPricing', 'CarBooking',
      'ExpiryValidation', 'AgreementValidation',
    ],
    knownLimitations: [
      'Deposit behaviour varies by vendor',
      'Expiry tooltip 15 minutes after quote',
    ],
    retryPolicy: { maxRetries: 1, delayMs: 2000 },
    timeoutMs: 50000,
  },

  // ── Rail Suppliers ────────────────────
  {
    name: 'EVOLVI',
    category: 'rails',
    type: 'Rail',
    transportTypes: ['rail'],
    endpoint: 'https://atriis.staging.com/api/evolvi',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/rails/evolvi',
    providerTag: 'evolvi',
    supportedFlows: [
      'RailSearch', 'RailPricing', 'RailBooking',
      'RailCancellation', 'SplitTicket', 'DeliveryMethod',
    ],
    knownLimitations: [
      'Corporate user search restrictions apply',
      'CVV field behaviour depends on FOP config',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 60000,
  },
  {
    name: 'BENERAILMOOVE',
    category: 'rails',
    type: 'Rail',
    transportTypes: ['rail'],
    endpoint: 'https://atriis.staging.com/api/benerail',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/rails/benerail',
    providerTag: 'benerail',
    supportedFlows: [
      'RailSearch', 'RailPricing', 'RailBooking', 'RailCancellation',
      'AgreementValidation', 'JourneySelection', 'StationAutocomplete',
      'ExpiryValidation', 'LoyaltyCard', 'TimePicker',
    ],
    knownLimitations: [
      'Umlaut characters need special handling in station autocomplete',
      'Expiry counter behaviour affects booking window',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 65000,
  },
  {
    name: 'DEUTSCHEBAHN',
    category: 'rails',
    type: 'Rail',
    transportTypes: ['rail'],
    endpoint: 'https://atriis.staging.com/api/deutschebahn',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/rails/deutsche_bahn',
    providerTag: 'deutschebahn',
    supportedFlows: [
      'RailSearch', 'RailPricing', 'RailBooking',
      'FrequentPrograms', 'BahnCard',
    ],
    knownLimitations: [
      'All existing tests marked @wip — limited automation coverage',
      'BahnCard expiry date handling is fragile',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 4000 },
    timeoutMs: 65000,
  },
  {
    name: 'AMTRAK',
    category: 'rails',
    type: 'Rail',
    transportTypes: ['rail'],
    endpoint: 'https://atriis.staging.com/api/amtrak',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/rails/amtrak',
    providerTag: 'amtrak',
    supportedFlows: [
      'RailSearch', 'RailPricing', 'RailBooking',
      'TravelPolicyValidation', 'PassiveSegment',
    ],
    knownLimitations: [
      'All existing tests marked @wip — limited automation coverage',
      'Phone number is mandatory for passenger',
      'US routes only',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 4000 },
    timeoutMs: 65000,
  },

  // ── Ground Transport ──────────────────
  {
    name: 'TRANSFERZ',
    category: 'ground_transport',
    type: 'Transfer',
    transportTypes: ['airport_transfer', 'ground_transport'],
    endpoint: 'https://atriis.staging.com/api/transferz',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/ground_transport/transferz',
    providerTag: 'transferz',
    supportedFlows: [
      'TransferSearch', 'TransferPricing', 'TransferBooking',
      'LuggageValidation', 'BookingCodeValidation',
    ],
    knownLimitations: [
      'Booking code visibility required across trip and share flows',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 55000,
  },
  {
    name: 'GROUNDSCOPE',
    category: 'ground_transport',
    type: 'Transfer',
    transportTypes: ['ground_transport'],
    endpoint: 'https://atriis.staging.com/api/groundscope',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/ground_transport/groundscope',
    providerTag: 'groundscope',
    supportedFlows: [
      'TransferSearch', 'TransferPricing', 'TransferBooking',
      'ShareQuote', 'ExpiryValidation',
    ],
    knownLimitations: [
      'Expired quote triggers re-search flow',
      'Pickup time prepopulation depends on flight data',
    ],
    retryPolicy: { maxRetries: 2, delayMs: 3000 },
    timeoutMs: 55000,
  },

  // ── Parking ───────────────────────────
  {
    name: 'HOLIDAYEXTRASPARKING',
    category: 'parking',
    type: 'Parking',
    transportTypes: ['parking'],
    endpoint: 'https://atriis.staging.com/api/holidayextras',
    authMethod: 'email_password',
    featurePath: 'tests/features/transportation/parking',
    providerTag: 'parking',
    supportedFlows: [
      'ParkingSearch', 'ParkingPricing', 'ParkingBooking',
      'ParkingExtras', 'ParkingFilters',
    ],
    knownLimitations: [
      'UK airport parking only',
      'No @provider tag in features — uses @parking tag instead',
    ],
    retryPolicy: { maxRetries: 1, delayMs: 2000 },
    timeoutMs: 50000,
  },
];


// ── Transport Test Flows ────────────────────────────────────────────────────
const TRANSPORT_FLOWS = {
  // Cars
  CarSearch: {
    description: 'Car rental search (airport, city center, exact location)',
    tags: ['@transportation', '@cars', '@search'],
    categories: ['cars'],
  },
  CarAvailability: {
    description: 'Car availability and class filtering',
    tags: ['@transportation', '@cars', '@availability'],
    categories: ['cars'],
  },
  CarPricing: {
    description: 'Car pricing, day rates, and FOP validation',
    tags: ['@transportation', '@cars', '@pricing'],
    categories: ['cars'],
  },
  CarBooking: {
    description: 'Car booking, PNR creation, and progress confirmation',
    tags: ['@transportation', '@cars', '@booking'],
    categories: ['cars'],
  },
  CarCancellation: {
    description: 'Car booking cancellation',
    tags: ['@transportation', '@cars', '@cancellation'],
    categories: ['cars'],
  },
  CarModification: {
    description: 'Car booking modification',
    tags: ['@transportation', '@cars', '@modification'],
    categories: ['cars'],
  },
  AgreementValidation: {
    description: 'Agreement, tooltip, terms, and customer ID validation',
    tags: ['@transportation', '@cars', '@agreement'],
    categories: ['cars'],
  },
  ExpiryValidation: {
    description: 'Quote expiry tooltip and checkout blocking',
    tags: ['@transportation', '@expiry'],
    categories: ['cars', 'ground_transport', 'rails'],
  },

  // Rails
  RailSearch: {
    description: 'Rail search (one way, return, multi-leg)',
    tags: ['@transportation', '@rails', '@search'],
    categories: ['rails'],
  },
  RailPricing: {
    description: 'Rail pricing and fare rules',
    tags: ['@transportation', '@rails', '@pricing'],
    categories: ['rails'],
  },
  RailBooking: {
    description: 'Rail booking and ticket issuance',
    tags: ['@transportation', '@rails', '@booking'],
    categories: ['rails'],
  },
  RailCancellation: {
    description: 'Rail booking cancellation',
    tags: ['@transportation', '@rails', '@cancellation'],
    categories: ['rails'],
  },
  SplitTicket: {
    description: 'Split ticket handling and itinerary email',
    tags: ['@transportation', '@rails', '@split_ticket'],
    categories: ['rails'],
  },
  DeliveryMethod: {
    description: 'Ticket delivery method (TOD, e-ticket)',
    tags: ['@transportation', '@rails', '@delivery'],
    categories: ['rails'],
  },
  JourneySelection: {
    description: 'Journey selection elements and summary',
    tags: ['@transportation', '@rails', '@journey'],
    categories: ['rails'],
  },
  StationAutocomplete: {
    description: 'Station autocomplete and umlaut support',
    tags: ['@transportation', '@rails', '@autocomplete'],
    categories: ['rails'],
  },
  LoyaltyCard: {
    description: 'Loyalty card save and use existing',
    tags: ['@transportation', '@rails', '@loyalty'],
    categories: ['rails'],
  },
  TimePicker: {
    description: 'Time picker redesign and validation',
    tags: ['@transportation', '@rails', '@timepicker'],
    categories: ['rails'],
  },
  FrequentPrograms: {
    description: 'Frequent traveller programs (DB BahnCard)',
    tags: ['@transportation', '@rails', '@frequent'],
    categories: ['rails'],
  },
  BahnCard: {
    description: 'Deutsche Bahn BahnCard handling',
    tags: ['@transportation', '@rails', '@bahncard'],
    categories: ['rails'],
  },
  TravelPolicyValidation: {
    description: 'Travel policy display and enforcement in results',
    tags: ['@transportation', '@travel_policy'],
    categories: ['rails', 'cars'],
  },
  PassiveSegment: {
    description: 'Passive PNR segments in GetTrip',
    tags: ['@transportation', '@rails', '@api'],
    categories: ['rails'],
  },

  // Ground transport
  TransferSearch: {
    description: 'Airport/city transfer search',
    tags: ['@transportation', '@ground_transport', '@search'],
    categories: ['ground_transport'],
  },
  TransferPricing: {
    description: 'Transfer pricing and layout validation',
    tags: ['@transportation', '@ground_transport', '@pricing'],
    categories: ['ground_transport'],
  },
  TransferBooking: {
    description: 'Transfer booking and confirmation',
    tags: ['@transportation', '@ground_transport', '@booking'],
    categories: ['ground_transport'],
  },
  LuggageValidation: {
    description: 'Luggage number and add-ons validation',
    tags: ['@transportation', '@ground_transport', '@luggage'],
    categories: ['ground_transport'],
  },
  BookingCodeValidation: {
    description: 'Booking code visible across trip/share/itinerary',
    tags: ['@transportation', '@ground_transport', '@booking_code'],
    categories: ['ground_transport'],
  },
  ShareQuote: {
    description: 'Share quote and itinerary with images',
    tags: ['@transportation', '@ground_transport', '@share_quote'],
    categories: ['ground_transport'],
  },

  // Parking
  ParkingSearch: {
    description: 'UK airport parking search',
    tags: ['@transportation', '@parking', '@search'],
    categories: ['parking'],
  },
  ParkingPricing: {
    description: 'Parking pricing and extras display',
    tags: ['@transportation', '@parking', '@pricing'],
    categories: ['parking'],
  },
  ParkingBooking: {
    description: 'Parking booking and PNR in trip overview',
    tags: ['@transportation', '@parking', '@full_purchase'],
    categories: ['parking'],
  },
  ParkingExtras: {
    description: 'Parking extras display in cart',
    tags: ['@transportation', '@parking', '@extras'],
    categories: ['parking'],
  },
  ParkingFilters: {
    description: 'Parking filter and reset validation',
    tags: ['@transportation', '@parking', '@filters'],
    categories: ['parking'],
  },
};


// ── Per-Supplier User Mapping (from .env) ───────────────────────────────────
// Maps each supplier to the user labels used in its feature files.
// The first entry is the primary/default user.
// All labels must exist in .env as USER_<LABEL>=email@domain.com
const SUPPLIER_USER_MAPPING = {
  // Cars — GDS
  AMADEUS: ['ruimariano@amadeus.com', 'ruimendes@amadeus.com', 'brunasantosnl@testim.com'],
  UAPIGALILEO: ['gal@leo.com', 'vinicius@galileo.car', 'beatrizpamplonacorp@galileo.corp', 'renato@galileo.car', 'bsgalileoflight@galileo.com', 'rafael@galileo.car'],
  SABRE: ['robsoncruz@sabre.car', 'penelopecruz@sabre.car', 'brunajuliana@sabre.car', 'berry@sabre.car', 'victor@sabre.car', 'tree@tree.com'],
  SUNNYCARS: ['brunaalice@sunnycar.tlc', 'kaylesun@sunnycar.tlc'],

  // Rails
  EVOLVI: ['corp@evolvi.com', 'corp32@evolvi.com', 'thiagosantos@evolvi.com', 'vinijus@evolvi.com', 'eve@evolvi.com', 'we111@evolvi.com'],
  BENERAILMOOVE: ['beny@benerail.com', 'pini@benerail.com', 'shani@testimcorpnl.com', 'bruolisan@benerail.com', 'testim@benerail.com', 'beny@benerailnl.com', 'sncb@benerail.com', 'pmac@benerail.com', 'pmac@sncb.com', 'beny@agriman.com', 'justinbieber@benerail.com', 'brunina@benerail.com', 'alvaresazevedo@benerail.com'],
  DEUTSCHEBAHN: ['beny@benerail.com'],
  AMTRAK: ['bar@benerail.com', 'marcoluis@amtrak.com'],

  // Ground transport
  TRANSFERZ: ['beto@transferz.com', 'testim@transferz.com', 'ran@transferz.com', 'alana@transferz.com'],
  GROUNDSCOPE: ['elisabete@groundscope.com', 'testim@groundscope.com'],

  // Parking
  HOLIDAYEXTRASPARKING: ['priscila@ukparking.com', 'rafaelrocha@ukparking.com', 'anamaria@ukparking.com', 'parking@ukparking.com'],
};


// ── Execution Policies ──────────────────────────────────────────────────────
const EXECUTION_POLICIES = {
  parallelSuppliers: true,
  maxConcurrentSuppliers: 3,
  continueOnSupplierFailure: true,
  skipOnBlocker: true,
  captureScreenshotsOnFailure: true,
  captureTracesOnFailure: true,
  logSensitiveDataMasking: true,
};


// ── Shared Test Data ────────────────────────────────────────────────────────
const DOMAIN_TEST_DATA = {
  carLocations: {
    airports: ['LHR', 'CDG', 'JFK', 'LAX', 'MUC'],
    cityCenters: ['LON', 'PAR', 'NYC', 'BER'],
  },
  railRoutes: {
    benerail: ['bebmiToNlasc', 'Brussels_Midi_to_Amsterdam'],
    evolvi: ['London_to_Manchester', 'London_to_Edinburgh'],
    amtrak: ['NYC_to_WAS', 'NYC_to_BOS'],
    deutschebahn: ['Berlin_to_Munich', 'Frankfurt_to_Hamburg'],
  },
  parkingAirports: ['LHR', 'LGW', 'MAN', 'STN'],
  groundTransportLocations: {
    airports: ['LHR', 'CDG'],
    cities: ['London', 'Paris'],
  },
  testDates: {
    nearFuture: 30,
    mediumFuture: 60,
    farFuture: 180,
  },
};


// ── Shared Business Rules ───────────────────────────────────────────────────
const SHARED_BUSINESS_RULES = [
  {
    rule: 'NO_REAL_GDS_CAR_CANCELLATIONS',
    description: 'Never cancel real GDS car bookings - use test profiles only',
    enforcement: 'HARD',
  },
  {
    rule: 'PRICE_CONSISTENCY',
    description: 'Price must not change from search to booking (+/- 5%)',
    enforcement: 'HARD',
  },
  {
    rule: 'PNR_CREATION',
    description: 'Every confirmed booking must create a valid PNR',
    enforcement: 'HARD',
  },
  {
    rule: 'REFUNDABLE_BOOKINGS_ONLY',
    description: 'Always book refundable/cancellable options in tests',
    enforcement: 'HARD',
  },
  {
    rule: 'UNIQUE_USERS_PER_SUPPLIER',
    description: 'Each supplier uses its own user(s) from .env — no cross-supplier credential sharing',
    enforcement: 'HARD',
  },
];


// ── Known Issues ────────────────────────────────────────────────────────────
const KNOWN_ISSUES = [
  {
    supplier: 'DEUTSCHEBAHN',
    issue: 'All existing tests marked @wip — limited automation readiness',
    recommendation: 'Run only in non-blocking mode; expect skips',
  },
  {
    supplier: 'AMTRAK',
    issue: 'All existing tests marked @wip — limited automation readiness',
    recommendation: 'Run only in non-blocking mode; expect skips',
  },
  {
    supplier: 'SUNNYCARS',
    issue: 'Expiry tooltip 15 minutes — time-sensitive tests',
    recommendation: 'Execute early in run; avoid running last',
  },
  {
    supplier: 'TRANSFERZ',
    issue: 'Some features require specific test users with supplier access',
    recommendation: 'Ensure transferz-specific users are set in .env',
  },
  {
    supplier: 'HOLIDAYEXTRASPARKING',
    issue: 'No @provider tag on parking features — uses @parking tag filter only',
    recommendation: 'Build Cucumber tag filter using @parking not @provider:*',
  },
];


// ── Failure Categories ──────────────────────────────────────────────────────
const FAILURE_CATEGORIES = [
  'environment',
  'test-data',
  'locator',
  'contract',
  'business-rule',
  'timeout',
  'supplier-outage',
  'application-defect',
  'unknown',
];


// ── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
  SUPPLIERS,
  TRANSPORT_FLOWS,
  SUPPLIER_USER_MAPPING,
  EXECUTION_POLICIES,
  DOMAIN_TEST_DATA,
  SHARED_BUSINESS_RULES,
  KNOWN_ISSUES,
  FAILURE_CATEGORIES,

  getSuppliersByCategory: (category) => SUPPLIERS.filter(s => s.category === category),
  getSuppliersByType: (type) => SUPPLIERS.filter(s => s.type === type),
  getAllSupplierNames: () => SUPPLIERS.map(s => s.name),
  getSupplier: (name) => SUPPLIERS.find(s => s.name === name),

  getUsersForSupplier: (supplierName) => {
    return SUPPLIER_USER_MAPPING[supplierName] || [];
  },

  getPrimaryUserForSupplier: (supplierName) => {
    const users = SUPPLIER_USER_MAPPING[supplierName] || [];
    return users[0] || null;
  },

  getFlowsForCategory: (category) => {
    return Object.entries(TRANSPORT_FLOWS)
      .filter(([, def]) => def.categories.includes(category))
      .map(([name, def]) => ({ name, ...def }));
  },
};
