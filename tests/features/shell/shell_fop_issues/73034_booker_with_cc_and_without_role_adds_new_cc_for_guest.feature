@regression @cars @fop @credit-card
Feature: 73034 Booker with CC and without role- adds new CC for guest
  As a traveler booking a car for a guest and without role
  I want to be able to add new credit card for guest

  @priority:medium
  Scenario: Booker with CC and without role- adds new CC for guest
    Given I am logged in as "Personal@cc.ccc" booking a new trip
    And I have added a random guest traveler with name "israel" "israeli"
    When I search for a car at "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "4580" should be visible
    When I click add card details button
    Then the expiration date field should be displayed
