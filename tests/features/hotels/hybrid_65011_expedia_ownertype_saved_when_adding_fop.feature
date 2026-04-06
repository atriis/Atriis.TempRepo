# Test Name: HYBRID for 65011 Expedia - 'OwnerType' is saved when adding FOP
# Description: 
# Status: Active
# Labels: Expedia,Hotel,Regression,hybrid,FOP,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-01T09:16:39Z
# Updated: 2025-12-08T08:57:39Z

@regression @provider:expedia
Feature: 65011 Expedia - OwnerType is saved correctly when adding FOP in cart
  As a corporate traveler using Expedia with no pre-configured FOP
  I want to add a credit card in cart and verify the OwnerType is saved correctly
  So that back-end FOP records reflect the correct owner type for billing

  @priority:high
  Scenario: OwnerType is correctly saved when adding a credit card FOP for Expedia hotel
    Given I am logged in as "robbysilva" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Budapest" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I log the trip number from the URL
    When I add a credit card as payment method
    Then the payment type should be "Paid by Traveler"
