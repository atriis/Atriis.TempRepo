# Test Name: 73878 Email adress is sent according to the web confirmation - specific email address
# Description: 
# Status: Active
# Labels: Hotel,Web confirmation,Full Purchase,No Amadeus Hotel Book,Regression,Expedia
# Owner: Shani Hadar
# Created: 2026-02-15T01:36:22Z
# Updated: 2026-02-15T01:48:09Z

@regression @provider:expedia
Feature: 73878 Email adress is sent according to the web confirmation - specific email address
  As a corporate traveler with a web confirmation specific email configured
  I want to book a hotel and verify the confirmation email is sent to the correct address
  So that web confirmation emails reach the right recipient

  @priority:high
  Scenario: Confirmation email is sent to the specific configured email address after hotel booking
    Given I am logged in as "rebecca@kom.com" booking a new trip
    And I have added traveler by name "Yosef Edi"
    When I search for a hotel in "LON" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    And I log the trip number from the URL
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
    When I capture the "request" payload for request type "CreateBooking" from Storage
    Then the captured "request" payload for request type "CreateBooking" should contain "testim@tgbvfr.com".onKey("email")

