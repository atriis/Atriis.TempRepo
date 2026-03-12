# Test Name: 69665 Hotels - Push Notification 'Hotel Content Source' and 'Country' filters are being correctly applied
# Description: 
# Status: Active
# Labels: Regression,Hotel,general,push notifications,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-31T03:15:07Z
# Updated: 2025-10-31T04:14:30Z

@regression @provider:general
Feature: 69665 General - Push notification displayed when adding hotel to cart
  As a corporate traveler
  I want to see a push notification when a hotel is added to my cart
  So that I receive real-time feedback on my booking actions

  @priority:medium
  Scenario: Push notification is displayed when hotel is added to cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    # TODO: Create step "Then a push notification should be displayed in hotel results" that calls DSL verifyPushNotification in HotelSearch.js
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"

