# Test Name: 73601 Meal plan type is translated to German in itinerary email
# Description: 
# Status: Active
# Labels: Share Itinerary,Language,Cart,Hotel,breakfast,Regression,Email
# Owner: Shani Hadar
# Created: 2026-02-11T01:52:00Z
# Updated: 2026-02-11T02:26:59Z

@regression @provider:general
Feature: 73601 General - Meal plan translated to German in share itinerary
  As a corporate traveler
  I want to share my itinerary and see meal plan information translated to German
  So that international travelers receive the itinerary in their preferred language

  @priority:medium
  Scenario: Meal plan is translated to German in the shared hotel itinerary
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I filter room results by breakfast included" that calls DSL filterRoomsByBreakfast in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click the share itinerary button
    And I send the share
    # TODO: Create step "Then the meal plan in the shared itinerary should be shown in German" that calls DSL verifyMealPlanTranslationGerman in Share.js

