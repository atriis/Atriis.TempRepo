# Test Name: 33896 Benerail - Can save date of birth in case of guest/pax without DOB
# Description:
# Status: Active
# Labels: guest,Rail,Cart,Regression,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-22T01:23:38Z
# Updated: 2026-02-03T10:49:44Z
@transportation @rails @benerail @regression
Feature: 33896 Benerail - Can save date of birth for guest passenger without DOB
  As a corporate traveler booking for a guest without a date of birth
  I want to save the birth date in the Benerail cart extras
  So that the booking can proceed with the required passenger information

  Scenario: Benerail cart allows saving date of birth for guest without pre-configured DOB
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added a guest passenger without date of birth named "Israel" "Israeli"
    When I navigate to the Benerail rail search tab
    And I select "Youth (15-25)" from travellers ages dropdown in benerail search
    And I search for a round trip Benerail train from "bebmiToSchiphol"
    And I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    Then the birth date section should be visible and required in the Benerail cart
    When I save the birth date as "20/02/2011" in the Benerail extras cart
    And the booking status should be "Pending booking"
    Then the birth date should be saved successfully in the Benerail cart by having a green check mark next to it
    And I expand the birth date section
    Then birth date is "********"
