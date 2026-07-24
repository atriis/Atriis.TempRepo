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
Feature: 72499 HYBRID Get Travel Manager according to primary traveller
  As a travel booker
  I want to book a trip for another primary traveller with a car manual quote
  So that the travel manager is selected according to the primary traveller

  Scenario: Book a car manual quote for a named primary traveller
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    When I have added traveler by name "Liko Kikoo"
    And I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And the booking status should be "On hold"
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I fill in the "ORDER NUMBER" reference field with "1111"
    And I complete the booking
