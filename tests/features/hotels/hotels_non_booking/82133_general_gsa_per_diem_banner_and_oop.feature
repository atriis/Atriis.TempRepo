# Test Name: 82133 GSA policy appears correctly
# Description: The corporate GSA per diem policy (user Paul@Ecy.com, Gray Dawes / AAA TESTIM) applies a nightly lodging limit read from the GSA file for the searched city and check-in month. The limit banner must appear at hotel level and room level, and the out of policy indicator must appear on exactly those results priced above that limit.
# Status: Design
# Labels: Hotel,Regression,Travel policy,GSA,OOP
# Owner: Shani Hadar

# ADO Test Case ID: 82133
@ado:82133
@regression @hotels
Feature: 82133 Hotels - GSA per diem policy appears correctly
  As a corporate traveler subject to a GSA per diem policy
  I want the GSA lodging limit banner and the out of policy indicators to reflect my check-in month allowance
  So that I can tell which hotels and rooms exceed the allowance before I book

  @priority:high
  Scenario: GSA lodging limit banner and out of policy indicators match the check-in month allowance
    Given I am logged in as "Paul@Ecy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Tallahassee" for 1 night
    And I wait to see view rates text in results page
    And I extract the GSA nightly lodging limit for the searched check-in month
    Then the GSA lodging limit banner should be displayed in hotel results
    Then every hotel priced above the GSA nightly lodging limit should be out of policy
    Then no hotel priced below the GSA nightly lodging limit should be out of policy
    Then the out of policy tooltip in hotel results should quote the GSA nightly lodging limit
    # A hotel card shows the price of its cheapest room, so the hotel closest below the limit
    # always has rooms under it and usually rooms over it too — both room checks run there.
    # If that hotel turns out to have no room over the limit, the out of policy check falls
    # back to the hotel priced closest above the limit on its own.
    When I select the hotel priced closest below the GSA nightly lodging limit
    # The filter panel is built from the loaded room set, so it only appears once every room
    # has rendered — waiting for it stops the checks below reading a partial room list.
    And I see room level filter sections
    Then the GSA lodging limit banner should be displayed in room level results
    Then no room priced below the GSA nightly lodging limit should be out of policy
    Then every room priced above the GSA nightly lodging limit should be out of policy
    Then the out of policy tooltip in room level results should quote the GSA nightly lodging limit
