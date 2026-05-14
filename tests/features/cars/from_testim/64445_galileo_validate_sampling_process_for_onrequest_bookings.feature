# ADO #64445 - [Cars][Galileo] Validate sampling process for on-request bookings
# Reference test case: Testim - hybrid_for_64445_galileo_validate_sampling_process_for_onrequest_bookings
# Migration status: Converted from Testim to Gherkin
@regression @provider:galileo @transportation @cars @ado:64445 @priority:high
Feature: 64445 Galileo validate sampling process for on-request bookings
  As a corporate traveler booking a car with on-request availability
  I want to see the on-request status accurately reflected throughout the booking flow
  So that I can understand the booking status and complete the on-request booking process

  Scenario: Complete end-to-end on-request car booking with Galileo
    Given I am logged in as "testim" booking a new trip
    And I have added myself as the traveler
    
    When I search for a car at "LHR" with rental agency "EP"
    Then the car search results display available cars
    
    When I add a car from city center results to cart
    Then the car should be added to my trip
    
    When I accept the trip overview terms and conditions
    And I proceed to checkout
    And I complete the booking
    
    Then the booking should succeed
