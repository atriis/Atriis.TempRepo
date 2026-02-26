# Test Name: 29751 MERGED approval for changes + approval flow determined by the user administration if the financial reference has no approval flow
# Description: 
# Status: Active
# Labels: Email,Approval flow,Approval for changes,Hotel,Cars,Full Purchase,Regression,NL government,Financial Reference Code,Pre Prod,Sanity,Amadeus,Transportation,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-17T08:44:58Z
# Updated: 2025-10-28T08:42:40Z

@regression @provider:amadeus
Feature: 29751 Amadeus - Hotel booking with financial reference and approval
  As a corporate traveler
  I want to book a hotel, add a financial reference, and submit for approval
  So that the booking is properly coded and approved

  @priority:critical
  Scenario: Hotel booking with FOP CVV, financial reference, and approval flow
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LAX" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL method setCVVForCard in CartFop.js
    When I proceed to checkout
    # TODO: Create step "When I select a financial reference" that calls DSL method selectFinancialReference in Checkout.js
    And I complete the booking
    # TODO: Create step "Then the booking should be sent for approval" that calls DSL method verifyApprovalSent in Checkout.js
