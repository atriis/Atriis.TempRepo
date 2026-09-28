# ADO Test Case ID: 57201
# Test Name: 57201 Evolvi- Maximum splits
# Description: The SplitTix split count chosen in the UK Rail search form is sent as MaxSplits in the otaRailAvail request
@ado:57201
@transportation @rails @evolvi @provider:evolvi @regression @priority:medium
Feature: 57201 Evolvi - Maximum splits selected in search are sent in otaRailAvail
  As a UK Rail booker requesting a split ticket
  I want the maximum number of splits I choose in the search form to reach Evolvi
  So that the SplitTix fares returned never split the journey more times than I asked for

  Scenario Outline: <splitCount> split max is kept on the search form and sent as MaxSplits in otaRailAvail
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I select UK Rail in the search form
    And I validate that split ticket options in Evolvi search checkbox is checked
    And I click "Advanced search" in search page
    And I select <splitCount> as the Evolvi maximum number of splits
    Then the Evolvi maximum number of splits should show "<splitCount> split max"
    When I search one way Evolvi train from "182ToMan" without unchecking split ticket checkbox
    And I dismiss the mandatory notifications popup if displayed
    Then I should see outbound text in Evolvi results page
    When I capture the "request" payload for request type "otaRailAvail" from Storage
    Then the captured "request" payload for request type "otaRailAvail" should contain "<splitCount>".onKey("MaxSplits")

    Examples:
      | splitCount |
      | 1          |
      | 2          |
      | 3          |
