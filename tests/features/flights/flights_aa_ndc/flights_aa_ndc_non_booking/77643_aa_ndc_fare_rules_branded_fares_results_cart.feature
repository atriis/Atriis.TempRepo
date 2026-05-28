# Test Name: 77643 AA NDC - Fare rules, seat modal title, and branded fares are displayed in results and cart
# Description: Bug #77643 - AA NDC brand does not show on results and cart.
#              Linked to TC #35605: 'NDC AA - Fare rules and branded fares are displayed in results, cart and trip overview and seat title is correct in results page'
#              Fix: AA brand mapping corrected in OBT Frontend.
# Status: Active
# Labels: Flights,AA NDC,Regression,Branded Fares,Fare Rules,2026 plan 2
# Owner: QA Automation
# Created: 2026-05-28

@regression @flights @aa @ndc @branded-fares @fare-rules @priority:high @provider:aa_ndc
Feature: 77643 AA NDC - Fare rules, seat modal title, and branded fares displayed in results and cart

  As a corporate traveler
  I want to verify that fare rules, seat modal title, and branded fares are displayed correctly for AA NDC flights
  So that the brand mapping fix for AA NDC is confirmed in results and cart

  Scenario: Fare rules and branded fares visible at every stage for AA NDC in results and cart
    Given I am logged in as "ami@rickan.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "ORD"
    Then flight results should be available
    When I filter results by carrier "American"
    # Verify fare rules in results page
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # Verify branded fares in Flight Details from results
    When I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    # Verify branded fares in Pricing Options from results
    When I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close pricing options modal
    # Add to cart and verify branded fares in cart
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    And I open branded fares from cart flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer in cart
    And I close flight details window
    Then I successfully cancel the trip
