# Test Name: 61113 Profile - 'Can view profile of other users' privilege masks the loyalty numbers, displaying only the last 3 digits
# Description:
# Status: Active
# Labels: Profile,"Can view profile of other users",Regression,Car loyalty number,Rail loyalty numbers,Hotel loyalty number,FQTV,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-21T10:03:58Z
# Updated: 2025-07-14T07:14:07Z

@regression @profile @privileges @loyalty
Feature: 61113 Profile - View privilege masks loyalty numbers
  As a user with "Can view profile of other users" privilege
  I want to see loyalty numbers masked with only the last 3 digits visible
  So that sensitive traveler information is protected

  @priority:high
  Scenario: Loyalty numbers are masked showing only last 3 digits
    Given I am logged in as "ariane@canviewprofileonly.com" booking a new trip
    And I have added traveler by name "Rui Mariano"
    # TODO: Step needs implementation — wait for ".traveler-name" to show name, click it,
    #   wait for ".page-view .has-text-weight-bold" to show initials
    # DSL candidate: Profile.openTravelerProfile(page, travelerName)
    When I open the traveler profile for "Rui Mariano"
    # TODO: Step needs implementation — click "[id='tab-frequentPrograms'] p"
    # DSL candidate: Profile.openFrequentProgramsTabInTravelerProfile(page)
    And I open the frequent programs tab in the traveler profile
    # TODO: Step needs implementation — assert loyalty entries show pattern "*********XXX"
    # DSL candidate: Profile.verifyLoyaltyNumbersMasked(page)
    Then the FQTV loyalty numbers should be masked showing only the last 3 digits
    # TODO: Step needs implementation — assert a loyalty entry text matches /\*{9}<digits>/
    # DSL candidate: Profile.verifyMaskedLoyaltyEnding(page, lastDigits)
    And I should see a masked loyalty number ending in "333"
    And I should see a masked loyalty number ending in "444"
    And I should see a masked loyalty number ending in "101"
    And I should see a masked loyalty number ending in "675"
