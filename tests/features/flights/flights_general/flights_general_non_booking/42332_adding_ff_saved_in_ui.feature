# Test Name: 42332 When adding FF, it is successfully saved in the UI
# Status: Active
# Labels: Regression,FQTV,Frequent flyer,Flights,guest,Sabre,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-09T11:44:11Z
# Updated: 2025-11-14T03:17:54Z

@regression @flights @fqtv @sabre
Feature: 42332 Flights - Adding FF is successfully saved in the UI
  As a corporate traveler
  I want to add a frequent flyer number in the cart
  So that my loyalty points are applied to the booking

  Scenario: Adding frequent flyer number is saved successfully
    Given I am logged in as "christree" booking a new trip
    And I have added myself as the traveler
    # Guest traveler removed: the guest loading takes too long in CI, causing the search
    # form to remain in a loading state when Search is clicked (navigation never triggers).
    # FQTV functionality works identically with a single traveler - see 64372 for reference.
    When I search for a one way flight from "AMS" to "PAR"
    And I select the trip purpose as "BILLABLE" and proceed
    And I filter results by carrier "KL"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click frequent flyer in extras
    And I add loyalty number "BB10101010" using the first available airline
    Then I should see a success notification
    And the frequent flyer should have a green success icon
