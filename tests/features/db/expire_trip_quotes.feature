@db
Feature: Expire trip quotes through a DB query
  As a QA engineer
  I want to move a trip's quote expiry close to now
  So that I can test expiry behaviour without waiting for real time to pass

  # expireTripQuotesKeep is a noRestore query: the new expiry STAYS after the scenario, so the
  # countdown can be checked in the app. Use expireTripQuotes instead to have the original expiry
  # written back automatically when the scenario ends.
  @priority:medium
  Scenario: Quotes of trip 3903524 expire two minutes from now
    Given I am logged in as "ruimariano@amadeus.com"
    When I run the DB query "getTripQuotes" with:
      | param  | value   |
      | tripId | 3903524 |
    Then the DB result should have at least 1 row
    When I run the DB query "expireTripQuotes" with:
      | param   | value   |
      | tripId  | 3903524 |
      | minutes | 10       |
    And I run the DB query "getTripQuotes" with:
      | param  | value   |
      | tripId | 3903524 |
    Then every DB result row column "expires" should be greater than "now"
    And every DB result row column "expires" should be less than "now+10m"
