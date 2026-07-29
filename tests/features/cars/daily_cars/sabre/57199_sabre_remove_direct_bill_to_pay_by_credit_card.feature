# Test Name: 57199 Remove Direct Bill to pay by CC
# Labels: Sabre, Cars, Full Purchase, Regression, Sanity, progress page
# Owner: Shani Hadar
# Created: 2025-12-12T04:55:16Z
# Updated: 2026-02-04T12:38:49Z

@regression @cars @sabre @sanity @full-purchase
Feature: 57199 Sabre billback removal and credit card payment

  As a traveler with a direct bill agreement
  I want to remove direct billing and pay by credit card
  So that I have payment flexibility

  @priority:high
  Scenario: Remove Sabre agreement direct bill and pay by credit card
    Given I am logged in as "victor@agreementcarsabre.com" booking a new trip
    # The star icon on this user's traveller chip renders far later than the shared
    # "I have added traveler by name" step waits for, so the add is confirmed by the
    # traveller name chip instead.
    And I add a traveler by name "Pedro Carneiro" from the search autocomplete
    And the traveler name "Pedro Carneiro" is added successfully
    When I initiate a car search at "LHR"
    And I select the trip purpose as "BILLABLE" and proceed
    Then handshake badge should be visible in car results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    When I click to edit the request billback extras section
    Then the corporate billing number is "17010058"
    When I uncheck the "Apply to this quote" checkbox in the car billback section
    And I click the save button
    Then the booking status should be "Pending booking"
    When I click to edit the request billback extras section
    Then the corporate billing number is "17010058"
