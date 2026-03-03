# Test Name: HYBRID for 60144 Ratehawk - Special request information is being sent
# Description: 
# Status: Active
# Labels: Ratehawk Regression,Hotel,Full Purchase,hybrid,special request,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-28T07:43:53Z
# Updated: 2025-05-27T09:02:57Z

@regression @provider:ratehawk
Feature: 60144 Ratehawk - Special request information is sent to supplier
  As a corporate traveler using Ratehawk
  I want to add a special request to my hotel booking
  So that the special request information is transmitted to the hotel supplier

  @priority:medium
  Scenario: Special request text is included in the booking request sent to Ratehawk
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    When I add a special request with text "Please arrange for a quiet room"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip