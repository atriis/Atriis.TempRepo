# ADO Bug #74593 - Fusion (Wizz Air) - Wrongfully calculating fare price (multi-pax)
# Child Test Case: #75629 - OBT- Fusion- Wizzair- When multi-pax, Price in pricing options is per traveler
# Severity: 1 - Major | Priority: 2
# Domain: Flights | Supplier: Fusion | Carrier: Wizz Air
# Route example from repro steps: CRL → RMO
# Fix: Fusion V3 API was returning total fare for all passengers; fix ensures per-pax price is returned

@regression @flights @fusion @multi-pax @pricing @ado:74593 @tc:75629 @priority:critical
Feature: 75629 Fusion Wizz Air - Pricing options show per-traveler fare for multi-pax search
  As a corporate travel arranger booking a Wizz Air flight via Fusion for multiple passengers
  I want the pricing options view to display the fare per traveler
  So that I can accurately compare options without seeing an inflated total price across all passengers

  Scenario: Fusion Wizz Air pricing options display per-traveler fare with 2 adult passengers
    Given I am logged in as "wizzair@fusion.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a one way flight from "BCN" to "TIA"
    Then flight results should be available
    When I filter results by carrier "Wizz Air"
    And I click to open first pricing options
    And I extract the price from first pricing option
    Then the price in pricing options should be per traveler
