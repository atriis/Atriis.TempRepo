# Test Name: 67995 'City' and 'First Name' fields allow spaces between words
# Description:
# Status: Active
# Labels: Regression,Profile,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-25T01:53:00Z
# Updated: 2025-09-25T02:42:47Z

@regression @profile @validation
Feature: 67995 Profile - City and First Name fields allow spaces between words
  As a corporate traveler
  I want to use spaces in city and first name fields
  So that multi-word names and cities like "Jessica Alba" or "Chicago Ili" are accepted

  @priority:medium
  Scenario: City with space is accepted in contact information and guest first name allows spaces
    Given I am logged in as "ruimariano@amadeus.com"
    When I navigate to my user profile
    And I open the contact information tab in my profile
    # TODO: Step needs implementation — assert city input value matches
    # DSL candidate: Profile.verifyCityFieldValue(page, expectedValue)
    Then the city field should contain "chicago ili"
    When I save the profile changes
    Then I should see a success notification
    When I book a new trip
    # TODO: Step needs implementation — open guest form, fill first/last name, DOB, nationality, email, phone, click add
    # DSL candidate: Search.addGuestTravelerWithDetails(page, { firstName, lastName })
    # NOTE: Testim used random generators for DOB, email, and phone
    And I add a random guest traveler with first name "Jessica Alba" and last name "Smith"
    # TODO: Step needs implementation — assert close icon/confirmation appears indicating guest added
    # DSL candidate: Search.verifyGuestTravelerAdded(page)
    Then the guest traveler form should accept the name with spaces
