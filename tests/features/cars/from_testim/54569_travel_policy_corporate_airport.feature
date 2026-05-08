@transportation @cars @regression
Feature: 54569 - Cars Travel Policy for Corporate User - Airport Search Restrictions

  Scenario: Verify travel policy restricts results when car initiator is corporate user in airport search
    Given I am logged in as a corporate user
    When I search for cars at an airport location
    Then the travel policy should be applied
    And results should be restricted according to the policy
