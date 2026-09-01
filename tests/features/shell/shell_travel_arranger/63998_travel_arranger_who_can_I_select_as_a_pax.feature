@regression @profile @travel-arranger
Feature: 63998 Travel arranger - Who can I select as a pax
  As a travel arranger
  I want the add-traveller list to offer only the users who let me book for them
  So that I cannot add a passenger I am not permitted to book for

  @priority:medium
  Scenario: A traveller outside the arranger's permitted list cannot be added as a passenger
    Given I am logged in as "Stuart@Stuart.com" booking a new trip
    Then the traveler "Yael Alef" should not be available to add
