# Test Name: 44303 Sabre unused tickets
# Status: Active
# Labels: Regression,unused tickets,Sabre,Flights,Full Purchase,TLC,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-03-28T10:49:59Z
# Updated: 2026-02-17T09:00:11Z

@regression @flights @sabre @unused-tickets @full-purchase
Feature: 44303 Sabre - Unused tickets flow
  As a corporate traveler with unused tickets
  I want to see unused ticket information throughout the booking flow
  So that I can use my unused ticket for price deduction

  #BLOCKED - It keeps failing in Testim, it needs to be investigated before implemented.
  # TODO: This test is complex with unused tickets popup validation, filter validation,
  # FOP selection, OOP justification, and checkout unused ticket recalculation.
  # Many of these steps need new DSL/step implementations.
  Scenario: Unused tickets are visible and functional throughout booking flow
    Given I am logged in as "Olusola.Abidoye@atriis.com" booking a new trip
    And I have added traveler by name "chris tree"
    # TODO: Step needed: "When I verify the unused tickets icon is visible on search page"
    # TODO: Step needed: "When I open unused tickets popup and verify contents"
    When I search for a round trip flight from "LHR" to "ATH"
    # TODO: Step needed for dynamic fields/ref fields: "When I answer reference fields for chris tree and proceed"
    # TODO: Step needed: "Then the unused tickets icon should be visible in results header"
    # TODO: Step needed: "When I filter results by 'Unused Tickets Available' checkbox"
    And I filter results by carrier "Aegean Airlines"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Step needed: "Then the unused tickets icon should be visible in cart"
    # TODO: Step needed: "When I add a credit card as payment method" (conditional)
    # TODO: Step needed: "When I fill in the OOP justification text 'aaa'" (conditional)
    When I proceed to checkout
    # TODO: Step needed: "Then unused tickets section should be visible in checkout"
    # TODO: Step needed: "When I select unused ticket and click calculate"
    # TODO: Step needed: "Then recalculation error message should be displayed"
    # TODO: Navigate back to cart
    Then I successfully cancel the trip
