# Test Name: 25506 Edit RF and DYN via overview
# Description: Edit RF and DYN via overview
# Status: Active
# Labels: Reference Fields,Regression,piniTest,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-02-16T01:33:00Z
# Updated: 2025-09-07T07:59:32Z

@shell @reference_fields @regression
Feature: 25506 - Edit reference and dynamic fields from the trip overview

  As a user with edit permissions
  I want to edit the reference and dynamic fields of an existing trip from the trip overview
  So that I can update a reference field value after booking

  Scenario: Edit a reference field value and save from the trip overview
    Given I am logged in as "can@edit.dyn"
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
    # TODO: implement step - fill the first traveller reference question with the given value
    When I fill the first traveller reference question with "a2345"
    # TODO: implement step - save the edited reference fields
    When I save the reference fields
    # TODO: implement step - verify the success notification is displayed
    Then the "Success" notification is displayed
