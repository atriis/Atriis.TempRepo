# Test Name: 58633 Cars - Travel Policy - In case car initiator is corporate user, restrict result (CITY CENTER search)
# Labels: Cars, general, Regression, Travel policy, OOP
# Owner: Bruna Santos
# Created: 2025-02-25T10:08:35Z
# Updated: 2026-02-03T01:49:09Z

@regression @cars @travel-policy @oop
Feature: 58633 Cars - Travel Policy - In case car initiator is corporate user, restrict result (CITY CENTER search)

  As a corporate traveler with travel policy restrictions
  I want to see OOP indicators for city-center car searches
  So that I understand when cars don't meet corporate policy

  @priority:high
  Scenario: In case car initiator is corporate user, restrict result (CITY CENTER search)
    Given I am logged in as "michaelburt@oopcaramad.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "London, UK" with rental agency "Europcar"
    And I click proceed button if visible
    When I select the first city center pickup location
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Initiator is corporate user"
    And the add to trip button in the first car result should be visible and disabled
