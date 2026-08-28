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
    # TODO: Create step "When I initiate a hotel search in {string} for {int} night(s) with {int} rooms"
    # Testim: Search_hotel__2_rooms('madrid') - sets the rooms dropdown to 2, then clicks Search while
    # the reference-fields popup still has to be handled, so the blocking searchHotelMultiRoom (which
    # waits for the results URL) cannot be used here.
    # Broaden HotelSearch.initiateHotelSearch in src/dsl/HotelSearch.js to accept options.rooms and
    # reuse HotelSearchPage.openRoomsDropdown / selectRoomCount before typing the destination.
    When I initiate a hotel search in "Madrid" for 6 nights with 2 rooms
    Then the reference fields popup should show the following labels:
      | General Remark-Show on New Trip |
    When I click proceed on the reference fields popup
    And I wait for hotel results to load
    # TODO: Create step "When I open the more details drawer for hotel result at index {int}"
    # Testim: click ".hotel-list > :nth-child(2) .more-details-btn" - add a HotelLevelResults DSL
    # method that calls the existing HotelLevelResultsPage.clickMoreDetailsByIndex(index).
    When I open the more details drawer for hotel result at index 2
    Then I should see the heading "Overview"
    # TODO: Create step "Then the hotel amenities section should be visible"
    # Testim: isVisible(".hotel-amenities") - assert HotelLevelResultsPage SELECTORS.HOTEL_AMENITIES
    # via a new HotelLevelResults DSL method.
    And the hotel amenities section should be visible
    # TODO: Create step "When I view the rates from the hotel details drawer"
    # Testim: click ".hotel-drawer-preview .btn" - the drawer's own View rates button, which is not
    # the hotel card button that HotelLevelResultsPage.clickViewRatesByIndex clicks.
    When I view the rates from the hotel details drawer
    Then text "Overview" should be visible
    When I wait for the first add to trip button to be visible in room level results
    And I extract the price from room level results
    And I click the first price breakdown button
    And I extract prices from the price breakdown
    Then the room level price should match the price breakdown total
    When I close price details dialog
    And I add the first available room to my cart
    Then the room level terms and conditions should include "Remarks"
    When I add the first room to my cart from the terms and conditions dialog
    Then the booking status should be "Pending booking"
    When I click more details in cart
    And I save the current cart price as the pre-booking price
    # TODO: Create step "Then the per night price in more details should match the price breakdown night price"
    # Testim: waitForText(".gray-section > :nth-child(1) .amount", perNight) - compares the cart
    # more-details per-night amount against the night price captured at room level. Read the stored
    # price-breakdown nightPrice (RoomLevelResults.extractPriceBreakdownValues) and compare it with a
    # new Cart DSL method reading the more-details per-night row.
    Then the per night price in more details should match the price breakdown night price
    When I close more details in cart
    # TODO: Create step "When I open the additional preferences extras section"
    # Testim: click ".extras-container > :nth-child(2) > :nth-child(2) .is-clickable" - the Additional
    # preferences extras row, which only renders when more than one room is booked. Scope it to the
    # section by title rather than reusing the index-based CartPage.clickEditExtrasButton.
    When I open the additional preferences extras section
    # TODO: Create step "Then the additional preferences option {string} should be displayed"
    # Testim: waitForText on the two ".extras-collapse-container" checkbox labels.
    Then the additional preferences option "Request adjoining rooms" should be displayed
    And the additional preferences option "Request connected rooms" should be displayed
    # TODO: Create step "When I close the additional preferences extras section"
    # Testim: click "[id='pane-overview'] .btn--default" - the section's own close/cancel button.
    When I close the additional preferences extras section
    Then the payment type should be "Paid by TMC"
    # TODO: Create step "When I fill in the OOP justification if the quote is out of policy"
    # Testim: Fill_free_text_justification_in_cart_if_needed() - types 'abc' only when ".oop-title"
    # reads Out of policy, then saves only when the "Please save your justification" help text shows.
    # Reuse Cart.fillOopJustificationText behind the two conditions.
    When I fill in the OOP justification if the quote is out of policy
    And I accept Terms & Conditions
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
      | Show on Checkout only when non-gds hotel |
    When I complete the booking
    Then the booking status should be "Confirmed"
    And all quotes should have PNR codes
    When I click more details in cart
    Then the per night price in more details should match the price breakdown night price
    And the price in more details should match the price in cart
    When I close more details in cart
    Then the price in cart should match the pre-booking price
    When I click on the terms and conditions link in the cart
    # TODO: Create step "Then the cart terms and conditions should be displayed"
    # Testim: isVisible(".app-terms-conditions > :nth-child(1) .terms") - visibility only, no text,
    # so the existing "the cart terms and conditions should include {string}" does not fit.
    Then the cart terms and conditions should be displayed
    When I close the open drawer
    And I open the trip cancellation from the trip actions menu
    Then text "You are about to cancel all items in your trip." should be visible
    And I confirm the trip cancellation successfully
