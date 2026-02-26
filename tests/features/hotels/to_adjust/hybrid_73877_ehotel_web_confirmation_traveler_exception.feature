# Test Name: HYBRID for 73877 Email adress is sent according to the web confirmation - exception with traveler
# Description: 
# Status: Active
# Labels: Hotel,Web confirmation,Full Purchase,No Amadeus Hotel Book,Ehotel Regression,hybrid
# Owner: Shani Hadar
# Created: 2026-02-15T12:57:57Z
# Updated: 2026-02-15T01:35:44Z

@regression @provider:ehotel
Feature: 73877 eHotel - Web confirmation email sent based on traveler exception rule
  As a corporate traveler where a traveler-specific email exception is configured
  I want to book a hotel and confirm the email is sent according to the exception rule
  So that confirmation emails are routed correctly for specific travelers

  @priority:high
  Scenario: Confirmation email is sent using the traveler exception rule after hotel booking
    Given I am logged in as "ehotel" "user_one" booking a new trip
    And I have added traveler by name "Eliyahu Tel"
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL setCVVForCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the web confirmation email should be sent according to the traveler exception rule" - hybrid API check via backend log
    When I cancel the trip
