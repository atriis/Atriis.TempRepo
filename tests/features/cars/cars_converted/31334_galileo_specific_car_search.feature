@transportation @cars @regression @provider:galileo
Feature: 31334 - Galileo - Specific Car Search Without Errors

  Scenario: Search for cars at specific locations with Galileo and verify results
    Given I am logged in as "vinicius@bengalileo.com"
    When I book a new trip
    And I add myself as the traveler
    And I search for cars with pickup at "Walsall, UK" and drop-off at "The Turf Hotel, Mold Road, Wrexham, UK"
    Then car vendor stations should be displayed
    And the first station should have a "Select" button
    And the first station should have a "See details" button
