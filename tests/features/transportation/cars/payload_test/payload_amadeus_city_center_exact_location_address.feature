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
    When I search for a car at "Madrid" with rental agency "Enterprise" and 1 months ahead
    And the agency station label should contain "Madrid (Railway Station)" and address should contain "Madrid (Railway Station)" on the vendor list
    And I select the city center pickup location by agency station label "Madrid (Railway Station)" and address "Estacion Ave Atocha Glorieta Carlos V S N, Madrid, 28045, ES"
    When I capture the "response" payload for request type "Amadeus4.Car_Location*" from Storage
    And the captured "response" payload for request type "Amadeus4.Car_Location*" should contain "MADX60".block("locationAddress")
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain "Madrid (Railway Station)".map("MADX*")
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain "Estacion Ave Atocha Glorieta Carlos V S N, Madrid, 28045, ES".split(",")
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should not contain "Estacion Atocha Glorieta Carlos V S N, Madrid, 28045, ES".split(",")[0]
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain "Estacion Ave Atocha Glorieta Carlos V S N, Madrid, 28045, ES".split(",")[1]
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should not contain "28012".onKey("postalCode")
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain "28045".onKey("postalCode")
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain "Estacion Ave Atocha Glorieta Carlos V S N, Madrid, 28045, ES".split(",")[3]
    Then the captured "block" payload for request type "Amadeus4.Car_Location*" should contain the XML:
      """
				<locationAddress>
					<addressInfo>
						<addressFormat>003</addressFormat>
						<address>ESTACION AVE ATOCHA GLORIETA CARLOS V S N</address>
					</addressInfo>
					<cityName>MADRID</cityName>
					<postalCode>28045</postalCode>
					<countryCode>ES</countryCode>
					<locationInformation>
						<locationCode>MADX60</locationCode>
						<agency>1A</agency>
					</locationInformation>
				</locationAddress>
      """
    # Validate that incorrect postal code is NOT in the block
    And the captured "block" payload for request type "Amadeus4.Car_Location*" should not contain the XML:
      """
      <locationAddress>
        <postalCode>28012</postalCode>
      </locationAddress>
      """
    # Multi-line plain text validation (no operators)
    And the captured "block" payload for request type "Amadeus4.Car_Location*" should contain the multiline text:
      """
      Estacion Ave Atocha Glorieta Carlos V S N
      """
    # Verify error patterns are NOT in the payload
    And the captured "block" payload for request type "Amadeus4.Car_Location*" should not contain the multiline text:
      """
      ERROR
      FAILED
      INVALID
      """
    And the car location label at index 0 should contain "Madrid (Railway Station)" on results
    And the car city center address at index 0 should contain "Estacion Puerta De Atocha Ave Av. Carl, Madrid, MA, ES" on results
    When I add a car from city center results to cart
    Then the car location label at index 0 should contain "Madrid (Railway Station)" on cart
    And the car city center address at index 0 should contain "Estacion Puerta De Atocha Ave Av. Carl, Madrid, MA, ES" on cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "Madrid (Railway Station)" on cart
    And the car city center address at index 0 should contain "Estacion Puerta De Atocha Ave Av. Carl, Madrid, MA, ES" on cart
    And the booking status should be "Confirmed"
    When I capture the "request" payload for request type "*Car_Sell" from Storage
    Then the captured "request" payload for request type "*Car_Sell" should contain "MADX60"
    When I capture the "request" payload for request type "Booking" from Storage
    Then the captured "request" payload for request type "Booking" should contain "AMADEUS"
    When I capture the "response" payload for request type "Booking" from Storage
    Then the captured "response" payload for request type "Booking" should contain "false".onKey("isCardAuthenticationRequired")
    When I capture the "request" payload for request type "Booking" from Storage
    Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
    Then the captured "request" payload for request type "Booking" should contain the JSON:
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
        "travelerContactDetails": null
      }
      """
    When I capture the "request" payload for request type "Amadeus4.PNR_AddMultiElements" from Storage
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "E*EM-1.1-PEDRO.CARNEIRO//ATRIIS.COM"
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "E*EM-1.1-PEDRO.CARNEIRO//ATRIIS.COM".onKey("longFreetext")
    And I successfully cancel the trip