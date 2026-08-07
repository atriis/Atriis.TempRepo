# Test Name: 62896 Cars - Travel Policy -  'Car Class and Type' and 'Car Vendor' policies work as expected when used together
# Labels: Travel policy, Regression, Cars, OOP, results, general
# Owner: Bruna Santos
# Created: 2025-06-03T09:32:36Z
# Updated: 2025-11-11T10:33:07Z

@regression @cars @travel-policy @oop
Feature: 62896 Cars - Travel Policy - 'Car Class and Type' and 'Car Vendor' policies work as expected when used together

  As a traveler with combined car travel policies
  I want to see correct OOP restrictions when using car class, type, and vendor policies together
  So that I understand which cars meet all policy requirements

  #Couldn't test the entire test due supplier availability, as soon as supplier is available we will make sure test is working as expected
  @priority:high
  Scenario: Validate combined car class, type and vendor policies
    Given I am logged in as "stefanyrita@carsabregdgpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Europcar"
    And I wait for add to trip text to be visible
    And I filter results by "Economy"
    Then all the car options on this page contain "Economy 2/4 Doors" model text
    Then the out of policy indicator should be visible in results
    Then the add to trip button in the first car result should be visible and disabled
