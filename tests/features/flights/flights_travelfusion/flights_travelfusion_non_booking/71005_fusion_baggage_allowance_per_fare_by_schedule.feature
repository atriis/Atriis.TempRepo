# ADO Test Case #71005 - Fusion - Baggage Display in Search Results
# Parent: User Story #66106 - [Flights new flow][Pricing Options][Fusion] Get baggage and ancillaries at CheckRouting
# Domain: Flights | Supplier: Fusion | Carrier: IndiGo (6E)
# Route example: DEL → BKK by schedule (the test case's SpiceJet routes return no content on staging any more)
# StartRouting asks for IncludeStructuredFeatures, and each fare then shows the bags its brand includes:
# the free (Value 0.00) HoldBag option for its SupplierClass, MaxQuantity pieces of MaxWeight,
# where more than one piece reads "(XXKG Total)" because MaxWeight is the total of all pieces.

@regression @flights @fusion @indigo @baggage @by-schedule @pricing-options @payload-validation @ado:66106 @tc:71005
Feature: 71005 Fusion - Baggage allowance per fare in search results
  As a corporate traveler booking a Fusion flight
  I want each fare to show the baggage it includes
  So that I can compare fares by their real baggage allowance

  Scenario: Economy fares show their included bags on both legs and the booked fare keeps them in the cart
    Given I am logged in as "fusionCorp@bagallow.club" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "DEL" to "BKK"
    Then flight results should be available
    When I capture the "request" payload for request type "StartRouting" from Storage
    Then the captured "request" payload for request type "StartRouting" should contain "<Name>IncludeStructuredFeatures</Name><Value>y</Value>"

    When I filter results by carrier "Indigo"
    And I click to open first pricing options
    Then every fare in pricing options should show the baggage Fusion includes in it in CheckRouting
    When I select the pricing option containing "Regular Fare"
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    Then flight results should be available

    When I filter results by carrier "Indigo"
    And I click to open first pricing options
    Then every fare in pricing options should show the baggage Fusion includes in it in CheckRouting
    When I select the pricing option containing "Regular Fare"
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    Then the flight details should show the baggage Fusion includes in the "Regular Fare" fare from "DEL" in ProcessDetails

  Scenario: Business fares with more than one bag show the total weight of all pieces
    Given I am logged in as "fusionCorp@bagallow.club" booking a new trip
    And I have added myself as the traveler
    When I search for a "Business" class flight by schedule from "DEL" to "BKK"
    Then flight results should be available
    When I filter results by carrier "Indigo"
    And I click to open first pricing options
    Then every fare in pricing options should show the baggage Fusion includes in it in CheckRouting
    And the pricing options row containing "Stretch Plus" should show baggage "KG Total)"
