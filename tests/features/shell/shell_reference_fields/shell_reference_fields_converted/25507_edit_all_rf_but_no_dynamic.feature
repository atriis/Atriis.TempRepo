# Test Name: 25507 Edit all RF but no Dynamic
# Description: Edit RF and DYN via overview
# Status: Active
# Labels: Reference Fields,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-02-16T01:33:00Z
# Updated: 2025-09-07T08:06:51Z

@shell @reference_fields @regression
Feature: 25507 - Edit all reference fields from the trip overview

  As a user with edit permissions
  I want to edit the reference fields of an existing trip from the trip overview
  So that I can update the reference information after booking

  Scenario: Edit and save the reference fields of an existing trip
    Given I am logged in as "can@edit.chk"
    # TODO: implement step - open the All trips list and wait for the trips to load
    When I navigate to the trips list
    # TODO: implement step - search for the trip by number and open it
    When I open the trip "3222550"
    # TODO: implement step - verify the trip overview shows the "DO NOT CANCEL" quote
    Then the trip overview shows the quote "DO NOT CANCEL"
    # TODO: implement step - open the reference-fields edit menu from the trip overview
    When I open the reference fields edit form from the trip overview
    # TODO: implement step - verify the "General Reference Questions" reference section is displayed
    Then the "General Reference Questions" reference section is displayed
    # TODO: implement step - click Edit to make the reference fields editable
    When I edit the reference fields
    # TODO: implement step - was a Testim html-attr-validation; verify all reference fields are editable
    Then all reference fields are editable
    # TODO: implement step - save the edited reference fields
    When I save the reference fields
    # TODO: implement step - verify the success notification is displayed
    Then the "Success" notification is displayed
