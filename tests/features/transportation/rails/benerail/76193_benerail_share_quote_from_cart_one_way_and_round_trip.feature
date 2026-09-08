@transportation @rails @benerail @regression @priority:critical @ado:76193
Feature: 76193 Benerail - Share quote from cart for one way and round trip
  As a corporate traveler
  I want to share a rail quote from the cart
  So that I can send Benerail options to my colleagues without errors

  Scenario: Share quote from cart succeeds for a Benerail one way trip
    Given I am logged in as "bruolisan@benerailmoovecorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I add a Benerail one way to the trip
    Then the booking status should be "Pending booking"
    When I click the share quote button
    Then I send the share and see success notification

  Scenario: Share quote from cart succeeds for a Benerail round trip
    Given I am logged in as "bruolisan@benerailmoovecorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlasc"
    And I add a Benerail round trip to the trip
    Then the booking status should be "Pending booking"
    When I click the share quote button
    Then I send the share and see success notification
