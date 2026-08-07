# Test Name: 69253 AFKL - Flights - Fare rules displayed in Multi City search
# Status: Active
# Labels: Fare Rules,Regression,Flights,Pricing Options,multi city,AFKL,NDC,results,Cart,Flight Details
# Owner: Bruna Santos

@regression @flights @afkl @ndc @fare-rules @multi-city @pricing-options
Feature: 69253 AFKL - Fare rules displayed in multi-city search
  As a corporate traveler
  I want to view fare rules in a multi-city AFKL flight search
  So that I can review terms before booking each leg

  Scenario: Fare rules are accessible in results, pricing options, flight details, cart and price breakdown for multi-city
    Given I am logged in as "bsafkl@bsafkl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "CDG-WAW" and "BER-CDG" with close dates
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal
