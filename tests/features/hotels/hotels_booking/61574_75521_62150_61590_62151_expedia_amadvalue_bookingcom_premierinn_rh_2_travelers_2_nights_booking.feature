# Test Name: 61574 expedia hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Regression,Hotel,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,Expedia,progress page,66444 hotel results,Pre Prod,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T06:20:12Z
# Updated: 2026-02-09T12:54:32Z

# Test Name: 61579 Sabre hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Regression,Hotel,Full Purchase,more than 1 night,multi pax,Daily Hotels,Sabre,No Amadeus Hotel Book,progress page,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T09:19:04Z
# Updated: 2026-02-09T12:53:23Z

# Test Name: 61575 Amadeus GDS hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Regression,Hotel,Full Purchase,more than 1 night,multi pax,Daily Hotels,Amadeus,progress page,66444 hotel results,Pre Prod,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T07:05:40Z
# Updated: 2026-02-09T12:53:28Z

# Test Name: 73521 amadeus value hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,multi pax,Amadeus Value hotel,Regression
# Owner: Shani Hadar
# Created: 2025-05-04T01:13:40Z
# Updated: 2026-02-09T12:35:42Z

@regression 
Feature: Book hotel for 2 travelers 2 nights - Expedia, Amadeus Value, Booking.com, Premier Inn & Ratehawk
  As a travel arranger
  I want to book a hotel for 2 travelers for 2 nights
  So that both travelers are accommodated in the same booking

  @priority:critical
  Scenario Outline: 2 travelers booked in hotel for 2 nights
    Given I am logged in as "<label>" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a hotel in "Amsterdam" for 2 nights
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the cart should show 2 rooms badge
    And I fill credit card cvv if needed
    When I extract the price at index 0 from "cart"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    Then I successfully cancel the trip

    Examples:
      | label                            |
      | expedia@only.corp                |
      | papatinhosantos@amadeusvalue.com  |
      | rebecca@cardin.com               |
      | brunasantosnl@premierinn.com     |
      | lidi@ratehawk.com                | 
