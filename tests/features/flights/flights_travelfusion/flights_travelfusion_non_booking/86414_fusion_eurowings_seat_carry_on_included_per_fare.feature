# ADO Bug #85835 - Travelfusion - Eurowings fares incorrectly show hand luggage not included
# Domain: Flights | Supplier: Fusion | Carrier: Eurowings (EW) | Flow: new flight flow brand cards
# Route: MXP -> DUS (EW 15:50-17:20), the reporter's route. DUS-BCN returns only Vueling on dev.
# Travelfusion's germanwings module sends no <Features>: the cabin-bag and seat entitlements exist only in
# SupplierClassDescription ("1xLarge cabin baggage: free of charge", "Default seat: free of charge").
# SMART and SMART FlexLight state both, so they must read included; the BASIC fares state neither and
# must still read not included (#78296). SMART FlexLight has no Galileo twin, so it cannot pass by
# borrowing another distributor's brand grid. The one-way and round-trip searches hit the two
# CheckRouting mapping branches the fix touched. Fusion occasionally answers the MXP-DUS round trip
# with no Eurowings result (easyJet / multi carrier only); the checkbox filter then fails fast, and a
# rerun has found EW again.

@regression @flights @fusion @travelfusion @eurowings @nff @branded-fares @pricing-options @payload-validation @priority:medium @ado:85835 @tc:86414
Feature: 86414 Fusion - Eurowings - Seat and carry-on bag included per fare from the brand description
  As a corporate traveler booking a Eurowings flight via Travelfusion
  I want each fare to show the seat and carry-on bag it includes
  So that I am not told a SMART fare has no cabin bag or seat

  Scenario: One way - SMART fares include seat and carry-on, BASIC fares do not
    Given I am logged in as "amsnewflowfusion@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MXP" to "DUS" in 40 days
    Then flight results should be available
    When I filter airline results by "Eurowings" checkbox
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    Then "SMART" fare should have "Free standard seat selection" text enabled with a green check mark
    And "SMART" fare should have "Carry-on bag included" text enabled with a green check mark
    And "SMART FlexLight" fare should have "Free standard seat selection" text enabled with a green check mark
    And "SMART FlexLight" fare should have "Carry-on bag included" text enabled with a green check mark
    And the fares with "BASIC" should show "Seat not included" in pricing options
    And the fares with "BASIC" should show "Carry-on bag not included" in pricing options
    And the fares with "BASIC FlexLight" should show "Seat not included" in pricing options
    And the fares with "BASIC FlexLight" should show "Carry-on bag not included" in pricing options
    When I capture the "response" payload for request type "CheckRouting" from Storage
    Then the captured "response" payload for request type "CheckRouting" should contain "Large cabin baggage: free of charge"
    And the captured "response" payload for request type "CheckRouting" should contain "Default seat: free of charge"
    And the captured "response" payload for request type "CheckRouting" should not contain "<Features>"

  Scenario: Round trip - SMART fares include seat and carry-on, BASIC fares do not
    Given I am logged in as "amsnewflowfusion@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MXP" to "DUS" with outbound in 40 days and return in 45 days
    Then flight results should be available
    When I filter airline results by "Eurowings" checkbox
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    Then "SMART" fare should have "Free standard seat selection" text enabled with a green check mark
    And "SMART" fare should have "Carry-on bag included" text enabled with a green check mark
    And "SMART FlexLight" fare should have "Free standard seat selection" text enabled with a green check mark
    And "SMART FlexLight" fare should have "Carry-on bag included" text enabled with a green check mark
    And the fares with "BASIC" should show "Seat not included" in pricing options
    And the fares with "BASIC" should show "Carry-on bag not included" in pricing options
