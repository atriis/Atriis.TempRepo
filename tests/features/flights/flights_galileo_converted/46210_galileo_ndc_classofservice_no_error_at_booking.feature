# Test Name: 46210 Galileo & NDC - ClassOfService not sent in AirPriceRsp, no error or price change message at booking
# Status: Active
# Labels: Gray Dawes,Galileo,Flights,AFKL NDC Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2024-10-29T12:30:41Z
# Updated: 2025-09-16T08:32:20Z

@regression @galileo @flights @ndc
Feature: 46210 Galileo & NDC - No error or price change at booking

  As a corporate traveler
  I want to book a Galileo flight without ClassOfService errors
  So that the booking completes without unexpected price change messages

  Scenario: Galileo flight hold completes without error when ClassOfService not in AirPriceRsp
    Given I am logged in as "gdsandndc" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "ARN"
    # TODO: Add_Galileo_quote_to_cart — filter by Galileo carrier and add to cart (need to identify which carrier)
    And I add the first flight to cart
    And I click hold flight button
    # TODO: Scrolling_up_to_hover — scroll up and hover to verify hold status
    Then I successfully cancel the trip
