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
    # TODO: implement 'the {string} product should be visible on the homepage' — assert the named product tile is visible on the homepage carousel
    Then the "Flight" product should be visible on the homepage
    # TODO: implement 'I open the {string} product from the homepage' — click the named product tile (handling any hover/dropdown) to open its search page
    When I open the "Flight" product from the homepage
    # TODO: implement 'the {string} search page should be displayed' — assert the named product's search page opened
    Then the "Flight" search page should be displayed
    # TODO: implement 'I go back to the homepage' — click the Home Page icon to return to the homepage
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
    # TODO: implement 'the more products button should be visible on the homepage' — assert the "more_horiz" more-products button is visible
    Then the more products button should be visible on the homepage
    When I open the "Parking" product from the homepage
    Then the "Parking" search page should be displayed
    When I go back to the homepage
    Then the more products button should be visible on the homepage
    When I open the "Manual Quote" product from the homepage
    Then the "Manual Quote" search page should be displayed

  Scenario: A privileged user can book for themselves and their user group
    Given I am logged in as "Pablo@Davidov.com"
    When I book a new trip
    And I add a traveler by name "mali cohen" from the search autocomplete
    And I click add traveller
    # TODO: implement 'I add a user group traveler by name {string}' — add an additional user-group traveler via the Add traveller dialog
    And I add a user group traveler by name "pablo davidov"
    And I click add traveller
    And I add a user group traveler by name "shani cohen"
    # TODO: implement 'the traveler {string} should not be available to add' — Testim 'negative-element-validation': assert the traveler cannot be added
    Then the traveler "shani cohen" should not be available to add
    # TODO: implement 'I close the add traveller dialog' — close the Add traveller dialog
    When I close the add traveller dialog
