@regression @hotels @breakfast @provider:premierinn
Feature: 85877 Premier Inn - Book hotel with breakfast
  As a corporate user I want to book a Premier Inn hotel with breakfast

  @priority:critical
  Scenario: Premier Inn hotel booked with breakfast and prices are correct
    Given I am logged in as "perry@mien.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I extract the total price of quote 1
    When I add Premier Inn Extras Services in cart
    And I choose the first Premier Inn breakfast in cart
    And I extract the Premier Inn breakfast price
    And I save Premier Inn Extras Services in cart
    When I extract the total price of quote 1
    Then the sum of extracted prices at index 0 and 1 should equal the extracted price at index 2
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the total price of quote 1
    Then the extracted price at index 2 should equal the extracted price at index 3 within tolerance
    Then I successfully cancel the trip
