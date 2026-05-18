# Test Name: 69869 Fusion - Cart - Paid baggage are correctly displayed in Flight Details and Price Breakdown
# Status: Active
# Labels: Regression,Fusion,Flights,baggage,price breakdown,Flight Details,Cart,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-06T01:16:18Z
# Updated: 2025-11-12T03:07:12Z

@regression @flights @fusion @baggage @price-breakdown @priority:high
Feature: 69869 Fusion - Paid baggage correctly displayed in Flight Details and Price Breakdown
  As a corporate traveler adding paid baggage to a Fusion flight
  I want the paid baggage to be displayed correctly in Flight Details and Price Breakdown
  So that the cart reflects the baggage cost in all displays

  Scenario: Paid baggage is displayed in Flight Details and Price Breakdown on Fusion flight
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "KWI" to "DEL"
    Then flight results should be available
    # TODO: implement 'I filter results by stops option "No stops"' — see Filter_by_any_option_in_results_page('No stops') in Testim source (test 69869)
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'I add a paid baggage to the cart' — see Adding_paid_babbage() in Testim source (test 69869)
    # TODO: implement 'the paid baggage should be displayed correctly in Flight Details' — see Baggage_displayed_correctly_Flight_Details() in Testim source (test 69869)
    # TODO: implement 'the paid baggage should be displayed correctly in Price Breakdown' — see Baggage_is_displayed_correctly_Price_Breakdown() in Testim source (test 69869)
