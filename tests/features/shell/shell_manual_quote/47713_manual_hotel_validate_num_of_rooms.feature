# Test Name: 47713 Manual Hotel - validate num of rooms
# Status: Active
# Labels: Manual Quote,No Amadeus Hotel Book,Hotel,multi pax,Regression,Daily Hotels,2026 plan 1
# Owner: pini harush
# Created: 2024-06-26T02:03:36Z
# Updated: 2026-02-09T11:16:59Z
@regression @manual_quote @hotels @multi_pax
Feature: 47713 Manual Quote - Hotel manual quote with 4 travelers shows 4 rooms
  As a corporate traveler booking for a group of 4
  I want the hotel manual quote to reflect 4 rooms and 4 guests
  So that the room allocation and share-quote email match the traveler count

  @priority:high
  Scenario: Hotel manual quote with 4 travelers displays 4 rooms and 4 guests in share preview
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "noam ypsilon"
    And I have added traveler by name "noam amadeus"
    And I have added traveler by name "noam fusion"
    When I add a hotel manual quote in "Portland"
    Then the booking status should be "On hold"
    And I click more details in cart
    Then the hotel manual quote details should show "Total for  4 Rooms"
    And I close more details in cart
    When I click the share quote button
    Then I wait to see "Subject" field in share dialog
    And I switch the share email preview to detailed view
    Then the share quote preview should show "Number of guests: 4"
