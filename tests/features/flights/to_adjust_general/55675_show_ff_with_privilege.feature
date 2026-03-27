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

  # TODO: New user needed — admin@cansee.com → USER_ADMIN_CANSEE
  # Add to .env: USER_ADMIN_CANSEE="admin@cansee.com"

  Scenario: FF is shown for travelers when booker has privilege
    Given I am logged in as "admin_cansee" booking a new trip
    # TODO: Step needed for "Add traveler by name 'Annie Massk'"
    # TODO: Step needed for "Add second traveler by name 'Molly Massk'"
    When I search for a round trip flight from "CLT" to "LGA"
    # TODO: Step needed for "Filter on AA carrier"
    And I add the first flight to cart
    # TODO: Step needed for "Navigate to frequent flyer section"
    # TODO: Step needed for "Validate FF is visible for traveler 1"
    # TODO: Step needed for "Validate FF is visible for traveler 2"
