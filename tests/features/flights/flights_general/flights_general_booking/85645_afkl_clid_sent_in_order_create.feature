# Test Name: 71026 AFKL - CLID sent in the order create request
# Description: Hold an Air France one-way CDG-CPH on the Flex fare on the CLID-per-user-group
# account with the booker as the traveler. The OrderCreateV01 booking request must carry the
# Air France corporate code: CorporateCodeText IL01340 and CorporateID OIN.
# Status: Design
# Labels: Regression,Flights,Air France,CLID,Payload,Hold
# Owner: Noam Miller
# Created: 2026-09-29

# ADO Test Case ID: 85645
# ADO Work Item: 71026
@regression @flights @general @afkl @provider:afkl @clid @payload @hold-flight @priority:high
Feature: 85645 AFKL - CLID sent in the order create request
  As a corporate booker holding an Air France flight
  I want the corporate code sent in the order create request
  So that the order is linked to the negotiated corporate account with the airline

  Scenario: The Air France order create request carries the corporate code
    Given I am logged in as "clid@pergroup.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "CDG" to "CPH"
    Then flight results should be available
    When I filter results by carrier "Air France"
    And I select the first flight result in new flight flow
    # Flex is the last card and the carousel's ">" arrow covers it until scrolled
    And I scroll the outbound brand cards to the end in pricing options new flight flow
    And I select the outbound brand card named "Flex" from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    When I capture the "request" payload for request type "OrderCreateV01 (Booking)" from Storage
    Then the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "IL01340".onKey("CorporateCodeText")
    And the captured "request" payload for request type "OrderCreateV01 (Booking)" should contain "OIN".onKey("CorporateID")
    Then I successfully cancel the trip
