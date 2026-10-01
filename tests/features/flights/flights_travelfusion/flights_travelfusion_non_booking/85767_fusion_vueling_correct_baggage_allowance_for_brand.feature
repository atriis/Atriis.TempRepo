# ADO Bug #85292 - Fusion - Vueling - Not displaying baggage allowance for brand
# Child Test Case: #85767 - Fusion - Vueling - Correct baggage allowance for brand
# Domain: Flights | Supplier: Fusion | Carrier: Vueling (VY)
# Route example: BCN → AMS one way
# Fly Grande and Fly With Checked Bag come back in the HoldBag feature as Bundled at 0.00, so they include 1 checked bag

@regression @flights @fusion @vueling @baggage @pricing-options @ado:85292 @tc:85767
Feature: 85767 Fusion - Vueling - Correct baggage allowance for brand
  As a corporate traveler booking a Vueling flight via Fusion
  I want fares with a bundled checked bag to show 1PC
  So that I am not told a fare has no checked bag when it does

  Scenario: Fly Grande and Fly With Checked Bag show 1PC and are bundled in the HoldBag feature
    Given I am logged in as "veulingWeb@TFreg.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BCN" to "AMS" in 10 days
    Then flight results should be available
    When I filter results by carrier "Vueling"
    And I click to open first pricing options
    Then the pricing options row containing "Fly Grande" should show baggage "1PC"
    And the pricing options row containing "Fly With Checked Bag" should show baggage "1PC"

    When I capture the "response" payload for request type "ProcessDetails" from Storage
    Then the captured "response" payload for request type "ProcessDetails" should contain "HoldBag".block("Feature")
    And the captured "block" payload for request type "ProcessDetails" should contain "Fly Grande".block("Option")
    And the captured "block" payload for request type "ProcessDetails" should contain "0.00".onKey("Value")
    And the captured "block" payload for request type "ProcessDetails" should contain the XML:
      """
      <Condition>
        <Type>Provision</Type>
        <Value>Bundled</Value>
      </Condition>
      """
    Then the captured "response" payload for request type "ProcessDetails" should contain "HoldBag".block("Feature")
    And the captured "block" payload for request type "ProcessDetails" should contain "Fly With Checked Bag".block("Option")
    And the captured "block" payload for request type "ProcessDetails" should contain "0.00".onKey("Value")
    And the captured "block" payload for request type "ProcessDetails" should contain the XML:
      """
      <Condition>
        <Type>Provision</Type>
        <Value>Bundled</Value>
      </Condition>
      """
