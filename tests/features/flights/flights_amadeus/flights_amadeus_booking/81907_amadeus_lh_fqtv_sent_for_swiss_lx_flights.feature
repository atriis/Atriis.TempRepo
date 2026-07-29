# ADO Bug #75156 - Amadeus - FQTV - LH FQTV not being sent for LX flights
# Regression: When a traveler has a Lufthansa (LH) frequent flyer number and books a Swiss (LX)
# flight (same alliance, Miles & More), the FQTV must still be attached to the booking. The
# alliance-matching logic previously remembered only one alliance per airline and could silently
# lose a valid match for airlines belonging to more than one alliance.
## Fixed in: Backend (IAllianceRepository / AllianceRepository / AmadeusQuoteEngine / AmadeusFlightBookingEngine)
# For this user LX is in Star Alliance and also in Miles and More, and LH is only in Miles and More

@regression @flights @amadeus @fqtv @hybrid @bug:75156 @ado:75156
Feature: 81907 Amadeus - LH frequent flyer number is sent for Swiss (LX) flights (same alliance)
  As a corporate traveler with a Lufthansa frequent flyer number
  I want my frequent flyer number to be applied when booking a Swiss (LX) flight
  So that I earn miles even when booking an alliance partner airline

  @priority:high
  Scenario: LH frequent flyer number is retained when booking a Swiss (LX) flight
    Given I am logged in as "lhFF@amadeus.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ZRH" to "EWR" with preferred carrier "LX"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click frequent flyer in extras
    Then the FQTV should show "LH"
    And I accept Terms & Conditions
    When I hold the trip
    Then the booking status should be "On Hold"
    When I capture the "request" payload for request type "Amadeus4.PNR_AddMultiElements" from Storage
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "932932932932"
    Then I successfully cancel the trip
