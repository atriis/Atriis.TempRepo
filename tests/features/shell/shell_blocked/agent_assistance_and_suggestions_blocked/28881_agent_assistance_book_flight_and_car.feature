# Test Name: 28881 agent assistance - book flight and car + validate prices and tabs + can delete assistance
# Description:
# Status: Active
# Labels: Regression,Request Assistance,Cars,Flights,Full Purchase,No Amadeus Hotel Book,Transportation,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-26T10:40:23Z
# Updated: 2026-02-16T01:34:05Z

@regression @shell @request_assistance @flights @cars
Feature: 28881 - Agent assistance: book flight and car, validate prices and tabs, then delete assistance
  As a traveler requesting agent assistance
  I want an agent to suggest flights and cars that I can add to my cart and book
  So that I can complete a multi-product trip and remove the assistance request when done

  Scenario: Request assistance for a flight and car, book the suggested items, and delete the request
    Given I am logged in as "asi@stance.com" booking a new trip
    And I have added myself as the traveler
    When I click the request assistance icon
    # TODO: I fill in the flight assistance request from "lhr" to "tlv" (TravelRequest.fillFlightAssistanceDetails in tests/steps/travel_request.steps.js)
    And I fill in the flight assistance request from "lhr" to "tlv"
    # TODO: I add car assistance request details in "JFK" (TravelRequest.fillCarAssistanceDetails in tests/steps/travel_request.steps.js)
    And I add car assistance request details in "JFK"
    # TODO: I click the send request button (TravelRequest.clickSendRequest in tests/steps/travel_request.steps.js)
    And I click the send request button
    Then the "Sent to agent" confirmation should be displayed
    And the "Your request was successfully created" confirmation should be displayed
    # TODO: the travel request confirmation email should be received (Email.verifyTravelRequestEmail in tests/steps/travel_request.steps.js)
    And the travel request confirmation email should be received
    # TODO: I log in to the agent desk as "amy@deus.com" (AgentDesk.login in tests/steps/travel_request.steps.js)
    When I log in to the agent desk as "amy@deus.com"
    # TODO: I click link number 1 in the last email (Email.clickLinkInLastMail in tests/steps/travel_request.steps.js)
    And I click link number 1 in the last email
    # TODO: the agent adds 2 flights to the request (AgentDesk.addFlights in tests/steps/travel_request.steps.js)
    And the agent adds 2 flights to the request
    # TODO: the agent adds 2 cars to the request (AgentDesk.addCars in tests/steps/travel_request.steps.js)
    And the agent adds 2 cars to the request
    # TODO: the agent sends the suggested items to the traveler (AgentDesk.sendSuggestions in tests/steps/travel_request.steps.js)
    And the agent sends the suggested items to the traveler
    # TODO: the overview tab should show the two suggested cars and two suggested flights as pending booking (TravelRequest.verifyOverviewTabSuggestedItems in tests/steps/travel_request.steps.js)
    Then the overview tab should show the two suggested cars and two suggested flights as pending booking
    # TODO: the requests tab should show the requested flight and car and the suggested items (TravelRequest.verifyRequestsTabItems in tests/steps/travel_request.steps.js)
    And the requests tab should show the requested flight and car and the suggested items
    # TODO: I add the first suggested car and the last suggested flight to the cart (TravelRequest.addSuggestedItemsToCart in tests/steps/travel_request.steps.js)
    When I add the first suggested car and the last suggested flight to the cart
    # TODO: the flight quote summary title should be "Flight To Tel Aviv" (Cart.verifyFlightQuoteSummaryTitle in tests/steps/cart.steps.js)
    Then the flight quote summary title should be "Flight To Tel Aviv"
    # TODO: the car and flight quote prices should sum to the total price (Cart.verifyQuotePricesSumToTotal in tests/steps/cart.steps.js)
    And the car and flight quote prices should sum to the total price
    # TODO: the number of quotes should be 2 (TravelRequest.verifyNumberOfQuotes in tests/steps/travel_request.steps.js)
    And the number of quotes should be 2
    # TODO: 2 items should be marked as added (TravelRequest.verifyItemsAdded in tests/steps/travel_request.steps.js)
    And 2 items should be marked as added
    # TODO: 2 suggested items should be marked as added (TravelRequest.verifyAddedInSuggestedItems in tests/steps/travel_request.steps.js)
    And 2 suggested items should be marked as added
    # TODO: I select the car quote in the cart (Cart.selectCarQuote in tests/steps/cart.steps.js)
    When I select the car quote in the cart
    # TODO: I select the flight quote in the cart (Cart.selectFlightQuote in tests/steps/cart.steps.js)
    And I select the flight quote in the cart
    And I proceed to checkout
    And I validate price change if displayed and proceed
    Then "Contact details" should be displayed in the checkout page
    And the contact email on checkout should contain "Asi@Stance.com"
    When I send booking for approval
    Then go to trip text is visible
    When I click go to trip button
    # TODO: the trip should show the car quote "Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States" (Cart.verifyTripCarQuoteTitle in tests/steps/cart.steps.js)
    Then the trip should show the car quote "Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States"
    # TODO: the trip car quote status should be "Confirmed" (Cart.verifyTripCarQuoteStatus in tests/steps/cart.steps.js)
    And the trip car quote status should be "Confirmed"
    # TODO: the trip should show the flight quote "Flight to Tel Aviv" (Cart.verifyTripFlightQuoteTitle in tests/steps/cart.steps.js)
    And the trip should show the flight quote "Flight to Tel Aviv"
    # TODO: the trip flight quote status should be "On hold" or "Finalizing" (Cart.verifyTripFlightQuoteStatus in tests/steps/cart.steps.js)
    And the trip flight quote status should be "On hold" or "Finalizing"
    # TODO: I delete the travel request items and confirm success (TravelRequest.deleteRequestItems in tests/steps/travel_request.steps.js)
    When I delete the travel request items and confirm success
