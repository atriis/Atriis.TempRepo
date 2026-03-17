# Test Name: 61695 Galileo - Hotel - Hotel name and picture are displayed in share quote email
# Description: 
# Status: Active
# Labels: Galileo,Hotel,share quote,price offer,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-07T03:42:03Z
# Updated: 2025-11-26T10:22:41Z

@regression @provider:galileo
Feature: 61695 Galileo - Share quote email contains hotel name and picture
  As a corporate traveler
  I want the shared quote email to include the hotel name and photo
  So that recipients can easily identify the hotel in the shared quote

  @priority:medium
  Scenario: Share quote email includes hotel name and picture
    Given I am logged in as "edwardcullen" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Ardoe House Hotel and Spa" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click the share quote button
    Then the share quote email preview should contain the hotel name "Ardoe House Hotel and Spa"
    And the share quote email preview should contain a hotel picture

