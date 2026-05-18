# Test Name: 61091 Ypsilon - Multi pax, Ancillary service selection saved for all
# Description:
# Status: Active
# Labels: Ypsilon,Regression,Amsalem,baggage,ancillary,Flights,Daily Flights,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-21T08:04:46Z
# Updated: 2025-11-18T07:55:56Z

@regression @flights @ypsilon @ancillary @baggage @multi-pax
Feature: 61091 Ypsilon - Multi pax ancillary service selection saved for all travelers
  As a corporate traveler using Ypsilon with multiple passengers
  I want ancillary service selections to be saved for all travelers
  So that baggage options are correctly retained after saving

  Scenario: Baggage selections saved for both travelers after adding ancillary services
    Given I am logged in as "ypsilon@corp.ams" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "AMS"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the ancillary services section
    And I switch to ancillary services traveler tab 1
    And I select the first ancillary service option with price for flight 1 and store its value for traveler tab 1
    And I select the first ancillary service option with price for flight 2 and store its value for traveler tab 1
    And I switch to ancillary services traveler tab 2
    And I select the first ancillary service option with price for flight 1 and store its value for traveler tab 2
    And I select the first ancillary service option with price for flight 2 and store its value for traveler tab 2
    And I click the save button
    Then the ancillary services green checkmark should be visible
    And the booking status should be "Pending booking"
    When I refresh the page
    Then the booking status should be "Pending booking"
    When I click to edit the ancillary services section
    And I switch to ancillary services traveler tab 1
    Then the saved ancillary services selections for traveler tab 1 should be retained
    When I switch to ancillary services traveler tab 2
    Then the saved ancillary services selections for traveler tab 2 should be retained
