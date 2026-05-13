# Test Name: Hybrid for 56121: Booking Details page - Booker and traveler contact info, with Pnr remark
# Status: Active
# Labels: uniglobe,Flights,contact info,Pnr Remarks,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2024-12-31T07:28:33Z
# Updated: 2025-07-25T09:48:02Z

@regression @flights @general @hybrid @checkout @contact-info
Feature: 56121 Flights - Booking details booker and traveler contact info with PNR remark
  As a corporate booker
  I want to see booker and traveler contact info on the booking details page
  So that all contact information is correctly captured with PNR remarks

  Scenario: Contact info and PNR remark are displayed in booking details
    Given I am logged in as "booker@mobile.uni" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Karoline Paxton"
    When I search for a round trip flight from "OSL" to "ZRH"
    And I add the first flight to cart
    And I proceed to checkout
    Then "Booker notification" should be displayed in the checkout page
    And "Share booker phone number with travel agency" should be displayed in the checkout page
    And "Contact details" should be displayed in the checkout page
    And the contact telephone on checkout should contain numbers
    And the booker notification phone on checkout should contain numbers
    And I uncheck contact sharing and edit the phone to "1 505 1001000"
    And I edit the contact email to "traveler@mobile.uni"
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
