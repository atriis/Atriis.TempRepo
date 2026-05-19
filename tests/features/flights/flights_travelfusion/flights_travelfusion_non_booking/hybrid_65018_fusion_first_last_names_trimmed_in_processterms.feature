# Test Name: HYBRID for 65018 Fusion - First and last names are trimmed in the 'ProcessTerms' request
# Status: Active
# Labels: Regression,Flights,Checkout,Fusion,hybrid,guest,name,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-01T01:39:16Z
# Updated: 2025-11-14T04:20:50Z

@regression @flights @fusion @hybrid @checkout @priority:high
Feature: 65018 Fusion - First and last names are trimmed in the ProcessTerms request
  As a corporate traveler with extra whitespace in a guest traveler's first name
  I want the names to be trimmed when sending the ProcessTerms request
  So that the booking proceeds without an error caused by leading/trailing whitespace

  Scenario: Proceed to checkout succeeds without booking error when guest first name has extra spaces
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added a random guest traveler with spaces in the first name
    When I search for a one way flight from "LON" to "GVA"
    Then flight results should be available
    When I add the first flight to cart
    And I fill credit card cvv if needed
    And I proceed to checkout
    Then I should see "Book and Finalize" button enabled
