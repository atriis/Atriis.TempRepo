# Test Name: 55056 Amadeus - Split rules - After adding 2 different round trip flights and then holding them, the split rule configuration is applied correctly
# Description:
# Status: Active
# Labels: Regression,Amadeus,split ticket,split rules,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-03T11:24:42Z
# Updated: 2025-09-14T09:38:19Z

@regression @flights @amadeus @split-rules @hold
Feature: 55056 Amadeus - Split rules applied correctly when holding 2 round trip flights
  As a corporate traveler
  I want to add two different round trip flights and hold them
  So that the split rule configuration is applied correctly to both quotes

  Scenario: Two round trip flights held with correct split rules and PNR codes
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    # TODO: Search round trip with "Complete trip" radio selected (not standard search)
    # Testim: Search_flights_round_trip__clicking__Complete_trip__('NYC', 'DFW')
    # This variation clicks the "Complete trip" radio button during search
    # Need new step: When I search for a round trip flight from "NYC" to "DFW" with complete trip option
    When I search for a round trip flight from "NYC" to "DFW"
    And I filter results by carrier "UA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    # TODO: Navigate to trip bar, select "Complete trip", search 2nd flight
    # Testim inline flow:
    #   click trip bar icon → select "Complete trip" radio → set departure date →
    #   remove chip tag → type "american airlines (AA)" in carrier field →
    #   type "LAX" as destination → select autocomplete → pick one-way radio → 
    #   click search button
    # This is a complex multi-step "complete trip" search — needs new DSL method
    # Need new step: When I search for a "Complete trip" flight to "LAX" with carrier "AA"
    And I filter results by carrier "AA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    # TODO: Verify last quote shows "On hold" and both have PNR codes
    # Testim: scrollTo last-quote → waitForText ".last-quote .has-text-weight-bold" 'On hold'
    # waitForText ".last-quote .pnr-code" /PNR/
    # waitForText "[islastquote='false'] .pnr-code" /PNR/
    Then I successfully cancel the trip
