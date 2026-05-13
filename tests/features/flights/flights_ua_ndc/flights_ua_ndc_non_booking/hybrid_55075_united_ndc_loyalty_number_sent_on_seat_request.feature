# Test Name: HYBRID for 55075 United NDC - Loyalty number is being sent on seat request
# Description:
# Status: Active
# Labels: United,UA,Flights,UA ndc,Regression,NDC,FQTV,hybrid,Seating,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-12T02:53:28Z
# Updated: 2025-09-29T06:23:28Z

@regression @flights @ndc @united @hybrid @seating @loyalty
Feature: HYBRID 55075 United NDC - Loyalty number is being sent on seat request

  As a corporate traveler with a loyalty number
  I want to verify the loyalty number is sent when requesting seats
  So that my frequent flyer benefits are applied to the seat selection

  Scenario: Loyalty number traveler can open seat map after adding flight to cart
    Given I am logged in as "bsua@bsua.com" booking a new trip
    And I have added traveler by name "Rihanna Smith"
    When I search for a one way flight from "IAH" to "LAX"
    And I add the first flight to cart
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
