@daily_shell
Feature: 61567 FOP - When adding a new credit card and navigating back to the payment options page, existing saved cards are displayed
  As a corporate traveler 
  I want to search for flight and add it to cart
  So when I click to add a new credit card and navigate back to the payment options page 
  I can see existing saved cards displayed

  @priority:critical
  Scenario: When adding a new credit card and navigating back to the payment options page, existing saved cards are displayed
    Given I am logged in as "harrypotter@ccnotdefault.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "BRU"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "visa (not default)" should be visible
    When I click add card details button
    Then the card details text should be visible
    When I click the back arrow
    Then the card "visa (not default)" should be visible