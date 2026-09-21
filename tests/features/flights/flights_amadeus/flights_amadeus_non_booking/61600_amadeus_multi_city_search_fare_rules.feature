@daily_flights @flights @provider:amadeus @regression @fare-rules @by-schedule @separate-tickets
Feature: 61600 Amadeus - Fare rules stay consistent from results through pricing and cart
  As a corporate traveler using Amadeus
  I want the fare rules I saw in flight results to be the same in the pricing page and in the cart
  So that I can trust the fare rules shown for each leg of a separate-ticket itinerary
  # ADO workitem Id(s) - 67305, 53277, 51111, 69758, 70183

  @priority:high
  Scenario: Fare rules extracted per leg in results match the pricing page and cart tabs
    Given I am logged in as "henry@uni.com" booking a new trip
    And I have added a random guest traveler
    When I search for a multi-city by-schedule flight with legs "FRA-DFW, DFW-BRU"
    And flight results should be available

    # --- First leg FRA-DFW: Lufthansa ---
    When I filter results by carrier "Lufthansa"
    And I click to open fare rules
    And I extract the fare rules text for the current leg
    And I close fare rules window
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible

    # --- Second leg DFW-BRU: Delta, so the itinerary is issued as separate tickets ---
    When I filter results by carrier "Delta"
    And I click to open fare rules
    And I extract the fare rules text for the current leg
    And I close fare rules window
    And I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible

    # --- Pricing page ---
    When I click to open fare rules
    Then the fare rules displayed should match leg 1 extracted from results
    When I click fare rules for the second flight leg
    Then the fare rules displayed should match leg 2 extracted from results
    When I close fare rules window
    Then the "Separated Tickets" indicator should be visible in the pricing page

    # --- Cart ---
    When I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then the fare rules displayed should match leg 1 extracted from results
    When I click fare rules for the second flight leg
    Then the fare rules displayed should match leg 2 extracted from results
    When I close fare rules window
    # Opens the trip actions menu with the retrying hover; the single hover inside the
    # cancel step alone can silently fail while the el-dropdown is still disabled.
    And I hover the trip actions menu
    Then I successfully cancel the trip
