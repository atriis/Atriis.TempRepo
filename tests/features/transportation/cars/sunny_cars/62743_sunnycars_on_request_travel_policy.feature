# ADO #62743 - New Travel Policy for "On-Request" Cars (Sunny)
# Reference test case: ADO #62743

@daily_cars @provider:sunnycars @regression @transportation @cars @ado:62743 @priority:medium
Feature: 62743 SunnyCars - New Travel Policy for On-Request Cars
  As a corporate traveler searching SunnyCars
  I want on-request cars to be identified in the results
  So that the on-request travel policy can be applied to them

  Scenario: SunnyCars on-request car is displayed in the results
    Given I am logged in as "automation@sunnycar.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with 1 months ahead
    Then I filter by each car class until a car with the "On request" label is displayed
