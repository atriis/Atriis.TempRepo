# Test Name: 52050 - Go Global: Book for multiple travelers, multiple rooms (with markup), FOP Invoice
# Description: 'Valladolid' can change to madrid to barcelona, can change to 6 nights instead of 10
# Status: Active
# Labels: Hotel,Go Global,Regression,Club,multi pax,Daily Hotels,66444 hotel results,2026 plan 1
# Owner: Noam Miller
# Created: 2024-10-07T02:33:42Z
# Updated: 2026-01-05T11:31:00Z

@regression @provider:goglobal
Feature: 52050 Go Global - Book for 4 travelers in 2 rooms with markup and FOP Invoice
  As a travel arranger booking Go Global hotels
  I want to book four guest travelers into two rooms and pay by invoice
  So that the marked-up price stays the same from the room results through to the confirmed booking

  @priority:critical
  Scenario: Go Global hotel booked for 4 guest travelers in 2 rooms with an unchanged marked-up price
    Given I am logged in as "ggInvoice@club.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    Then the star icon should be visible
    When I initiate a hotel search in "MAD" for 6 nights with 2 rooms
    Then the reference fields popup should show the following labels:
      | General Remark-Show on New Trip |
    When I click proceed on the reference fields popup
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    When I open the more details drawer for the 1 hotel result
    Then I should see the heading "Overview"
    And I close the open drawer
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I see that "Showing X of X Results" display a logical number of rooms that is smaller than 50 hotels
    And I click the first price breakdown button
    And I extract prices from the price breakdown
    Then the total price is price per night x 12 with tolerance
    And I close price details dialog
    When I check terms and conditions in room level
    Then the room level terms and conditions should include "Remarks"
    And I add a refundable room to my cart
    When I click more details in cart
    And I extract total for 2 rooms price in more details
    And I extract the 1 night price from rate information
    Then the total price is price per night x 12 with tolerance
    When I close more details in cart
    When I open the additional preferences extras section
    Then the additional preferences option "Request adjoining rooms" should be displayed
    And the additional preferences option "Request connected rooms" should be displayed
    And there are 3 additional preferences displayed in extras
    And I click cancel button
    Then the payment type should be "Paid by TMC"
    And I fill in the OOP justification text "abc"
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
      | Show on Checkout only when non-gds hotel |
    And exactly 1 checkout reference fields should be displayed
    When I complete the booking
    Then the booking status should be "Confirmed"
    And all quotes should have PNR codes
    When I click more details in cart
    And I extract total for 2 rooms price in more details
    And I extract the 1 night price from rate information
    Then the total price is price per night x 12 with tolerance
    And I close more details in cart
    Then the cart terms and conditions should include "Remarks"
    And I successfully cancel the trip
