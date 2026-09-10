# Test Name: 69665 Hotels - Push Notification 'Hotel Content Source' and 'Country' filters are being correctly applied
# Description: 
# Status: Active
# Labels: Regression,Hotel,general,push notifications,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-31T03:15:07Z
# Updated: 2025-10-31T04:14:30Z

@regression @provider:general
Feature: 69665 Hotels - Push Notification  'Hotel Content Source' and 'Country' filters are being correctly applied
  As a corporate traveler
  I want to see a push notification when a hotel is added to my cart
  So that I receive real-time feedback on my booking actions

  @priority:medium
  Scenario: Push Notification  'Hotel Content Source' and 'Country' filters are being correctly applied
    Given I am logged in as "sammau@pushnotifications.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then I should see mandatory notifications with message "TESTIM Test"
    When I acknowledge the push notification
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "Rome, Italy" for 1 night from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the mandatory notifications popup should not be displayed
