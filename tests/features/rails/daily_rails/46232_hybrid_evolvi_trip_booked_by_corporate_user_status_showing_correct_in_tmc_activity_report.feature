@regression @provider:evolvi
Feature: HYBRID for 46232 Evolvi - Trip booked by corporate user, status showing correct in TMC activity report
  As a corporate traveler
  I want to search and add Evolvi UK Rail trains to my cart
  So that I can review UK rail options before booking

  @priority:critical
  Scenario: Evolvi - Trip booked by corporate user, status showing correct in TMC activity report
    Given I am logged in as "jimmorrison@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I select default delivery method and save
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
