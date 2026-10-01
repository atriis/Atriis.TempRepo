# QA Automation Onboarding Guide

Welcome to the Atriis test automation framework. This guide is written for QA engineers who are **not** developers — you don't need to know JavaScript to read, run, and write tests here.

---

## Table of Contents

1. [What is this framework?](#1-what-is-this-framework)
2. [How tests are structured](#2-how-tests-are-structured)
3. [Setup (one time only)](#3-setup-one-time-only)
4. [Running tests](#4-running-tests)
5. [Understanding test results](#5-understanding-test-results)
6. [Writing your first test](#6-writing-your-first-test)
7. [Step definitions catalog](#7-step-definitions-catalog)
8. [Tags reference](#8-tags-reference)
9. [Adding a new user](#9-adding-a-new-user)
10. [Where to place your feature file](#10-where-to-place-your-feature-file)
11. [When something doesn't work](#11-when-something-doesnt-work)
12. [Glossary](#12-glossary)

---

## 1. What is this framework?

Tests are written in **plain English** using a format called **Gherkin**. A test looks like this:

```gherkin
Scenario: Search for a one-way flight
  Given I am logged in as "ruimariano" booking a new trip
  And I have added myself as the traveler
  When I search for a one way flight from "MIA" to "BOS"
  Then flight results should be available
```

You write what the user does. The framework handles how to do it in the browser automatically.

---

## 2. How tests are structured

Tests live in `tests/features/`. Each `.feature` file contains one or more scenarios.

```
tests/features/
├── smoke/              ← Quick sanity checks (run first)
├── flights/
│   ├── general/        ← Most flight tests go here
│   ├── amadeus/        ← Amadeus-specific tests
│   └── daily_flights/  ← Nightly regression suite
├── hotels/             ← Hotel booking tests
├── cars/               ← Car rental tests
├── rails/              ← Rail booking tests
├── shell/              ← Multi-product (flight + hotel, etc.)
└── manual_quote/       ← Manual quote flows
```

**Rule of thumb:** if your test is about a single product and uses a standard user, it goes in the `general/` folder for that product.

---

## 3. Setup (one time only)

### Prerequisites

Install these tools before anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| Git | any | https://git-scm.com |

### Install the framework

```bash
# 1. Clone the repository
git clone <repo-url>
cd Atriis.Test.Automation

# 2. Install dependencies
npm install

# 3. Install browsers
npx playwright install chromium
```

### Set up your environment file

The `.env` file holds test users and the app URL.

#### Option A — Sync from 1Password (recommended)

The team stores the shared `.env` in 1Password. If you have the 1Password CLI installed, one command pulls it down:

```powershell
# Install the 1Password CLI first (one time):
# https://developer.1password.com/docs/cli/get-started/

# Then sign in and sync:
op signin
.\scripts\sync-env-from-1password.ps1
```

This downloads the document named **`Atriis.Automation.Env`** from 1Password and writes it to `.env` at the project root. Run it again any time the team updates credentials.

If your vault has a custom name, pass it explicitly:

```powershell
.\scripts\sync-env-from-1password.ps1 -Vault "QA Team"
```

#### Option B — Manual setup

Ask your team lead for the `.env` file, or create one from this template:

```
# Application URL
AUTOMATION_APP_BASEURL="https://atriis-stg.app"

# Shared password for all test users
GENERAL_PASSWORD="your_password_here"
```

> **Important:** Never commit the `.env` file. It is already in `.gitignore`.
> User emails are written directly in feature files — no `USER_*` entries needed.

---

## 4. Running tests

All commands are run from the project root in a terminal (PowerShell on Windows).

### Run everything

```bash
npm run bdd
```

### Run by product

```bash
npm run bdd:flights:general     # General flight tests
npm run bdd:hotels:general      # Hotel tests
npm run bdd:cars                # Car tests
npm run bdd:smoke               # Smoke tests only
```

### Run a single feature file

```bash
npx cucumber-js tests/features/flights/general/59765_frosch_tmc_original_currency.feature
```

### Run by tag

```bash
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@regression and @flights"
npx cucumber-js --tags "@priority:critical"
```

### Run with visible browser (useful when debugging)

```bash
HEADLESS=false npx cucumber-js tests/features/flights/general/my_test.feature
```

On Windows PowerShell:

```powershell
$env:HEADLESS="false"; npx cucumber-js tests/features/flights/general/my_test.feature
```

---

## 5. Understanding test results

### Console output

After a run, you will see a summary like:

```
3 scenarios (3 passed)         ← All green = good
13 steps (13 passed)

or

2 scenarios (1 failed, 1 passed)
8 steps (1 failed, 6 passed, 1 skipped)
```

### Screenshots

If a test fails, a screenshot is automatically saved to:

```
test-results/screenshots/
```

### Allure report (full visual report)

```bash
npx allure serve allure-results
```

This opens a browser window with a full visual dashboard: timeline, step-by-step details, screenshots, and error messages.

---

## 6. Writing your first test

Follow these steps every time you create a new test.

### Step 1 — Create the feature file

Create a new file in the correct folder. Use this naming convention:

```
<ADO_ticket_id>_<short_description>.feature
```

Example: `tests/features/flights/general/72345_round_trip_search.feature`

### Step 2 — Write the scenario using the template below

```gherkin
# Test Name: <Full test name from ADO>
# Status: Active
# Labels: Regression,Flights,<other labels>
# Owner: <Your name>
# Created: <Today's date>

@regression @flights @general
Feature: <ADO ID> <Short description of what you're testing>
  As a <who is doing this>
  I want to <goal>
  So that <business reason>

  Scenario: <Title of this specific scenario>
    Given I am logged in as "ana@company.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MIA" to "BOS"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
```

### Step 3 — Run it

```bash
npx cucumber-js tests/features/flights/general/72345_round_trip_search.feature
```

If a step is not recognized, Cucumber will print it in red and suggest the code that needs to be added. Share that output with a developer on the team.

### Step 4 — Verify it passes

Run it 2-3 times to make sure it passes consistently.

### Step 5 — Commit it

```bash
git add tests/features/flights/general/72345_round_trip_search.feature
git commit -m "test(flights): add round trip search scenario 72345"
```

---

## 7. Step definitions catalog

These are all the steps you can use today — copy/paste them directly into your feature files.

---

### 🔐 Login & Setup

```gherkin
Given I am logged in as "username" booking a new trip
Given I am logged in as "username"
When I book a new trip
When I logout from the application
Then I should be redirected to the login page
```

---

### 👤 Travelers

```gherkin
Given I have added myself as the traveler
Given I have added traveler by name "First Last"
Given I have added a random guest traveler
Given I have added a random guest traveler with name "John" "Doe"
Given I have added "First Last" as primary traveler
Then I remove myself as the traveler
```

---

### ✈️ Flight Search

```gherkin
# One-way
When I search for a one way flight from "MIA" to "BOS"
When I search for a same day one way flight from "MIA" to "BOS"
When I search for a random one way flight
When I search for a random one way flight in "europe"

# Round trip
When I search for a round trip flight from "MIA" to "BOS"
When I search for a round trip "Business" class flight from "MIA" to "BOS"
When I search for a random round trip flight
When I search for a round trip flight from "MIA" to "BOS" with preferred carrier "AA"

# Multi-city
When I search for a multi-city flight with legs "MIA-BOS" and "BOS-MIA"
When I search for a multi-city flight with legs "MIA-BOS" and "BOS-DFW" and "DFW-MIA"

# By schedule
When I search for a flight by schedule from "MIA" to "BOS"
When I select flight segments by schedule
When I select one flight segment by schedule

# Edit search
When I click edit search and wait for the "Complete trip" search mode option
When I search for a one way flight from "MIA" to "BOS"     ← re-runs search after edit
When I search from the edit flight search form
When I change the search type to "Complete trip" in the edit flight search
When I change the departure location to "CDG" in the edit flight search

# Advanced
When I click advanced search in the flight search form
When I select "Non-stop" in the flight search stops dropdown
```

**Available flight route keys** (use instead of airport codes when a saved route is needed):

| Region | Keys |
|--------|------|
| Europe | `cdgToLhr`, `fraToLhr`, `fraToZrh`, `lhrToMad`, `lhrToMuc`, `madToBcn`, `mucToFra`, `amsToCph`, `arnToOsl`, `bcnToFco`, `bruToPar`, `fcoToMuc`, `madToLhr`, `mucToLhr`, `zrhToVie` |

---

### ✈️ Flight Results

```gherkin
Then flight results should be available
When I add the first flight to cart
When I click to open first pricing options
When I add to trip from pricing options
When I select the first option from pricing options
When I close pricing options modal
When I close fare rules window
When I close flight details window
When I click to open fare rules
When I click to open flight details
When I open seat map from results and verify it loads
When I filter results by carrier "Lufthansa"
When I hide the comparison table in flight results
When I show the comparison table in flight results
When I click on the "Share" button
When I add flight result 1 to the share bar
When I click share slot 1
When I click on the "Share" button to open the share dialog
When I exit share mode
When I open pricing options for flight result 1
When I share the selection from pricing options
When I remove the shared selection from the pricing options footer
Then the pricing options Share button should be enabled
Then the share bar should show 1 of 4 quotes selected
Then the share email preview should contain every quote in the share bar
Then the original currency symbol "$" should be visible in flight results
Then the original currency symbol "$" should be visible in pricing options
Then the original currency symbol "$" should be visible in the share quote from results
Then the alert "No flights found" should be displayed
```

---

### 🏨 Hotel Search

```gherkin
When I search for a hotel in "London" for 2 night(s)
When I search for a hotel in "Paris" for 3 night(s) with 2 rooms
When I search for a hotel in "Madrid" for 1 night(s) from the cart drawer
When I search for a hotel in "Berlin" for 2 night(s) 1 months ahead
When I wait for hotel results to load
When I filter hotel results by hotel name "Marriott"
When I select the first hotel result
When I select hotel result at index 2
When I sort hotel results by "Price"
When I edit the hotel search location to "Amsterdam"
```

---

### 🏨 Hotel Results (Room Level)

```gherkin
When I select the first room
When I select a refundable room
When I select the cheapest room
When I apply hotel level filter "Board Type" with option "Breakfast"
Then hotel 1 should display the "Free WiFi" amenity
Then the hotel results should be for the new location "Amsterdam"
Then the "Expedia" supplier logo should be visible in hotel results
Then the hotel should appear as refundable in cart
```

---

### 🚗 Car Search

```gherkin
When I search for a car at "New York"
When I search for a car at "New York" with 1 months ahead
When I search for a car at "New York" with rental agency "Hertz"
When I search for a car from "New York" to "Boston"
When I add the first car to cart
When I add a car from city center results to cart
When I select rental agency "Sixt"
```

---

### 🛒 Cart

```gherkin
Then the booking status should be "Pending booking"
When I proceed to checkout
When I click the proceed to checkout button
When I hold the trip
When I attempt to cancel the trip safely
Then I successfully cancel the trip
When I click to open price breakdown in cart
When I close price breakdown modal
When I click to add a hotel to my trip from cart
When I click to add a flight to my trip from cart
When I click number of baggage
When I click dropdown option "1 bag"
When I click to open fare rules in cart
When I accept Terms & Conditions
When I add a special request with text "Window seat please"
Then the original currency symbol "$" should be visible in cart
Then the booking status should be "Pending booking"
Then the payment type should be "Credit card"
Then the out of policy indicator should be visible in cart
Then all quotes should have PNR codes
Then the CO2 emissions should be displayed in the trip overview
```

---

### 💳 Checkout

```gherkin
When I complete the booking
When I send booking for approval
When I click back to trip
Then "Booking confirmed" should be displayed in the checkout page
```

---

### 🔀 Results (generic)

```gherkin
When I add the first result to trip
When I wait for add to trip text to be visible
When I wait for select text to be visible
When I select and add one way journey to trip
When I select and add round trip journey to trip
When I handle conflicting quotes if visible
When I add to cart and proceed past flight capacity modal
When I validate flight capacity modal and go back
When I filter results by "Refundable" checkbox
When I filter airline results by "Business" checkbox
When I log the trip number from the URL
Then the out of policy indicator should be visible in results
Then the out of policy indicator should not be visible in results
Then the out of policy tooltip in results should be "This is outside policy"
Then the "No results found" text should be visible in results
Then the flight capacity restriction modal should be visible
Then the reset filters button should be visible and disabled
Then the no results found message should be displayed
Then the reset filters and edit search buttons should be visible in no results state
When I click reset filters in no results state
```

---

### 🚂 Rail — Benerail

```gherkin
When I search for a one way Benerail train from "londonToAmsterdam"
When I search for a round trip Benerail train from "londonToAmsterdam"
When I select the first Benerail option
When I add a Benerail one way to the trip
When I add a Benerail round trip to the trip
```

---

### 🚂 Rail — Amtrak

```gherkin
When I search for a one way Amtrak train from "nycToBoston"
When I search for a round trip Amtrak train from "nycToBoston"
When I click more details for the first Amtrak result
```

---

### 🚂 Rail — Evolvi

```gherkin
When I search for a one way Evolvi train from "londonToManchester"
When I search for a round trip Evolvi train from "londonToManchester"
When I add an Evolvi one way to the trip
When I add an Evolvi round trip to the trip
```

---

### 🚗 Ground Transport

```gherkin
When I search for ground transport from "londonHeathrow"
```

---

### 🅿️ Parking

```gherkin
When I search for UK parking at "LHR"
```

---

### 📋 Manual Quote

```gherkin
When I search and add a flight manual quote
```

---

### ✈️ Flight Pricing

```gherkin
When I add "Your Selection" fare to trip
When I wait for "Your Selection" text to be visible
When I extract the price from "Your Selection" fare
```

---

### 💳 Payment (Form of Payment)

```gherkin
When I add a credit card as payment method
When I fill credit card details
When I click add payment method button
When I click add card details button
When I fill credit card cvv if needed
When I click the card "Visa Corporate" checkbox
When I save the card selection
When I select card 1 and save
When I click payment restriction field
When I select the "Credit card" payment option
When I click the set billback button in cart
When I fill the credit card CVV
When I click complete missing info for the holder name card
When I fill in the card holder name as "John Doe"
When I save the missing card details
When I click to edit the card
When I select the no country card
When I select the first available country
When I save the card form with empty required fields
Then the payment method should be added
Then the card "Visa Corporate" should be visible
Then the card details text should be visible
Then credit card "Visa Corporate" should look disabled
Then 2 payment cards should be visible in the FOP panel
Then payment restriction text should be visible
Then payment restriction options should include "Credit card" and "Invoice"
Then the card "Visa Corporate" checkbox should be checked
Then add credit card details option should not be visible
Then the payment options should include "Credit card" and "Invoice"
Then payment restrictions are displayed for "Credit card" option
Then the default card should have a complete missing info button
Then the cart should show the in order to proceed warning
Then the cart should not show the in order to proceed warning
Then the card form should show missing details for card holder name
Then the card form should show missing details for country
Then the no country card should be displayed in cart
Then the CVV field should not be displayed
```

---

### 📝 Reference Fields (Dynamic / Checkout Fields)

```gherkin
When I select the trip purpose reference field
When I add a number checkout field
When I wait for booking details in checkout
When I fill in the "Cost Center" reference field with "CC001"
When I fill in NL reference fields education and courses
When I select the trip purpose as "Business" and proceed
When I select the "Department" reference field as "Finance" and proceed
When I click proceed on the reference fields popup
Then the reference fields popup should show the following labels:
  | Cost Center |
  | Department  |
Then the following checkout reference fields should be visible:
  | Cost Center |
Then the following checkout reference fields should not be visible:
  | Project Code |
Then the reference fields should have the following values:
  | Cost Center | CC001 |
Then the following reference fields should not be editable:
  | Department |
Then clicking proceed should show a mandatory field validation error
```

---

### 📊 Price Comparison (extracted prices)

These steps work together to extract and compare prices across the test. An index refers to the order you extracted a price — 0 is the first one extracted, 1 is the second, etc.

```gherkin
When I extract the price at index 0 from "results"
When I extract the price at index 1 from "cart"
Then the extracted price at index 0 should equal 250.00
Then the extracted price at index 0 should be greater than 100.00
Then the extracted price at index 0 should be less than 500.00
Then the extracted price at index 0 should equal the extracted price at index 1
Then the extracted price at index 0 should not equal the extracted price at index 1
Then the extracted price at index 0 should be greater than the extracted price at index 1
Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
Then the sum of extracted prices at index 0 and 1 should equal 500.00
Then the sum of extracted prices at index 0 and 1 should equal the extracted price at index 2
Then the price at index 0 from "results" should equal the price at index 0 from "cart"
Then the sum of prices at index 0 from "results" and index 1 from "results" should equal the price at index 0 from "cart"
```

---

### 🔀 Common / Utility

```gherkin
When I handle conflicting quotes if visible
Then the search title should contain "MIA"
Then the welcome heading should contain "Welcome"
When I wait for "Your Selection" text to be visible
Given I work on tab 2
When I click proceed button if visible
Then I should see the heading "Trip Overview"
Then I should see a success notification
```

---

### 🗺️ Trips page

```gherkin
When I navigate to the trips page
Then the trips page should be loaded
```

---

## 8. Tags reference

Tags go at the top of your Feature block or individual Scenario. They control which tests run together.

### Required tags (always add these)

| Tag | Meaning |
|-----|---------|
| `@regression` | Should run in the nightly regression suite |
| `@smoke` | Critical path — runs on every deployment |

### Product tags (add the right one)

| Tag | Use for |
|-----|---------|
| `@flights` | Flights |
| `@hotels` | Hotels |
| `@cars` | Cars |
| `@rails` | Rail |
| `@general` | Generic / not supplier-specific |

### Priority tags

| Tag | Meaning |
|-----|---------|
| `@priority:critical` | If this fails, the whole release is blocked |
| `@priority:high` | Important, must pass before release |
| `@priority:medium` | Should pass, regressions tracked |

### Provider / supplier tags

| Tag | Use for |
|-----|---------|
| `@provider:amadeus` | Amadeus GDS only |
| `@provider:galileo` | Galileo GDS only |
| `@provider:ratehawk` | RateHawk hotels |
| `@currency` | Currency display tests |
| `@multi-city` | Multi-city flights |

### Status tags

| Tag | Meaning |
|-----|---------|
| `@wip` | Work in progress — will be skipped in CI |
| `@flaky` | Known flaky — excluded from critical runs |

### Example

```gherkin
@regression @flights @general @priority:high
Feature: 59765 Currency displayed in Frosch TMC
```

---

## 9. Adding a new user

No `.env` changes needed. Write the email address directly in the Gherkin step:

```gherkin
Given I am logged in as "yourname@company.com" booking a new trip
```

`GENERAL_PASSWORD` from `.env` is the shared password used for all test accounts.

---

## 10. Where to place your feature file

Use this decision tree:

```
Is the test about a single product?
├── Yes → go into that product's folder
│   ├── Is it specific to one supplier (Amadeus, Galileo, etc.)?
│   │   ├── Yes → tests/features/flights/amadeus/
│   │   └── No  → tests/features/flights/general/
│   └── Does it test a nightly regression scenario?
│       └── Yes → also add its tag to the daily suite file
└── No (involves multiple products) → tests/features/shell/
```

**Naming rule:** `<ADO_ticket_id>_<snake_case_description>.feature`

Examples:
- `72345_frosch_round_trip_hold.feature`
- `80012_hotel_refundable_room_filter.feature`
- `91100_shell_flight_hotel_combined.feature`

---

## 11. When something doesn't work

### "Step not found" / "Undefined step"

Cucumber printed something like:

```
? When I do something new
    Undefined. Implement with the following snippet:
    When('I do something new', async function () { ... });
```

This means the step doesn't exist yet. You have two options:
1. Find the closest existing step in the [catalog above](#7-step-definitions-catalog) and reword your Gherkin to match.
2. Ask a developer to implement the new step.

### Test fails with a screenshot

1. Open `test-results/screenshots/` — find the screenshot for your scenario.
2. Look at what the app shows at the moment of failure.
3. Common causes:
   - App is slow → the test timed out waiting for something.
   - UI changed → a selector is broken (developer task).
   - Test data issue → the user or route doesn't work for that scenario.

### Test passes locally but fails in CI

- The CI environment is headless and has no access to your local `.env`. Secrets are loaded separately.
- Check if a network timeout is the cause (CI is slower than local).
- Check if the test relies on real data that changes day-to-day (e.g., flight schedules).

### Allure report shows nothing

Run:
```bash
npx allure generate allure-results --clean
npx allure open
```

### "Missing required env var" error at startup

Your `.env` file is missing a variable the test needs. Check the error message for the variable name, then add it to your `.env`.

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **Gherkin** | The plain-English language used to write test scenarios. Uses `Given / When / Then` keywords. |
| **Feature file** | A `.feature` file containing one or more test scenarios written in Gherkin. |
| **Scenario** | A single test case written in Gherkin. Maps to one test run. |
| **Step** | A single line in a scenario (`Given I am logged in...`). |
| **Step definition** | The JavaScript code behind a step. You never need to edit this as a QA. |
| **DSL** | "Domain-Specific Language" — the business-level actions (search, add to cart, etc.) that connect steps to the browser. You never need to edit this. |
| **Page Object** | A JavaScript class representing a page in the app. Holds selectors. You never need to edit this. |
| **Tag** | A label like `@smoke` or `@regression` that groups tests together. |
| **Playwright** | The browser automation tool running behind the scenes. |
| **Cucumber** | The tool that reads `.feature` files and runs each step. |
| **Allure** | The visual test reporting tool. |
| **CI** | "Continuous Integration" — the automated pipeline that runs tests on a schedule or every code push. |
| **Headless** | Running the browser invisibly, without a visible window. Default for CI. |
| **Fixture / Test data** | Predefined data used in tests (user emails, routes, card numbers). |
| **`.env`** | A local file that stores credentials and configuration. Never committed to Git. |
