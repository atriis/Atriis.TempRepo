@transportation @cars @regression
Feature: 58633 - Cars Travel Policy for Corporate User - City Center Restrictions

  Scenario: Verify travel policy restricts results when car initiator is corporate user in city center search
    Given I am logged in as a corporate user
    When I search for cars at a city center location
    Then the travel policy should be applied
    And results should be restricted according to the policy
