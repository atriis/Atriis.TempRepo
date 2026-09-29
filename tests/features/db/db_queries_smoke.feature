@db
Feature: DB queries smoke
  As a QA engineer
  I want a DB query step to reach the database
  So that I know the DB configuration, credential and catalog work end to end

  @priority:medium
  Scenario: A read-only catalog query returns its row
    Given I am logged in as "ruimariano@amadeus.com"
    When I run the DB query "dbPing"
    Then the DB result should have 1 row
    And the DB result column "ok" should be "1"
