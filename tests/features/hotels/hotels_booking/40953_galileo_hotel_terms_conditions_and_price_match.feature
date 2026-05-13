# Test Name: 40953 [Merge] Galileo - Hotel - Check "Terms and Conditions" are displayed, price does not change before and after booking
# Description: 
# Status: Active
# Labels: Regression,Galileo,Gray Dawes,Hotel,Full Purchase,Pre Prod,Sanity,Terms and Conditions,merge,price,Check price,Daily Hotels,progress page,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-07T05:36:46Z
# Updated: 2025-11-10T03:12:15Z

@regression @provider:galileo
Feature: 40953 Galileo - Book hotel with terms and conditions and price verification
  As a corporate traveler using Galileo
  I want to check terms and conditions in room level and cart and verify prices match
  So that I can confirm the booking terms and ensure price consistency

  @priority:critical
  Scenario: Terms and conditions are accessible in room level and cart, and price matches after booking
    Given I am logged in as "gal@leo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    When I check terms and conditions in room level
    Then terms and conditions are displayed
    And I extract the price from room level results
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I extract the hotel quote price from cart
    And I save the current cart price as the pre-booking price
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I extract the hotel quote price from cart
    Then the price in cart should match the pre-booking price
    Then I successfully cancel the trip with 60 seconds wait

