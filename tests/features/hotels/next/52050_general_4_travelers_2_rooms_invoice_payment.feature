# Test Name: 52050 - Go Global: Book for multiple travelers, multiple rooms (with markup), FOP Invoice
# Description: 'Valladolid' - can change to madrid to barcelona, can change to 6 nights instead of 10
# Status: Active
# Labels: Hotel,Go Global,Regression,Club,multi pax,Daily Hotels,66444 hotel results,2026 plan 1
# Owner: Noam Miller
# Created: 2024-10-07T02:33:42Z
# Updated: 2026-01-05T11:31:00Z

@regression @provider:general
Feature: 52050 General - Book hotel for 4 travelers in 2 rooms with invoice payment
  As a travel arranger
  I want to book a hotel for 4 travelers in 2 rooms using an invoice payment method
  So that corporate group bookings can be made with proper invoicing

  @priority:critical
  Scenario: 4 travelers book 2 hotel rooms with invoice payment method
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add {int} additional travelers by name" for 3 more travelers
    # TODO: Create step "When I search for a hotel in {string} for {int} nights and {int} rooms" that calls DSL searchHotelMultiRoom in HotelSearch.js
    When I search for a hotel in "Madrid" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    # TODO: Create step "Then {int} rooms should be in the cart" that calls DSL verifyRoomCount in Cart.js
    # TODO: Create step "When I select invoice as the payment method" that calls DSL selectInvoicePayment in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"

