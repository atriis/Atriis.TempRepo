# ADO #64445 - [Cars][Galileo] Validate sampling process for on-request bookings
# Reference test case: Testim - hybrid_for_64445_galileo_validate_sampling_process_for_onrequest_bookings
# Migration status: Converted from Testim to Gherkin
@regression @provider:galileo @transportation @cars @ado:64445 @priority:high
Feature: 64445 HYBRID Galileo validate sampling process for on-request bookings
  As a corporate traveler booking a car with on-request availability
  I want to see the on-request status accurately reflected throughout the booking flow
  So that I can understand the booking status and complete the on-request booking process

  #It was failing due supplier, need to check the entire run as soon as supply is working
  Scenario: Complete end-to-end on-request car booking with Galileo
    Given I am logged in as "testim@onrequest.gal" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Europcar" and 1 months ahead
    And I wait for add to trip text to be visible
    And I toggle the "In Policy" filter on car results
    Then I should see the "On request" label on the first car result
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I click book and finalize button
    Then I should see "Confirmation in Progress" or "Trip Submitted for Approval" status on the booking page
    And line with product details is displayed after checkout with status "In Progress"
    And I click go to trip button
    Then the booking status should be "In progress"