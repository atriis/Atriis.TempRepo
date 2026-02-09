@regression @provider:amadeus @user:user_three
Feature: Add Flight to Cart with Credit Card Payment
  As a corporate traveler
  I want to add a flight to my cart and add a credit card payment method
  So that I can complete my booking with payment

  @priority:critical
  Scenario: Add one-way flight to cart with credit card payment
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "lhrToMad"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    Then the payment method should be added
