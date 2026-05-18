# Test Name: 63941 Fusion - Brand info displayed in results and cart pages, flight extras available in cart
# Status: Active
# Labels: Fusion,NL government,Branded fares,Regression,Low cost,Pricing Options,2026 plan 2
# Owner: Noam Miller
# Created: 2025-06-30T09:37:56Z
# Updated: 2025-10-14T02:57:01Z

@regression @flights @fusion @branded-fares @pricing-options @full-purchase @priority:high
Feature: 63941 Fusion - Brand info displayed in results and cart, flight extras available in cart
  As a corporate traveler booking a Fusion flight with branded fares
  I want brand info shown in results, pricing options, and cart
  So that I can compare branded fares and select flight extras

  Scenario: Branded fare info displayed in results, pricing options, and cart after booking
    Given I am logged in as "fusion@50687.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "GVA"
    # TODO: implement 'the branded fares should be displayed in flight details on results page' — see Flight___Branded_Fares____Flight_details__results_page() in Testim source (test 63941)
    # TODO: implement 'the branded fares should be displayed in pricing options and Flight Details options' — see Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options() in Testim source (test 63941)
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'the branded fares should be displayed in flight details on the cart page' — see Flight___Branded_Fares____Flight_details__cart_page() in Testim source (test 63941)
    # TODO: implement 'optional services should be displayed in cart' — see Optional_Services_displayed() in Testim source (test 63941)
    When I fill credit card cvv if needed
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    When I proceed to checkout and handle Fusion verification
    # TODO: implement 'the trip overview should display flight details' — see Flights___Trip_Overview___Wait_for__Flight_details__text_display() in Testim source (test 63941)
    # TODO: implement 'the branded fares should still be displayed in flight details on the cart page after booking' — see Flight___Branded_Fares____Flight_details__cart_page() in Testim source (test 63941)
