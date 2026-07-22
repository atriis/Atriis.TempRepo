# Test Name: HYBRID for 72499> Get Travel Manager according to primary traveller
# Description: the test book for other pax and activate note to the travel manager of the primary pax
#
# GDG
# AAA testim
# Status: Active
# Labels: Regression,Approval flow,2026 plan 2
# Owner: pini harush
# Created: 2026-01-12T08:38:08Z
# Updated: 2026-01-12T09:09:57Z

@regression @shell @approval_flow @cars @manual_quote
Feature: 72499 - Get Travel Manager according to primary traveller
  As a travel booker
  I want to book a trip for another primary traveller with a car manual quote
  So that the travel manager is selected according to the primary traveller

  Scenario: Book a car manual quote for a named primary traveller
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    When I add a traveler by name "liko@kiko.com" from the search autocomplete
    # TODO: add a detailed CAR manual quote (vendor avis, PDX->SFO cities, pick-up/drop-off dates & times, mileage "no limitation", confirmation 966231A, day/hour rates 60/24) via ManualQuote.addDetailedCarManualQuote
    When I add a detailed car manual quote from "PDX" to "SFO"
    And I click the proceed to checkout button
    # TODO: fill the required checkout reference field (#el-id-108-3269) with the given value via Checkout.fillRequiredReferenceField
    And I fill the required checkout reference field with "1"
    And I complete the booking
