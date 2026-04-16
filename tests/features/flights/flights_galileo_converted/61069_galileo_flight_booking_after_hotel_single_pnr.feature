# Test Name: 61069 Galileo - Flight booking successful when added after a hotel/car is already booked (single pnr permission)
# Status: Active
# Labels: Galileo,Gray Dawes,Flights,Hotel,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-17T07:31:12Z
# Updated: 2025-09-14T10:46:00Z

@regression @galileo @flights @hotel @single_pnr
Feature: 61069 Galileo - Flight booking after hotel booked with single PNR

  As a corporate traveler
  I want to book a flight after a hotel is already booked
  So that both products share a single PNR

  Scenario: Flight added after hotel booking creates single PNR
    Given I am logged in as "carcorp" booking a new trip
    And I have added a random guest traveler
    # TODO: Hotel search and booking flow — complex multi-domain scenario:
    # 1. Search hotel 1 night in "VIE"
    # 2. Wait for "View rates" in results
    # 3. Add hotel from search results to cart (includes refundable filter, room selection)
    # 4. Book hotel (accept T&C, proceed, book)
    # 5. Search flights from cart (click add flight from cart)
    # 6. Add flight to cart, proceed, book
    # 7. Verify single PNR in trip overview
    # 8. Cancel trip
    # This test crosses hotel and flight domains — needs careful step composition
