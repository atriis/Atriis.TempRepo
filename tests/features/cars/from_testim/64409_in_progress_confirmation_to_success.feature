@transportation @cars @regression @multimodal
Feature: In Progress Page - Confirmation to Success status

  Scenario: Verify booking transitions through in-progress to confirmed to success states
    Given I am logged in as "testim@onrequest.gal"
    And I book a new trip
    And I add myself as the traveler
    And I select a rental agency
    When I search for an earlier date car at "LHR"
    And I add the on-request car to trip
    And I wait for pending booking
    And I select a payment method
    And I accept terms and conditions and proceed to checkout
    And I answer traveler reference questions
    And I complete booking and view progress page
    Then the in-progress page is displayed with booking confirmation
