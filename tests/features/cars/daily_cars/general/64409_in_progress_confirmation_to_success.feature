@transportation @cars @regression @multimodal
Feature: 64409 In Progress Page > inProgress > "Confirmation in progress" - Confirmed > "Success"

  #Flight test is very unstable due Galileo supplier booking error
  Scenario: Verify booking transitions through in-progress to confirmed to success states - Flight
    Given I am logged in as "testim@onrequest.gal" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "MAD" with preferred carrier "Iberia"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I click add payment method button
    And I click the card "Testim" checkbox
    And I save the card selection
    And the payment type should be "Paid by Traveller"
    And I proceed to checkout
    And I click book and finalize button
    Then I should see "Confirmation in Progress" or "Success" status on the booking page
    And line with product details is displayed after checkout with status "Ticketing Complete" or "Confirmed" or "Finalizing"
    And I click go to trip button
    And I successfully cancel the trip

  Scenario: Verify booking transitions through in-progress to confirmed to success states - Rail
    Given I am logged in as "testim@benemoove.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "nlabkToNlasc"
    And I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I click book and finalize button
    Then I should see "Confirmation in Progress" or "Trip Subimtted for Approval" status on the booking page
    And line with product details is displayed after checkout with status "In Progress"
