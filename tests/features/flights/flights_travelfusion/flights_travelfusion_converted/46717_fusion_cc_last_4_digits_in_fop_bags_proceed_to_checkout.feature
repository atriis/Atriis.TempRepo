# Test Name: 46717 [Merge] Fusion - 4 last digits of the CC are displayed in FOP section, bags are added to cart and "proceed to checkout" button is working as expected
# Status: Active
# Labels: Regression,Fusion,baggage,Flights,FailedFusion,Checkout,FOP,credit card,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-29T11:36:26Z
# Updated: 2024-12-09T01:41:54Z

@regression @flights @fusion @baggage @fop @credit-card @priority:high
Feature: 46717 Fusion - CC last 4 digits in FOP, bags added to cart, Proceed to Checkout works
  As a corporate traveler with Fusion FOP credit card configured
  I want the last 4 digits of my CC shown in FOP, my baggage saved, and Proceed to Checkout enabled
  So that the booking flow is consistent and the FOP information is visible

  Scenario: CC last 4 digits visible in FOP, baggage added, and Proceed to Checkout works
    Given I am logged in as "ander@fusionfop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "GLA" to "BRS"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the last 4 digits of the credit card "4580" should be displayed in the FOP section
    When I click to edit the baggage extras section
    And I click number of baggage
    And I click dropdown option "2 bags"
    And I click the save button
    Then I should see a success notification
    And the booking status should be "Pending booking"
    And the baggage green icon should be visible
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    
