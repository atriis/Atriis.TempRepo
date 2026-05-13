# Test Name: HYBRID for 55675 Flights - For user with privilege 'Can edit and view profile for other users', show traveler's FF
# Status: Active
# Labels: Flights,Frequent flyer,Cart,hybrid,Regression,No Amadeus Hotel Book,Role,Privileges,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-01-29T09:57:06Z
# Updated: 2025-09-17T12:33:33Z

@regression @flights @general @hybrid @fqtv @privileges
Feature: 55675 Flights - Show travelers FF for user with privilege
  As the system
  I want to show frequent flyer numbers for users with the profile viewing privilege
  So that authorized bookers can see traveler FF info

  Scenario: FF is shown for travelers when booker has privilege
    Given I am logged in as "admin@cansee.com" booking a new trip
    And I have added traveler by name "Annie Massk"
    And I have added traveler by name "Molly Massk"
    When I search for a round trip flight from "CLT" to "LGA"
    And I filter airline results by "AA" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click frequent flyer in extras
    Then the FQTV should show "AA - DCA45299" for "Annie Massk"
    Then the FQTV should show "AA - LPL20677" for "Molly Massk"
