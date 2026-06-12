# ADO Bug #78296 - [Fusion] - Incorrect parsing of standard seat and carry on bag
# Child Test Case: #79275 - EasyJet carry-on bag shown as included only for fares with LargeCabinBag feature
# Severity: 2 - High | Priority: 2
# Domain: Flights | Supplier: Fusion | Carrier: EasyJet (U2)
# Route example: LIS → LGW
# Fix: Incorrect OperatorCode filtering in BuildBrandsTable caused LargeCabinBag feature to be applied to wrong fares

@regression @flights @fusion @easyjet @branded-fares @pricing-options @priority:high @ado:78296 @tc:79275
Feature: 78296 Fusion - EasyJet carry-on bag correctly shown as included or not per fare
  As a corporate traveler booking an EasyJet flight via Fusion
  I want carry-on bag to only show as included in fares that bundle LargeCabinBag
  So that I am not misled about baggage entitlement per fare

  Scenario: EasyJet carry-on bag display in pricing options matches LargeCabinBag feature in CheckRouting payload
    Given I am logged in as "amsnewflowfusion@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LGW"
    Then flight results should be available
    When I filter results by carrier "u2"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I capture the "response" payload for request type "CheckRouting" from Storage
    Then the captured "response" payload for request type "CheckRouting" should contain "LargeCabinBag".block("Feature")
    And the fares in the captured "block" should show "Carry-on bag included" in pricing options
    And the fares not in the captured "block" should show "Carry-on bag not included" in pricing options
