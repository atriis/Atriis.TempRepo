# Test Name: 65018 Fusion - First and last names are trimmed in the 'ProcessTerms' request
# Status: Active
# Labels: Regression,Flights,Checkout,Fusion,guest,name,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-01T01:39:16Z
# Updated: 2025-11-14T04:20:50Z

@regression @flights @fusion @checkout @priority:high
Feature: 65018 Fusion - First and last names are trimmed in the ProcessTerms request
  As a corporate traveler with extra whitespace in a guest traveler's first and last name
  I want the names to be trimmed when sending the ProcessTerms request
  So that the booking proceeds without an error caused by leading/trailing whitespace

  Scenario: Proceed to checkout succeeds and ProcessTerms sends the guest names trimmed
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added a random guest traveler with spaces in the first and last name
    When I search for a one way flight from "LON" to "GVA"
    Then flight results should be available
    When I add the first flight to cart
    And I fill credit card cvv if needed
    And I proceed to checkout
    Then I should see "Book and Finalise" button enabled

    # The guest was typed as " <first> " / " <last> ". Matching each name inside its own NamePart tags
    # proves both were sent trimmed: the plain-text match is exact, so a padded name would not match.
    # The app trims the names when the guest is saved, so SavePassengers and FlightSearchV3 already
    # carry them without spaces; ProcessTerms receives clean names rather than trimming them itself.
    # This checks the end result the test case asks for, not a ProcessTerms-level trim.
    When I capture the "request" payload for request type "ProcessTerms" from Storage
    Then the captured "request" payload for request type "ProcessTerms" should contain "<NamePart>{guestFirstName}</NamePart>"
    And the captured "request" payload for request type "ProcessTerms" should contain "<NamePart>{guestLastName}</NamePart>"
