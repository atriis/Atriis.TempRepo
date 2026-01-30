@smoke
Feature: Smoke Tests
  As a QA engineer
  I want to verify critical application functionality
  So that I can ensure the system is operational

  @priority:medium
  Scenario: Application loads successfully
    Given I am logged in and ready to book a new trip
    Then the application should be loaded
    And the page should have a title

  @priority:critical @loginOnly
  Scenario: Login and navigate to trips page
    Given I am logged in to the application
    When I navigate to the trips page
    Then the trips page should be loaded

  @priority:critical
  Scenario: Flight search displays results
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "cdgToLhr"
    Then flight results should be displayed

  @priority:high @loginOnly
  Scenario: User can logout successfully
    Given I am logged in to the application
    When I logout from the application
    Then I should be redirected to the login page