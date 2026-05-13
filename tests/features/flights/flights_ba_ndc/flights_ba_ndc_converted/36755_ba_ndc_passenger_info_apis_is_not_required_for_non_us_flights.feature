# Test Name: 36755 BA NDC - Passenger Info (APIS) is not required in case flight is not to the United States
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Search Flight,Cart,passenger info,guest,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-17T09:34:38Z
# Updated: 2025-04-17T09:53:11Z

@regression @flights @ndc @ba @apis
Feature: 36755 BA NDC - Passenger Info (APIS) is not required for non-US flights

  As a corporate traveler
  I want to book a BA NDC flight to a non-US destination
  So that I can verify APIS passenger info is not required for non-US routes

  Scenario: APIS section is not shown in cart for non-US BA NDC flight
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LHR" to "ARN"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement step — 'the APIS section should not be visible in the extras'
    #   Assert that no APIS/passenger info extras section is rendered in the cart extras panel
    Then the APIS section should not be visible in the extras
    # TODO: implement step — 'the {string} section should be visible in the extras'
    #   Assert that the named extras section (e.g. Frequent Flyer, Seating) is visible in the cart extras panel
    Then the "Frequent Flyer" section should be visible in the extras
    # TODO: implement step — 'the {string} section should be visible in the extras' (reuse same step definition)
    Then the "Seating" section should be visible in the extras
    # TODO: implement step — 'there should be {int} extras sections visible'
    #   Count the number of visible extras sections in the cart and assert it matches the expected count
    Then there should be 2 extras sections visible
