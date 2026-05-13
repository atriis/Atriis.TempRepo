# Test Name: hybrid for 59199 AFKL Flight booking with umlaut in traveler name - ticket issued for pax with middle name
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Umlaut,Middle Name,Ticket Issued,Full Purchase
# Owner: Bruna Santos

@regression @flights @afkl @ndc @umlaut @middle-name @full-purchase
Feature: 59199 AFKL NDC - Flight booking with umlaut in traveler name and middle name
  As a corporate traveler
  I want to book a flight for travelers with umlaut characters and middle names
  So that the ticket is issued correctly with the full traveler details

  Scenario: Book an AFKL round trip with umlaut traveler and a guest traveler with middle name
    Given I am logged in as "ndc@testim.com" booking a new trip
    And I have added traveler by name "Sönja Götz"
    And I have added a random guest traveler with middle name "Jonas"
    When I search for a round trip flight from "DUS" to "CDG"
    And flight results should be available
    And I filter results by carrier "AF"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I refresh the page
    And I open flight details in cart
    Then ticket numbers should be visible in flight details