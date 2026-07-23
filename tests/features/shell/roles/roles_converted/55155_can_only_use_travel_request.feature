# Test Name: 55155 Can Only Use Travel Request
# Description:
# Status: Active
# Labels: Regression,Role,Privileges,Request Assistance,No Amadeus Hotel Book,Hotel,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-27T01:03:35Z
# Updated: 2026-02-17T06:49:47Z

@regression @shell @roles @privileges @hotels @travel_request
Feature: 55155 - Can Only Use Travel Request
  As a corporate user restricted to the travel-request privilege
  I want to only be able to send travel requests to an agent instead of booking directly
  So that a product an agent adds to my trip cannot be self-checked-out by me

  Scenario: Restricted user sends a hotel travel request and cannot proceed to checkout on the agent-added product
    Given I am logged in as "Travel@Requestonly.com" booking a new trip
    And I have added myself as the traveler
    # TODO: assert the main flight/hotel Search button is absent for this role (negative-element validation) — back with Search.verifySearchButtonNotVisible (new); Testim body was an empty manual-conversion stub (validate_search_button_is_not_visible)
    Then the search button should not be visible
    # TODO: assert the "Travel request" CTA (.btn--size-large, text "support_agent Travel request") is visible on the search page — back with TravelRequest.verifyTravelRequestButtonVisible (new)
    Then the Travel request button should be visible
    # TODO: open the hotel tab, fill the destination autocomplete + check-in/check-out dates, then click the "Travel request" button to open the request-assistance form (mirror TravelRequest.sendFlightTravelRequest for hotel; the hotel confirm is a body-level .btn--primary modal, NOT the flight reference-form Save modal) — back with TravelRequest.sendHotelTravelRequest (new)
    When I send a hotel travel request for "LON"
    Then the "Sent to agent" confirmation should be displayed
    When I navigate to the trip from the travel request
    And I extract the trip number from the current URL
    # TODO: cross-app — open the OLD AngularJS agent app (https://2.gtp-staging.com), sign out if a session exists, log in as the agent, wait for "Welcome on Board!" — back with AgentApp.login (new; needs a second browser context/tab)
    When I log into the agent application as "amy@deus.com"
    # TODO: cross-app — in the agent app open the extracted trip (/Trip/<tripNumber>), run "Search Online" hotels, add the first hotel room to the trip cart and wait for the "1 Added" confirmation — back with AgentApp.addHotelToTripCart (new)
    When I add a hotel to the trip cart from the agent application
    # TODO: back in the corporate app, reload the trip, click the add-from-assistance button to bring the agent's product into the cart, then open the trip Overview tab — back with TravelRequest.addAssistedProductToCart (new)
    When I return to the corporate application and add the assisted product to the cart
    Then the cart status should be Pending booking
    When I accept Terms & Conditions
    Then the proceed to checkout button should be disabled
