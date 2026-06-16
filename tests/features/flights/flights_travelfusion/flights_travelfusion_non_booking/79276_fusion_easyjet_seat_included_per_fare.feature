# ADO Bug #78296 - [Fusion] - Incorrect parsing of standard seat and carry on bag
# Child Test Case: #79276 - EasyJet seat shown as included only for fares with Standard Seat feature
# Severity: 2 - High | Priority: 2
# Domain: Flights | Supplier: Fusion | Carrier: EasyJet (U2)
# Route example: LIS → LGW
# Fix: Incorrect OperatorCode filtering in BuildBrandsTable caused Standard Seat feature to be applied to wrong fares

@regression @flights @fusion @easyjet @branded-fares @pricing-options @priority:high @ado:78296 @tc:79276
Feature: 78296 Fusion - EasyJet seat correctly shown as included or not per fare
  As a corporate traveler booking an EasyJet flight via Fusion
  I want seat selection to only show as included in fares that bundle Standard Seat
  So that I am not misled about seat entitlement per fare

  Scenario: EasyJet seat display in pricing options matches Standard Seat Bundled provision in CheckRouting payload
    Given I am logged in as "amsnewflowfusion@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LGW"
    Then flight results should be available
    When I filter results by carrier "u2"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I capture the "response" payload for request type "CheckRouting" from Storage
    Then the captured "response" payload for request type "CheckRouting" should contain "Standard Seat".block("Feature")
    And the fares with "Bundled" provision in the captured "block" should show "Free standard seat selection" in pricing options
    And the fares without "Bundled" provision in the captured "block" should show "seat not included" in pricing options
