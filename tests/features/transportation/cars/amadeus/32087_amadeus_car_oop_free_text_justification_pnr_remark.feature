# Test Name: 32087 PNR remark for car justification (free text)
# Description: Book an out-of-policy Amadeus car with a free-text justification and verify the
#   "oop remark for car (product)" remark reaches the PNR with an empty value, the typed text and status Y
# Status: Active
# ADO Test Case: 32087
# Created: 2026-10-07

@regression @transportation @cars @provider:amadeus @oop @pnr_remark @ado:32087
Feature: 32087 Amadeus car - OOP free-text justification is sent as a PNR remark
  As a TMC
  I want the free-text justification of an out-of-policy car to be written to the PNR
  So that the agency can see why the traveler booked outside the policy

  @priority:high
  Scenario: Free-text car justification is sent in the OOP remark for car with an empty value and status Y
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "Rami Pinaroop"
    When I initiate a car search at "LHR"
    # testim corp nl asks for the new trip reference fields; the mandatory one comes prefilled
    And I click proceed button if visible
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And the out of policy indicator should be visible in cart
    When I fill in the OOP justification text "AUTO 32087 FREE TEXT"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # Cancel before the payload check so a failed assertion never leaves a live booking behind
    And I successfully cancel the trip
    # The remark template is "oop remark for car (product): value- {carjustificationValue}, text- {carjustificationtext},
    # status- {OutOfPolicy_Car}"; a free-text justification has no administration value, so VALUE- stays empty
    When I capture the "request" payload for request type "Amadeus4.PNR_AddMultiElements" from Storage
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "OOP REMARK FOR CAR (PRODUCT): VALUE-, TEXT-AUTO 32087 FREE TEXT, STATUS-Y"
