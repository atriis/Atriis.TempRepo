# Test Name: 85732 Galileo NDC - Multi-pax Light fare in pricing options is the per-traveller fare
# Source: ADO Bug #57271 - New UI - Galileo - We are splitting the flight price per pax when we show the value per traveler
# With 2+ travellers the fare in pricing options was divided or multiplied by the number of travellers. GDS: TC 66548.

# ADO Test Case ID: 85732
@ado:85732
@regression @flights @galileo @ndc @provider:travelport_ndc @multi_pax @pricing_options @priority:high
Feature: 85732 Galileo NDC - Multi-pax Light fare in pricing options is the per-traveller fare
  As a corporate traveller booking a KLM NDC flight through Galileo for several travellers
  I want the Light fare in pricing options to show the price of one traveller
  So that it is not divided or multiplied by the number of travellers

  Scenario: KLM NDC Light fare in pricing options costs the same per traveller for 1, 2 and 3 travellers
    # ===== 1 traveller =====
    Given I am logged in as "tripStatus@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "JFK"
    Then flight results should be available
    When I filter results to non-stop flights only
    And I filter results by carrier "KLM"
    Then the "NDC Direct Rate" indicator should be visible in results
    When I store the first flight result details for later comparison
    # "Select flight" opens the classic pricing options drawer on this account
    And I select the first flight result in new flight flow
    And I save the "Light" fare price from pricing options for one traveller
    And I close pricing options modal

    # ===== 2 travellers =====
    When I book a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I search for a one way flight from "AMS" to "JFK"
    Then flight results should be available
    When I extract the "Best" sort price
    Then the first flight result price should match the "Best" sort price
    When I filter results by the stored flight number
    Then the "NDC Direct Rate" indicator should be visible in results
    When I select the first flight result in new flight flow
    Then the price in pricing options should be per traveler
    And the "Light" fare price in pricing options should be the same as for one traveller
    When I close pricing options modal

    # ===== 3 travellers =====
    When I book a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I search for a one way flight from "AMS" to "JFK"
    Then flight results should be available
    When I extract the "Best" sort price
    Then the first flight result price should match the "Best" sort price
    When I filter results by the stored flight number
    Then the "NDC Direct Rate" indicator should be visible in results
    When I select the first flight result in new flight flow
    Then the price in pricing options should be per traveler
    And the "Light" fare price in pricing options should be the same as for one traveller
