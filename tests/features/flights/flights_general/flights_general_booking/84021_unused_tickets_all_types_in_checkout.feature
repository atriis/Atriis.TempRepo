# Test Name: 84021 - Show all unused ticket types in checkout flow
# Labels: Regression,Flights,Sabre,United,Unused tickets,Full Purchase,Checkout
# Owner: Noam Miller

# ADO Test Case: 84021
# ADO Epic: 82097 (Show All Unused Ticket Types in Checkout Flow)
# ADO user stories: 82098, 82099, 82100, 82101, 82104

@regression @flights @general @sabre @provider:sabre @united @unused-tickets @full-purchase @payload-validation @priority:high @ado:82097
Feature: 84021 Flights - Unused tickets of every type are offered in checkout
  As a corporate traveler holding unused tickets of different types
  I want every unused ticket type to be listed and selectable on the booking details page
  So that I can redeem an MCO or NDC ticket, not only a plain e-ticket

  Scenario: Display all unused ticket types at checkout, applying a non-calculable ticket queues the booking
    Given I am logged in as "unusedTkt@corp.frosch" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LAX" to "ORD"
    And flight results should be available
    And I filter results by carrier "United"
    When I select the first flight result in new flight flow
    And I select the pricing option containing "Economy Plus"
    And I add to trip from pricing options
    And I accept Terms & Conditions
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I check the unused ticket checkbox on checkout

    Then the checkout unused tickets list should include a ticket with record locator containing "NDC"
    And the checkout unused tickets list should include a ticket with record locator containing "MCO"
    And the checkout unused tickets list should include a ticket with record locator containing "TKT"

    When I select the unused ticket with record locator containing "TKT" on checkout
    Then the unused tickets action button on checkout should be "Calculate"
    When I select the unused ticket with record locator containing "NDC" on checkout
    Then the unused tickets action button on checkout should be "Apply"
    When I select the unused ticket with record locator containing "MCO" on checkout
    Then the unused tickets action button on checkout should be "Apply"

    When I apply the selected unused ticket on checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"

    When I capture the "request" payload for request type "QueuePlaceRQ(PostBookingProcess)" from Storage
    Then the captured "request" payload for request type "QueuePlaceRQ(PostBookingProcess)" should contain "Number=\"111\""
    And the captured "request" payload for request type "QueuePlaceRQ(PostBookingProcess)" should contain "PrefatoryInstructionCode=\"11\""
