# Test Name: HYBRID for 55673 Flights - For user without privilege 'Can edit and view profile for other users', mask traveler's FF
# Status: Active
# Labels: Flights,Frequent flyer,Cart,hybrid,Regression,No Amadeus Hotel Book,Role,Privileges,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-01-27T01:46:01Z
# Updated: 2026-02-16T11:04:56Z

@regression @flights @general @hybrid @fqtv @privileges
Feature: 55673 Flights - Mask travelers FF for user without privilege
  As the system
  I want to mask frequent flyer numbers for users without the profile viewing privilege
  So that traveler privacy is maintained

  Scenario: FF is masked for traveler when booker lacks privilege
    Given I am logged in as "booker_cantsee" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added traveler by name "Annie Massk"
    When I search for a round trip flight from "CLT" to "LGA"
    And I filter airline results by "AA" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 1
    Then the FQTV should show "AA-******299" for "Annie Massk"
    Then the FQTV should show "AA - 123456" for "Rebecca Cantsee"
    When I add loyalty number "123450555" using the first available airline for traveler tab 2
    Then the FQTV should show "******555" for traveler tab 2