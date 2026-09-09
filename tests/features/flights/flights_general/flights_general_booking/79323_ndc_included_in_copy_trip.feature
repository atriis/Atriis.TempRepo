# Test Name: 79323 Include NDC from Copy Trip
# Status: Design
# Owner: Noam Miller
# Note: Supersedes the old "NDC is excluded from copy trip" behaviour — AB#82066 made NDC content
#       copyable, so a held NDC trip must now OFFER Copy trip. The opposite expectation still lives
#       in 79343 for the no-copy user group.

# ADO Test Case ID: 79323
@ado:79323 @regression @flights @ndc @copy-trip @priority:critical
Feature: 79323 NDC - Trip is eligible for copy trip

  As a corporate booker holding an NDC flight
  I want Copy trip to be offered for that trip
  So that I can copy an NDC booking into a new trip instead of being blocked from it

  Scenario: Can copy an NDC booking into a new trip
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "FRA" to "MUC"
    Then flight results should be available
    When I filter results by carrier "LH"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    When I open the copy trip dialog
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    And all products in the copy trip dialog should show status "On hold"
    When I confirm the copy trip
    And I work on the copied trip
    Then the cart should contain 1 flight quotes
    And quote 1 status should be "Copied"
    Then I successfully cancel the trip
