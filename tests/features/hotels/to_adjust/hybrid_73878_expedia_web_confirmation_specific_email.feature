# Test Name: HYBRID for 73878 Email adress is sent according to the web confirmation - specific email address
# Description: 
# Status: Active
# Labels: Hotel,Web confirmation,Full Purchase,No Amadeus Hotel Book,hybrid,Regression,Expedia
# Owner: Shani Hadar
# Created: 2026-02-15T01:36:22Z
# Updated: 2026-02-15T01:48:09Z

@regression @provider:expedia
Feature: 73878 Expedia - Web confirmation email sent to specific email address
  As a corporate traveler with a web confirmation specific email configured
  I want to book a hotel and verify the confirmation email is sent to the correct address
  So that web confirmation emails reach the right recipient

  @priority:high
  Scenario: Confirmation email is sent to the specific configured email address after hotel booking
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added traveler by name "Yosef Edi"
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL setCVVForCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the web confirmation email should be sent to the specific configured email address" - hybrid API check via backend log
    When I cancel the trip
