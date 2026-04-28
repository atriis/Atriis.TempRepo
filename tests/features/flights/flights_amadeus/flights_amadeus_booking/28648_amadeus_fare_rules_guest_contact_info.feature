# Test Name: 28648 MERGED Book Amadeus flight + check fare rules + contact info appears for a guest
# Description: flight in Amadeus NL - check Fare rules in: results, cart, and checkout
# Status: Active
# Labels: Amadeus,Flights,No Amadeus Hotel Book,Full Purchase,Regression,contact info,guest,Fare Rules,Sanity,Pre Prod,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-20T09:36:54Z
# Updated: 2026-02-04T10:17:42Z

@regression @flights @amadeus @fare-rules @contact-info @guest @full-purchase
Feature: 28648 Amadeus - Book flight with fare rules check and guest contact info
  As a corporate traveler
  I want to verify fare rules at each stage and see contact details for a guest
  So that I can ensure fare information is consistent and guest contact info is collected

  Scenario: Fare rules displayed in results, cart, and trip overview with guest contact info
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "DOH"
    And I filter results by carrier "Qatar Airways"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    Then I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
    And I proceed to checkout
    Then the contact email on checkout should contain "@atriis"
    Then the contact telephone on checkout should contain numbers
    Then the booker notification phone on checkout should contain numbers
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
