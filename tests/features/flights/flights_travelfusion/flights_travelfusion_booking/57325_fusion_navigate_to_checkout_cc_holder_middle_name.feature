# Test Name: 57325 Fusion - Navigate to checkout when credit card holder name field has middle name successfully
# Status: Active
# Labels: Regression,Flights,FOP,credit card,Checkout,Fusion,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-27T09:04:39Z
# Updated: 2025-10-02T11:48:40Z

@regression @flights @fusion @full-purchase @fop @credit-card @checkout @priority:high
Feature: 57325 Fusion - Navigate to checkout when CC holder name has a middle name
  As a corporate traveler with a credit card holder name that includes a middle name
  I want to navigate to checkout and complete the booking successfully
  So that middle names in CC holder names do not block the booking flow

  Scenario: CC holder name with middle name allows successful Fusion booking
    Given I am logged in as "mojorising@fusiontestcreditcard.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the credit card holder name field should contain "bruna space middlename"
    When I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking with Fusion credit card verification
    Then the quote destination should contain "Flight to"
    
