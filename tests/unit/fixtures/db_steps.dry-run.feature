Feature: DB query step vocabulary (dry-run only)

  Scenario: Every DB step shape
    Given I am logged in as "dry-run@example.com"
    When I run the DB query "getTripQuotes"
    When I run the DB query "expireTripQuotes" with:
      | param   | value |
      | minutes | 5     |
    Then the DB result should have 1 row
    Then the DB result should have 2 rows
    Then the DB result should have at least 1 row
    Then the DB result column "status" should be "3"
    Then the DB result column "status" should not be "3"
    Then the DB result column "product" should contain "car"
    Then the DB result column "product" should not contain "car"
    Then the DB result column "expires" should be greater than "now"
    Then the DB result column "expires" should be less than "now+2m"
    Then the DB result row 2 column "status" should be "3"
    Then every DB result row column "status" should be "3"
    Then any DB result row column "status" should be "3"
    Then the DB result column "expires" should be empty
    Then the DB result column "expires" should not be empty
    Then the DB result should contain rows:
      | product | status |
      | car     | 3      |
    Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds
    Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds with:
      | param  | value |
      | tripId | 1     |
    And I store the DB result column "id" as "storedQuoteId"
    And I store the DB result row 2 column "id" as "storedSecondQuoteId"
