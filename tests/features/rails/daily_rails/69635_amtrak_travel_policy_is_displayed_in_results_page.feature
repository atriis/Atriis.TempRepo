@provider:amtrak @regression @priority:high @ado:69635
Feature: Amtrak - Travel Policy is displayed in results page

  As an Amtrak user with travel policies configured
  I want to view my configured travel policies when searching for trains
  So that I understand the policy constraints before booking

  Background:
  Scenario: Display travel policy details in Amtrak one-way search results
    Given I am logged in as "marcoluis@oopamtrak.com" booking a new trip
    Given I have added myself as the traveler
    When I search for a one way Amtrak train from "bosToWas"
    When I wait for select text to be visible
    When I click more details for the first Amtrak result
    Then the out of policy indicator should be visible in results
    Then the out of policy tooltip in results should be "Upgrade cost is greater than 5 USD"
