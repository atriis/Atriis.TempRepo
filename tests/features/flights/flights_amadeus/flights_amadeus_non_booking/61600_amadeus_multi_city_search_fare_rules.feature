# TODO: Needs retesting — scenario is almost complete and ready, but Amadeus supplier was having issues with fare rules
#       during final validation so the full run could not be verified. Retest and finish when supplier is back up. Finish
@daily_flights @flights @provider:amadeus @regression
Feature: 61600 Amadeus - Multi city search, fare rules displayed
  As a corporate traveler using Amadeus
  I want to search for a multi-city flight and view the fare rules
  So that I can verify fare rules are correctly displayed for multi-leg itineraries

  @priority:high
  Scenario: Multi-city search BRU-FRA-DFW-BRU with fare rules visible in results
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "BRU-FRA" and "FRA-DFW" and "DFW-BRU"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    Then I should see the heading "Flight To Dallas"
    When I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    Then I should see the heading "Flight To Brussels"
    When I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms

