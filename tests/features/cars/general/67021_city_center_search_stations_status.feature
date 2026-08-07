@transportation @cars @regression @provider:sunnycars
Feature: 67021 City Center Search -  Stations status

  As a traveler
  I want to search for city center car rental locations
  So that I can verify the status of rental stations

  Scenario: Search for city center cars in Barcelona and verify station status
    Given I am logged in as "kaylesun@tlcfaketestsunnycar.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "Barcelona,Spain,(BCN)" with 10:00 PM pickup time and 10:00 PM drop off time
    And I select the trip purpose as "BILLABLE" and proceed
    And I wait for select text to be visible
    Then I verify that first "Closed" station status is displayed in red on the results page - search until you find the first one to validate things
    And first "Closed" station status select button is disabled
    And I click first "Closed" station status see details button
    Then I verify that first "Closed" station status is displayed in red on see details modal
    And text "The station is closed on the selected dates and times" should be visible
    And I close see details modal
    Then I verify that first "Open On Request" station status is displayed in orange on the results page - search until you find the first one to validate things
    And first "Open On Request" station status select button is enabled
    And I click first "Open On Request" station status see details button
    Then I verify that first "Open On Request" station status is displayed in orange on see details modal
    And text "The station can be opened on request on the selected dates and times" should be visible
    And I close see details modal
    Then I verify that first open station has select button enabled on the results page - search until you find the first one to validate things
    And text "The station is open on the selected dates and times" should be visible for the first open station that has select button enabled
    And I click first first open station that has select button enabled see details button
    Then text "The station is open on the selected dates and times" should be visible
