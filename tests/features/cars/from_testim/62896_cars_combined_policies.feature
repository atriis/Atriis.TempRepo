@transportation @cars @regression
Feature: 62896 - Cars Travel Policy Combined with Class and Vendor Policies

  Scenario: Verify car class type and vendor policies work as expected when used together
    Given I am logged in
    When travel policy is configured
    And car class policy is configured
    And car vendor policy is configured
    And I search for cars
    Then all policies should be applied correctly
    And the results should be restricted according to all active policies
