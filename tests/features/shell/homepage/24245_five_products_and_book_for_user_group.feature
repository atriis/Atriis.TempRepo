# Test Name: 24245 MERGED user with more than 5 products see first 5 products and 3 dots in homepage + privilege can book for yourself and your user group
# Description: user with more than 5 products see first 5 products and 3 dots.
# rail - with dropdown.
# click on every product opens its search page
# Status: Active
# Labels: Homepage,No Amadeus Hotel Book,Regression,Adding Passengers,Role,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-15T06:31:01Z
# Updated: 2026-02-16T02:05:59Z

@regression @shell @homepage @merge @role
Feature: 24245 - More than five products on the homepage and booking for your user group
  As a corporate traveler with more than five products and booking privileges
  I want the first five products plus a more menu on my homepage and to book for my user group
  So that I can reach every product and add the travelers I am allowed to book for

  Scenario: A user with more than five products sees the first five products and a more menu
    Given I am logged in as "Pablo@Davidov.com"
    Then the "Flight" product should be visible on the homepage
    When I open the "Flight" product from the homepage
    Then the "Flight" search page should be displayed
    When I go back to the homepage
    Then the "Hotel" product should be visible on the homepage
    When I open the "Hotel" product from the homepage
    Then the "Hotel" search page should be displayed
    When I go back to the homepage
    Then the "Car" product should be visible on the homepage
    When I open the "Car" product from the homepage
    Then the "Car" search page should be displayed
    When I go back to the homepage
    Then the "Rail" product should be visible on the homepage
    When I open the "Rail" product from the homepage
    Then the "Rail" search page should be displayed
    When I go back to the homepage
    Then the "Transport" product should be visible on the homepage
    When I open the "Transport" product from the homepage
    Then the "Transport" search page should be displayed
    When I go back to the homepage
    Then the more products button should be visible on the homepage
    When I open the "Parking" product from the homepage
    Then the "Parking" search page should be displayed
    When I go back to the homepage
    Then the more products button should be visible on the homepage
    When I open the "Manual Quote" product from the homepage
    Then the "Manual Quote" search page should be displayed
    When I book a new trip
    And I have added traveler by name "mali cohen"
    And I have added traveler by name "pablo davidov"
    Then the traveler "shani cohen" should not be available to add
