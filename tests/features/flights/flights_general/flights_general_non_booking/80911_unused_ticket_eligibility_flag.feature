# Test Name: 80911 Eligible flights are flagged for unused tickets
# Status: Active
# Labels: Flights,unused tickets,Regression,General,80764
# Source: ADO Bug #80764 - Eligible Flights Missing Unused Ticket Flag
# ADO Test Case ID: 80911

@ado:80911
@regression @flights @general @unused-tickets
Feature: 80911 Unused ticket eligibility flag on matching flights
  As a corporate traveler with unused tickets
  I want matching flights to be flagged as eligible for my unused tickets
  So that I can apply an unused ticket that is valid for that airline and booking system

  # Regression: eligible unused tickets were de-duplicated to one per airline
  # (ignoring booking system / SourceSystem), so valid tickets never got flagged on matching
  # search results. A traveler holding an unused ticket for a carrier must see that carrier's
  # flights flagged as eligible on the results page.
  Scenario Outline: <carrier> flights are flagged as eligible for the traveler's unused ticket
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "<from>" to "<to>"
    And I select the trip purpose as "Conference" and proceed
    Then flight results should be available
    When I click the airplane icon in the results header to view unused tickets
    Then the unused tickets list should include a ticket for carrier "<carrier>"
    When I close the unused tickets modal
    And I filter results by carrier "<carrier>"
    Then all flight results should show the unused tickets eligibility tag
    When I add the first flight to cart
    Then the booking status should be "Pending booking"

    Examples:
      | carrier | from | to  |
      | El Al   | NYC  | TLV |
      | Delta   | LAS  | LAX |
      | KLM     | CDG  | AMS |
      | Alaska  | SEA  | LAX |
