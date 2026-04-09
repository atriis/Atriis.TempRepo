# Test Name: 53357 Sabre car - agreement with customer id number
# Labels: TLC, Cars, Regression, Agreement, Full Purchase, hybrid, progress page
# Owner: Shani Hadar
# Created: 2024-10-22T06:41:03Z
# Updated: 2024-10-22T07:12:52Z

@regression @cars @sabre @agreement @full-purchase @hybrid
Feature: 53357 Sabre car agreement customer ID booking

  As a Sabre traveler with customer ID agreement
  I want to complete a car booking with agreement pricing
  So that my rental is booked with the agreed rate

  Background:
    Given I am logged in as "tree" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Book Sabre car with customer ID agreement
    When I have selected a national rental agency
    And I search for a car at "LHR"
    # TODO: Complete Chris Tree reference fields
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And I fill free text justification if needed
    When I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete Chris Tree reference fields on checkout
    And I complete the booking
    Then the booking confirmation should show "Confirmed"
    When I cancel the trip
    Then I successfully cancel the trip
