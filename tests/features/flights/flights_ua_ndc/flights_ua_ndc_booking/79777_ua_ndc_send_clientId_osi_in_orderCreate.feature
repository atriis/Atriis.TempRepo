# Test Name: United NDC - ClientId AugmentationPoint sent in OrderCreate request
# Status: Active
# Labels: United,UA,Flights,UA ndc,Regression,payload,ClientId,OSI,hybrid,hold flight,2026 plan 2
# Owner: Noam Miller
# Created: 2026-06-21

# ADO Test Case ID: 79777
@ado:79777 @regression @flights @ndc @united @hybrid @hold-flight @payload @clientid
Feature: 79777 United NDC - ClientId AugmentationPoint is sent in OrderCreate request
  As a corporate traveler
  I want to hold a United NDC round trip flight with a guest traveler
  So that the ClientId AugmentationPoint (OSI1/QCI/UA0001) is correctly sent in the OrderCreate request

  Scenario: United NDC Send Corporate ClientId as OSI remark in OrderCreate Request
    Given I am logged in as "traveler@uandc.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "DEN" to "MSP"
    Then flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    When I capture the "request" payload for request type "OrderCreate" from Storage
    Then the captured "request" payload for request type "OrderCreate" should contain "AugmentationPoint"
    And the captured "request" payload for request type "OrderCreate" should contain "MetadataKey=\"OSI1\""
    And the captured "request" payload for request type "OrderCreate" should contain "QCI/UA0001"
    And the captured "request" payload for request type "OrderCreate" should contain "<ActionCode>NN</ActionCode>"
    Then I successfully cancel the trip
