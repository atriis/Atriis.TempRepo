# Test Name: HYBRID for 73877 Email adress is sent according to the web confirmation - exception with traveler
# Description: 
# Status: Active
# Labels: Hotel,Web confirmation,Full Purchase,No Amadeus Hotel Book,Ehotel Regression,hybrid
# Owner: Shani Hadar
# Created: 2026-02-15T12:57:57Z
# Updated: 2026-02-15T01:35:44Z

@regression @provider:ehotel
Feature: HYBRID for 73877 Email adress is sent according to the web confirmation - exception with traveler
  As a corporate traveler where a traveler-specific email exception is configured
  I want to book a hotel and confirm the email is sent according to the exception rule
  So that confirmation emails are routed correctly for specific travelers

  @priority:high
  Scenario: Confirmation email is sent using the traveler exception rule after hotel booking
    Given I am logged in as "rebecca" booking a new trip
    And I have added traveler by name "Eliyahu Tel"
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

