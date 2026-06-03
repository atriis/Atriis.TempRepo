@transportation @cars @regression @provider:galileo
Feature: 47792 - Galileo Car Search with Travel Policy Configuration

  Scenario: User can search for cars when travel policy is configured and policy is triggered correctly
    Given I am logged in with a Galileo account
    When travel policy is configured
    And I search for cars
    Then the travel policy should be applied to the search results
    And the policy should be triggered correctly
