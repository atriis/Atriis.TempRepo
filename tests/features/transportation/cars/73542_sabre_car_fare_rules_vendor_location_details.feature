# Test Name: 73542 [Cars][Sabre] Fare Rules Popup UI – Vendor And Location Details Tab
# Labels: Cars, Full Purchase, Daily Transportation, Regression
# Owner: Pedro Carneiro
# Created: 2026-02-06T04:51:07Z
# Updated: 2026-02-13T03:33:19Z

@regression @cars @sabre @full-purchase @daily-transportation
Feature: 73542 Sabre car fare rules popup across booking flow

  As a Sabre car traveler
  I want to view detailed fare rules and vendor information at each booking stage
  So that I understand all pricing and vendor terms

  Background:
    Given I am logged in as "testim" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify Sabre car fare rules display in full booking flow
    When I search for a car at "LHR"
    # TODO: Complete Sabre reference fields
    # TODO: Click fare rules to verify vendor and location details tab
    When I add the first car to cart
    # TODO: Click fare rules to verify vendor and location details tab in cart
    And I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete traveler reference questions
    And I complete the booking
    # TODO: Click fare rules to verify vendor and location details tab in checkout
    When I cancel the trip
    Then I successfully cancel the trip
