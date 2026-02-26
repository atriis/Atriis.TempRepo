# Test Name: 39426 Expedia - Can see correct billback
# Description: 
# Status: Active
# Labels: Amsalem,conferma,FOP,Billback,Hotel,Expedia,Regression,Daily Hotels,2026 plan 1
# Owner: Noam Miller
# Created: 2025-03-03T08:26:29Z
# Updated: 2025-03-03T08:55:26Z

@regression @provider:expedia
Feature: 39426 Expedia - Book with virtual credit card (billback) and cancel
  As a corporate traveler using Expedia with billback enabled
  I want to select a virtual credit card for hotel payment
  So that hotel costs are billed back to the company automatically

  @priority:high
  Scenario: Book hotel using virtual credit card and cancel
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added traveler by name "Shani Bill"
    When I search for a hotel in "Leuven" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I select the virtual credit card as payment method" that calls DSL method selectVirtualCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip

