# Source: ADO User Story #79348 - "[EU Rail][Cart] Loyalty Program Extra - "Use Existing" & "Enter New" Tabs Improvements (OBT / GTP)"
# ADO Test Case ID: 80737
@ado:80737
@wip @transportation @rails @benerail @regression
Feature: 80737 Loyalty Program section - "Use Existing" and "Enter New" tabs improvements
  As a corporate traveler booking a Benerail trip
  I want to select, view, and edit my stored loyalty programs using recognizable program names and card numbers
  So that I can confidently apply the correct loyalty credentials during booking

  Background:
    Given the traveler has at least one loyalty program stored in their profile
    Given I am logged in as "automation@bene.gov" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlaho"
    When I add a Benerail one way to the trip
    When I expand the loyalty number extras section


  # All sub-flows below run in a single Scenario, sharing the one login/search/add-to-trip from
  # the Background above, rather than as separate Scenarios (which would each re-run Background).
  Scenario: Loyalty programs in the "Use Existing" and "Enter New" dropdown

    # --- Use Existing: stored programs are listed correctly ---
    When I open the "Use Existing" tab in the loyalty section
    Then all stored loyalty programs are shown in the dropdown
    And each entry is displayed as "[Program Name] - [Last 4 digits of card number]"

    # --- Use Existing: edit a card number and save ---
    When I expand the loyalty number extras section
    When I open the "Use Existing" tab in the loyalty section
    When I select the loyalty program index 0
    Then the card number field is pre-populated with a valid full card number
    When I edit the card number to "000987654321" and click "Save"
    Then the updated card number is saved to the traveler's profile

    # --- Use Existing: invalid card number is rejected ---
    When I expand the loyalty number extras section
    When I open the "Use Existing" tab in the loyalty section
    When I select the loyalty program index 0
    When I enter an invalid card number "123"
    Then a validation error is displayed for the card number field
    And the card number is not saved

    # --- Use Existing: navigating away without saving discards the edit ---
    When I open the "Use Existing" tab in the loyalty section
    When I select the loyalty program index 0
    When I edit the card number to "000222222222"
    When I navigate away without clicking "Save"
    Then the changes are not persisted to the traveler's profile


    # --- Enter New: changes are not persisted ---
    When I open the "Enter New" tab in the loyalty section
    When I select the loyalty program index 0
    And I edit the card number to "30838112345678910" and click "Save"
    Then the changes are not persisted to the traveler's profile

    # --- Enter New: duplicate entry is ignored ---
    When I expand the loyalty number extras section
    And I enter a loyalty program and card number that already exist in the traveler's profile and click "Save"
    Then the system ignores the new entry and does not add a duplicate

    # --- Use Existing: edit a second stored program and save ---
    When I open the "Use Existing" tab in the loyalty section
    When I select the loyalty program index 1
    And I edit the card number to "30838112345678913" and click "Save"
    Then the updated card number is saved to the traveler's profile

    # --- Use Existing: edit that same program again with a different number ---
    When I expand the loyalty number extras section
    When I open the "Use Existing" tab in the loyalty section
    When I select the loyalty program index 1
    And I edit the card number to "30838112345678912" and click "Save"
    Then the updated card number is saved to the traveler's profile
