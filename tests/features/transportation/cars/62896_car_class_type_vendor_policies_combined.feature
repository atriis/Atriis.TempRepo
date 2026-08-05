# Test Name: 62896 Cars - Travel Policy -  'Car Class and Type' and 'Car Vendor' policies work as expected when used together
# Labels: Travel policy, Regression, Cars, OOP, results, general
# Owner: Bruna Santos
# Created: 2025-06-03T09:32:36Z
# Updated: 2025-11-11T10:33:07Z

@regression @cars @travel-policy @oop
Feature: 62896 Car class type and vendor policies combined

  As a traveler with combined car travel policies
  I want to see correct OOP restrictions when using car class, type, and vendor policies together
  So that I understand which cars meet all policy requirements

  @priority:high
  Scenario: Validate combined car class, type and vendor policies
    Given I am logged in as "stefanyrita@carsabregdgpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Europcar"
    # TODO: Verify car class and type filtering with vendor policies applied
    Then the out of policy indicator should not be visible in results
    And the result should be restricted if applicable
