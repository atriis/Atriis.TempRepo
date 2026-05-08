@transportation @cars @regression @provider:galileo
Feature: Galileo - Cars - PrePaid and Pay on Departure payment options

  As a traveler
  I want to book cars with different payment methods
  So that I can choose the payment option that suits me

  Scenario: Book Galileo car with PrePaid, cancel, and rebook with Pay on Departure
    Given I am logged in as "ruimariano"
    When I book a new trip
    And I add myself as the traveler
    And I search for available cars
    Then the first car should display "Pre paid" payment method
    When I add the first car to cart
    Then the cart should show "Pre paid" payment method
    And I fill in free text justification if needed
    And I accept and proceed to checkout
    And I book and finalize the trip
    Then the confirmation page should display "Pre paid" payment method
    When I cancel the trip
    And I click on the new trip button
    And I add myself as the traveler
    And I search for available cars again
    Then the first car should display "Pre paid" payment method
    When I add the first car to cart
    Then the cart should show "Pay On Departure" payment method
    And I fill in free text justification if needed
    And I accept and proceed to checkout
    And I book and finalize the trip
    Then the confirmation page should display "Pay On Departure" payment method
