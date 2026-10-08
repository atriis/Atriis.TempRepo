# Test Name: Booking Details page - Booker and traveler contact info, with Pnr remark (CTCE/CTCM)*
# Status: Active
# Labels: uniglobe,Flights,contact info,Pnr Remarks,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2024-12-31T07:28:33Z
# Updated: 2026-10-08

@regression @flights @general @amadeus @checkout @contact-info
Feature: 56121 Booking Details page - Booker and traveler contact info, with Pnr remark (CTCE/CTCM)
  As a corporate booker
  I want to see booker and traveler contact info on the booking details page
  So that the primary traveler contact (CTCE/CTCM) and the booker contact remark reach the PNR

  Scenario: Contact info is shown in booking details and sent to the PNR
    Given I am logged in as "booker@contact.amscorp" booking a new trip
    And I have added a random guest traveler
    And I note the email and phone of the last added guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "ZRH" to "SAN"
    And I add the first flight to cart
    And the booking status is "Pending booking"
    And I accept Terms & Conditions
    And I proceed to checkout
    And I wait for booking details in checkout
    Then "Booker notification" should be displayed in the checkout page
    And the booker notification phone on checkout should contain numbers
    And "Contact details" should be displayed in the checkout page
    And the contact telephone on checkout should contain numbers
    And the contact details checkbox should be unchecked
    When I complete the booking
    Then the booking status should be "Finalising"
    # PNR remarks are sent after the booking completes
    When I wait for 45 seconds
    And I capture the "request" payload for request type "Amadeus4.PNR_AddMultiElements" from Storage
    Then the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "{notedGuestCtceEmail}"
    And the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "{notedGuestCtcmPhone}"
    And the captured "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain "53447-BOOKER CONTACT INFO-1-314-4044000"
