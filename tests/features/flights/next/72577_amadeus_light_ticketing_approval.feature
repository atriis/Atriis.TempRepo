# Test Name: 72577: Amadeus Light Ticketing - Booking is ticketed when sent for approval
# Description:
# Status: Active
# Labels: Amadeus Light Ticketing,Approval flow,Amsalem,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-18T02:24:29Z
# Updated: 2026-01-19T12:53:05Z

@regression @flights @amadeus @light-ticketing @approval
Feature: 72577 Amadeus Light Ticketing - Booking ticketed on approval
  As a corporate traveler
  I want my light ticketing booking to be ticketed when sent for approval
  So that the booking is automatically ticketed after approval flow

  Scenario: Ryanair booking is ticketed when sent for approval
    Given I am logged in as "ryanair_ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "CPH"
    And I filter results by carrier "FR"
    And I add the first flight to cart
    # TODO: Checkout and send for approval
    # Testim flow: fills CVV field → accepts T&C → clicks "Proceed to Checkout" →
    # verifies "Contact details" text → clicks finalize/book button →
    # verifies success message "Your order has been booked and sent to your approver for approval"
    # Need new step: When I send the booking for approval
    # Or extend Checkout.bookAndFinalize to handle approval flow
    # TODO: Validate quote shows "Ticketing Complete"
    # Testim: clicks "Go to trip" → verifies ".app-label" shows "Ticketing Complete"
    # Need new step: Then the booking status should be "Ticketing Complete"
    # Existing step can be reused: Then the booking status should be "Ticketing Complete"
