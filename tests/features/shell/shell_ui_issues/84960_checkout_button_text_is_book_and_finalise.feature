# Test Name: 84960 Checkout - Button text is "Book and Finalise"
# Description:
# Status: Active
# Labels: Regression,UI,Hotel,checkout
# Owner: Bruna Santos
# Created: 2026-09-18

# ADO Test Case ID: 84960

@regression @shell @hotels
Feature: 84960 - Checkout button text is "Book and Finalise"
  As a corporate traveler
  I want the checkout finalize button to read "Book and Finalise"
  So that I know the quote books directly and is not sent for approval

  @priority:medium
  Scenario: The finalize button reads "Book and Finalise" at checkout
    Given I am logged in as "lidi@ratehawk.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the finalize button should read "Book and Finalise"
