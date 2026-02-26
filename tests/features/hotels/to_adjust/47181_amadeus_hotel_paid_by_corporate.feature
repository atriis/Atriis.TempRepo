# Test Name: 47181 Hotel - 'Paid by corporate' is displayed in cart
# Description: 
# Status: Active
# Labels: Regression,Hotel,paid by,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-13T10:19:45Z
# Updated: 2024-06-13T10:32:15Z

@regression @provider:amadeus
Feature: 47181 Amadeus - Hotel paid by Corporate
  As a corporate traveler
  I want to book a hotel and see "Paid by Corporate" as the payment type
  So that I know the company is covering the hotel cost

  @priority:high
  Scenario: Hotel booking shows "Paid by Corporate" payment type
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the payment type should be "Paid by Corporate"" that calls DSL verifyPaymentType with "Paid by Corporate" in Cart.js
    Then I successfully cancel the trip

