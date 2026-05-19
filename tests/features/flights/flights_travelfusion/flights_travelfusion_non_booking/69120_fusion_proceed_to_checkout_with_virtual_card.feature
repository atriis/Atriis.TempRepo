# Test Name: 69120 Fusion - Can proceed to checkout with Virtual Card
# Status: Active
# Labels: vcc,Virtual Card,FOP,Flights,Fusion,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-08T07:50:11Z
# Updated: 2025-10-21T09:59:23Z

@regression @flights @fusion @fop @virtual-card @vcc @priority:high
Feature: 69120 Fusion - Proceed to checkout with Virtual Card FOP
  As a corporate traveler with a Virtual Card configured as FOP
  I want to proceed to checkout using the Virtual Card
  So that I can complete bookings with VCC payment

  Scenario: Proceed to checkout with Virtual Card on Fusion flight
    Given I am logged in as "nicomartin@fusionvirtualcard.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "GLA" to "BRS"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
    And I proceed to checkout
    Then I should see "Book and Finalize" button enabled

