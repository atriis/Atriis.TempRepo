# Test Name: 53357 Sabre car - agreement with customer id number
# Labels: TLC, Cars, Regression, Agreement, Full Purchase, hybrid, progress page
# Owner: Shani Hadar
# Created: 2024-10-22T06:41:03Z
# Updated: 2024-10-22T07:12:52Z

@regression @cars @sabre @agreement @full-purchase @hybrid
Feature: 53357 HYBRID Sabre car agreement customer ID booking

  As a Sabre traveler with customer ID agreement
  I want to complete a car booking with agreement pricing
  So that my rental is booked with the agreed rate

  @priority:high
  Scenario: Book Sabre car with customer ID agreement
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "lhr" with rental agency "National"
    And I select the trip purpose as "BILLABLE" and proceed
    Then handshake badge should be visible in car results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I successfully cancel the trip
