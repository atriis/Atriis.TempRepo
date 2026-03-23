# Test Name: 52657 - Go Global: Book with FOP Credit Card
# Description: 
# Status: Active
# Labels: Go Global,Regression,Hotel,Gray Dawes,credit card,Daily Hotels,Full Purchase,progress page,Pre Prod,Giata,2026 plan 1
# Owner: Noam Miller
# Created: 2024-10-09T02:47:05Z
# Updated: 2025-09-16T06:13:45Z

@regression @provider:general
Feature: 52657 Go Global - FOP validation and credit card booking for guest
  As a travel agent using Go Global
  I want to validate the payment methods available and book with a credit card for a guest traveler
  So that bookings complete successfully with the correct payment method

  @priority:high
  Scenario: Go Global FOP validation and book with credit card for guest traveler
    Given I am logged in as "general" "go_global" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the Go Global payment options should be valid" that calls DSL verifyGoGlobalFOP in CartFop.js
    When I add a credit card as payment method
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

