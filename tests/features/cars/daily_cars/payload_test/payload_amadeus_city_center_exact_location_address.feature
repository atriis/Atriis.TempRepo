# ADO #76707 - [Cars][Amadeus] City Center Search - Use Exact Location Address
# Reference test case: ADO #76707
@daily_cars @provider:amadeus @regression @transportation @cars @ado:76707 @priority:critical
Feature: 76707 Amadeus city center exact location address display
  As a corporate traveler using Amadeus city center search
  I want location formatting to remain consistent from results to cart and booking
  So that I can confirm the exact pickup location before completing the trip

  Scenario Outline: Amadeus city center location and address second line are consistent across booking flow
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Madrid" with rental agency "Europcar" and 1 months ahead
    And the agency station label should contain "Madrid (Railway Station)" and address should contain "Madrid (Railway Station)" on the vendor list
    And I select the city center pickup location by agency station label "Madrid (Railway Station)" and address "Madrid Atocha Rrs, Madrid, 28012, ES"
    When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
    And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03".block("locationAddress")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid (Railway Station)".map("MADX*")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid Atocha Rrs, Madrid, 28012, ES".split(",")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain "Barcelona Atocha Rrs, Madrid, 28012, ES".split(",")[0]
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid Atocha Rrs, Madrid, 28012, ES".split(",")[1]
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain "28013".onKey("postalCode")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "28012".onKey("postalCode")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid Atocha Rrs, Madrid, 28012, ES".split(",")[3]
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain the XML block:
      """
      <locationAddress>
        <addressInfo>
          <addressFormat>003</addressFormat>
          <address>MADRID ATOCHA RRS</address>
        </addressInfo>
        <cityName>MADRID</cityName>
        <postalCode>28012</postalCode>
        <countryCode>ES</countryCode>
        <locationInformation>
          <locationCode>MADX03</locationCode>
          <agency>1A</agency>
        </locationInformation>
      </locationAddress>
      """
    # Validate that incorrect postal code is NOT in the block
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain the XML block:
      """
      <locationAddress>
        <postalCode>28013</postalCode>
      </locationAddress>
      """
    # Multi-line plain text validation (no operators)
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain:
      """
      MADRID ATOCHA RRS
      """
    # Verify error patterns are NOT in the payload
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain:
      """
      ERROR
      FAILED
      INVALID
      """
    And the car location label at index 0 should contain "Madrid 28012 (Railway Station)" on results
    And the car city center address at index 0 should contain "Puerta Atocha Llegadas Ave, Madrid 28012, ES" on results
    When I add a car from city center results to cart
    Then the car location label at index 0 should contain "Madrid 28012 (Railway Station)" on cart
    And the car city center address at index 0 should contain "Puerta Atocha Llegadas Ave, Madrid 28012, ES" on cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "Madrid 28012 (Railway Station)" on cart
    And the car city center address at index 0 should contain "Puerta Atocha Llegadas Ave, Madrid 28012, ES" on cart
    And the booking status should be "Confirmed"
    When I capture the "request" payload for request type "Amadeus4.Car_Sell" from Storage
    Then the captured "request" payload for request type "Amadeus4.Car_Sell" should contain "MADX03"
    When I capture the "request" payload for request type "Booking" from Storage
    Then the captured "request" payload for request type "Booking" should contain "AMADEUS"
    When I capture the "response" payload for request type "Booking" from Storage
    Then the captured "response" payload for request type "Booking" should contain "false".onKey("isCardAuthenticationRequired")
    When I capture the "request" payload for request type "Booking" from Storage
    Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
    Then the captured "request" payload for request type "Booking" should contain the JSON block:
      """
      {
        "bookingItems": [{
          "productType": "car",
          "sourceSystem": "AMADEUS",
          "creditCardSecurityNumber": null,
          "addFOP": false,
          "parentPnr": null,
          "parentOfficeId": null,
          "purchaseGUID": null,
          "isPassive": false,
          "pricingExternalReference": null,
          "selectedUnusedTicket": null
        }],
        "priceCheckItems": null,
        "hotelModifyItems": [],
        "isTripApprovalRequired": false,
        "isTripApprovalRequiredChainNotCompleted": false,
        "isTripApprovalForChangesRequiredChainNotCompleted": false,
        "isTripApprovalForChangesRequired": false,
        "isBookerOverWriteEmail": false,
        "creditCard": null,
        "isRequestedAssistanceItemsExist": false,
        "isPreTripItemsExist": false,
        "userDetails": null,
        "tripApprovalUserSelection": [],
        "travelers": null,
        "isNewUi": true,
        "isMobile": false,
        "isOnhold": false,
        "newUi3DsReturnUrl": "https://atriis-stg.app/payment-token/",
        "travelerContactDetails": null
      }
      """
    When I capture the "request" payload for request type "Amadeus4.PNR_AddMultiElements" from Storage
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "E*EM-1.1-PEDRO.CARNEIRO//ATRIIS.COM"
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "E*EM-1.1-PEDRO.CARNEIRO//ATRIIS.COM".onKey("longFreetext")
    And I successfully cancel the trip
