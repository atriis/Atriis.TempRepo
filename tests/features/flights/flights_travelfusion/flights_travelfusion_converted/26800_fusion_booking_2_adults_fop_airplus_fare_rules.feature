# Test Name: 26800 Fusion - Booking for 2 adults, with FOP AirPlus, fare rules displayed in results, cart, after checkout
# Status: Active
# Labels: Fusion,Flights,Regression,FOP,Adding Passengers,No Amadeus Hotel Book,Fare Rules,Pre Prod,Keeps failing,FailedFusion,2026 plan 1
# Owner: Noam Miller
# Created: 2023-06-29T03:44:40Z
# Updated: 2025-10-01T08:12:27Z

@regression @flights @fusion @full-purchase @fop @fare-rules @priority:critical
Feature: 26800 Fusion - Booking for 2 adults with FOP AirPlus and fare rules display
  As a corporate traveler booking a Fusion low-cost flight for 2 adults with AirPlus FOP
  I want fare rules to be visible in results, cart, and after checkout
  So that I can verify fare conditions throughout the booking flow

  Scenario: Book 2 adults on Fusion with AirPlus FOP and verify fare rules in results, cart, and after booking
    Given I am logged in as "fusion@airplus.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "LGW" to "MXP"
    # TODO: implement 'I open and verify fare rules in the first flight result' — see Fare_rules_in_results_page() in Testim source (test 26800)
    And I add the first flight to cart
    # TODO: implement 'I open and verify fare rules in cart' — see Fare_rules_in_cart() in Testim source (test 26800)
    And I fill credit card cvv if needed
    And I proceed to checkout
    When I proceed to checkout and handle Fusion verification
    # TODO: implement 'I open and verify fare rules in cart after booking is completed' — see Fare_rules_in_cart__after_booking_completed() in Testim source (test 26800)
