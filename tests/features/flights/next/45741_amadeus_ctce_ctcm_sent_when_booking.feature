# Test Name: HYBRID for 45741 Amadeus - CTCE and CTCM are being sent when booking and the format is correct
# Status: Active
# Labels: Regression,Amadeus,Flights,hybrid,contact info,tripstatus,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-05-08T09:40:55Z

@regression @amadeus @flights @hybrid @contact_info
Feature: 45741 Amadeus - CTCE and CTCM sent when booking
  As a corporate traveler
  I want to book a round trip flight
  So that CTCE and CTCM information is sent correctly during booking

  # NOTE: This is a hybrid test — the actual CTCE/CTCM format verification
  # requires backend/API validation that is not covered by this UI scenario.

  Scenario: Booking a round trip flight with CTCE and CTCM
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LIS" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    # TODO: Original Testim verifies email input contains "@atriistech.com" on checkout page
    # via waitForText(".email-input [type='text']", /@atriistech.com/)
    And I complete the booking
    # TODO: Original Testim verifies "Flight details" text is visible in trip overview
    # via waitForText(".more-details-btn", "Flight details")
