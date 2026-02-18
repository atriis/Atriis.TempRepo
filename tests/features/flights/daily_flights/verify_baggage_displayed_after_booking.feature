@daily_flights @provider:amadeus
Feature: Verify baggage is displayed after booking
  As a corporate traveler
  I want to add baggage to my flight booking
  So that I can verify the baggage is displayed after completing the booking

  @priority:high
  Scenario: Verify baggage is displayed in Extras after completing booking
    Given I am logged in as "amadeus" "user_one" and ready to book a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "TLV"
    And I filter results by carrier "EL AL"
    And I click on "Pricing Options" for the first result
    When I select the fare with baggage "1 PC"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 1
    When I wait for the save button
    And I click number of baggage
    And I click dropdown option "CHECKED BAG"
    And I click the save button
