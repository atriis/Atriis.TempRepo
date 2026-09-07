# ADO Test Case ID: 84226
@ado:84226
@transportation @rails @evolvi @regression @payload
Feature: 84226 Evolvi UK Rail - Per-passenger railcard code sent in booking request

  @priority:high
  Scenario: Regular mode multi-passenger booking with mixed railcard assignment
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    And I add a traveler by name "Automation" from the search autocomplete
    And I have added a random guest traveler
    When I search for a one way Evolvi train from "182ToMan" without clicking search
    And I select railcard "YNG - 16-25 Railcard" for traveler 1 at search
    And I select railcard "TST - 26-30 Railcard" for traveler 2 at search
    And I click the Evolvi search button
    And I add an Evolvi one way to the trip
    And I assign railcard "YNG - 16-25 Railcard" to traveler 1 in the Railcard Assignment extra
    And I assign railcard "TST - 26-30 Railcard" to traveler 2 in the Railcard Assignment extra
    And I leave traveler 3 without a railcard in the Railcard Assignment extra
    And I save the Railcard Assignment extra
    Then the booking status should be "Pending booking"
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I select the first available option for the "Travel Type" reference field for all travelers
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    When I capture the "request" payload for request type "otaRailBook" from Storage
    Then the captured "request" payload for request type "otaRailBook" should contain "R:YNG".block("TravelerName")
    Then the captured "request" payload for request type "otaRailBook" should contain "R:TST".block("TravelerName")

  @priority:high
  Scenario: Single traveler booking with railcard selected at search
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182ToMan" without clicking search
    And I select railcard "YNG - 16-25 Railcard" for traveler 1 at search
    And I click the Evolvi search button
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I select the first available option for the "Travel Type" reference field for all travelers
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    When I capture the "request" payload for request type "otaRailBook" from Storage
    Then the captured "request" payload for request type "otaRailBook" should contain "R:YNG".block("TravelerName")

  @priority:medium
  Scenario: Single traveler booking with no railcard selected
    Given I am logged in as "automation@evolvi.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182ToMan"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I select the first available option for the "Travel Type" reference field for all travelers
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    When I capture the "request" payload for request type "otaRailBook" from Storage
    Then the captured "request" payload for request type "otaRailBook" should not contain "NameSuffix".block("TravelerName")
