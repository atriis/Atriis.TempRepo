# ADO Test Case ID: 71033
# Parent: 70750
# The TC checks the "TransferzPay-by-creditcard" supplier log for each booking; both are read from
# that log in Storage. The authorised booking is also verified on the wire, by intercepting the
# POST /booking response Book & Finalize receives. The log drops "refusalReason" on staging when it
# is null, so the success payload is matched with null also accepting a missing key.
# Login: transferz@transferz.com has no card on the quote, so the default card is picked through
# "Add payment method" before the CVV is typed.

@ado:71033 @regression @transportation @ground_transport @provider:transferz @full_purchase
Feature: 71033 Transferz - New payment API response structure

  As a corporate traveler
  I want a Transferz booking to be paid by credit card through the new payment API
  So that a wrong CVV is refused and the valid CVV is authorised

  Scenario: Transferz payment is refused with a wrong CVV and authorised with CVV 737
    Given I am logged in as "transferz@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "LHR" to specific address "Emirates"
    And I add the first result to trip
    And the booking status should be "Pending booking"
    And I fill ground transport contact details in cart
    And I click add payment method button
    And I select card 1 and save
    And I fill CVV with "123"
    And I proceed to checkout
    And I complete the booking without navigating to trip overview
    Then a booking error message should be displayed
    When I capture the "response" payload for request type "TransferzPay-by-creditcard" from Storage
    Then the captured "response" payload for request type "TransferzPay-by-creditcard" should contain '"IsSuccess":false'
    And the captured "response" payload for request type "TransferzPay-by-creditcard" should contain '"result":"REFUSED"'
    When I click back to trip
    And I successfully cancel the trip
    When I book a new trip
    And I store the current trip number for payload validation
    And I have added myself as the traveler
    And I search for ground transport from airport "LHR" to specific address "Emirates"
    And I add the first result to trip
    And the booking status should be "Pending booking"
    And I fill ground transport contact details in cart
    And I click add payment method button
    And I select card 1 and save
    And I fill CVV with "737"
    And I proceed to checkout
    And I start intercepting the booking response
    And I complete the booking
    When I capture the "response" payload for request type "TransferzPay-by-creditcard" from Storage
    Then the captured "response" payload for request type "TransferzPay-by-creditcard" should contain the JSON, where null also matches a missing key:
      """
      {"IsSuccess":true,"result":"AUTHORISED","refusalReason":null,"HttpStatusCode":200}
      """
    And the intercepted booking response should be HTTP 200 with the "groundService" quote booked successfully
    And I successfully cancel the trip
