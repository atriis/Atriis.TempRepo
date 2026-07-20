@regression @provider:ehotel @ado-75354
Feature: 75354 eHotel — Supplier details (PIN code, Confirmation Number, Contact Phone) visible in cart

  As an online corporate traveler
  I want to see the eHotel supplier details in the cart after booking
  So that I have the PIN code and confirmation information readily available

  @priority:high
  Scenario: eHotel PIN code is visible in cart after booking
    Given I am logged in as "eli@tel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add a refundable room to my cart
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then the hotel booking should display a pin code
    Then I successfully cancel the trip
 

