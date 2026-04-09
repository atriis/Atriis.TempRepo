# Test Name: 23110 [Merge] Sunny Car - Verify that the terms and conditions are loading, invoice payment works correctly and validate is displayed
# Labels: Cars, merge, Full Purchase, SunnyCars Regression, FOP, Invoice, Terms and Conditions, Daily Transportation, Regression
# Owner: Bruna Santos
# Created: 2023-12-26T04:04:28Z
# Updated: 2026-02-11T05:31:31Z

@regression @cars @sunnycars @full-purchase @daily-transportation
Feature: 23110 SunnyCars terms invoice payment and voucher validation
  As a traveler booking with SunnyCars
  I want terms and conditions and invoice payment details to be visible through booking
  So that I can confirm the booking policy and voucher availability

  @priority:high
  Scenario: Verify SunnyCars terms, invoice FOP, and voucher after booking
    Given I am logged in as "brunaalice" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "LHR"
    # TODO: Create step "When I check terms and conditions in car results" that calls CarResults.checkTermsAndConditionsInResults(page).
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the car FOP owner should be displayed as \"Paid by TMC\"" that calls CartPayment.verifyFopOwner(page, "Paid by TMC").
    When I check terms and conditions in cart
    And I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And the download voucher button should be visible in the trip overview
    When I cancel the trip
    Then I successfully cancel the trip
