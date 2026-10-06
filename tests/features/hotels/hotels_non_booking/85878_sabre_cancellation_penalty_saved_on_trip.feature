# Test Name: 85878 Sabre - Hotel - Cancellation penalty returned by Sabre is saved on the trip
# Status: Active
# Labels: Hotel,Sabre,Cancellation policy,payload,Bug 84260
# Owner: Yael Alef
# Created: 2026-10-04

# ADO Test Case ID: 85878
# ADO workitem ID: 84260 (Bug)
#
# Sabre HotelPriceCheck returns the structured CancelPenalty and, as free text in the room's
# AdditionalDetail Code 7 "Cancellation information", the cut-off time and the penalty
# (e.g. "Cancel by 12.00am on 28th December, else 1 night fee"). The trip saves only the composed
# "Cancellation allowed <date> prior to arrival", so the penalty is lost (staging trip 3913707).
# The hotel More details drawer renders the policy saved on the trip (HotelQuoteDetails), so it
# must carry every Code 7 line. Fails until Bug 84260 is fixed.
#
# Test data: sabrin@orly.com (Sabre PCC MZ3LCLUB). On dev "Zurich Switzerland" resolves to
# Hampton Inn Sierra Vista, whose refundable rate carries a Code 7 penalty.
@ado:84260 @tc:85878 @regression @hotels @provider:sabre @payload
Feature: 85878 Sabre - Hotel - Cancellation penalty returned by Sabre is saved on the trip

  @priority:high
  Scenario: The cancellation information Sabre returned is saved on the trip
    Given I am logged in as "sabrin@orly.com" booking a new trip
    And I click proceed button if visible
    And I have added myself as the traveler
    When I search for a hotel in "Zurich Switzerland" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I capture the "response" payload for request type "HotelPriceCheck" from Storage
    And I click more details in cart
    Then the more details should show the Sabre cancellation information from the captured HotelPriceCheck response
