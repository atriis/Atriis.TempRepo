# ADO #81304 - [Benerail] Fare rules remain accessible after quote cancellation

@provider:benerail @regression @priority:high @ado:81304
Feature: 81304 Benerail - Fare rules remain accessible after quote cancellation

  As a corporate traveler
  I want the Benerail fare rules captured at fare selection to remain accessible with correct information even after I cancel the quote
  So that I can always verify the terms and conditions that applied to a trip, whether it was completed or cancelled

  Scenario: Fare rules stay accessible with correct information after cancelling a Benerail quote
    Given I am logged in as "automation@bene.gov" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToNlaho"
    When I add a Benerail round trip to the trip
    Then I successfully cancel the quote
    When I show cancelled items
    Then the booking status should be "Cancelled"
    Then the fare rules should remain accessible with correct information after the Benerail quote is cancelled
