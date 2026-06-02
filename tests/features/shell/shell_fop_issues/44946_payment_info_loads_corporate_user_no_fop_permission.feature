# Test Name: 44946 Payment info loads correctly for corporate user (user doesn't have permission 'Can Select FOP at the Cart')
# Description:
# Status: Active
# Labels: Regression,FOP,general,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-16T01:45:25Z
# Updated: 2025-01-16T02:02:00Z

@regression @hotels @fop @permissions
Feature: 44946 Payment info loads correctly for corporate user without FOP selection permission
  As a corporate traveler without "Can Select FOP at the Cart" permission
  I want the payment info to load correctly with the corporate FOP applied
  So that I can complete my hotel booking without needing to choose FOP

  @priority:medium
  Scenario: Corporate FOP is applied and payment status icon is visible
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by Corporate"
    Then the edit button is not displayed in the payment section
