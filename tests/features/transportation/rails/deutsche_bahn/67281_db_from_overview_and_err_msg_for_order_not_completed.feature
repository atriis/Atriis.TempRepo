# Test Name: 67281 DB from overview and err msg for order not completed
# Description: 1- validate the DB in cart
# Description: 2- validate err msg
# Status: Active
# Labels: Regression,Rail,DB Rail,Cart,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-09-15T01:39:01Z
# Updated: 2025-09-15T02:01:30Z
@transportation @rails @deutschebahn @regression
Feature: 67281 DB - Continue from overview and validate not completed order error
  As a corporate traveler
  I want to continue a DB order from trip overview
  So that I can see the correct error when the external order is not completed

  Scenario: DB continue flow shows not completed order error message
    Given I am logged in as "pmac@corp.club"
    When I navigate to the trips page
    # AB#82671 rebuilt the filter rail: the tabs became quick views and the page now opens on
    # "To do", which holds none of this user's trips. The upcoming view is where the open trip
    # that still accepts a new DB item lives.
    And I select the "Upcoming trips" quick view on the trips page
    # The DB continue action is only enabled for adult travellers; scoping the list to the
    # logged-in user's own trips keeps the first trip an adult one regardless of list re-ordering.
    # Turned on AFTER the quick view: selecting a view resets the rail to an unfiltered state
    # (trip-monitor-filter.ts selectQuickView), which would drop the filter again.
    And I turn the "My trips only" filter switch on
    And I click the first trip from the trip list
    When I open the Deutsche Bahn continue action from trip overview
    Then I should see the DB continue booking information message
    When I continue and confirm the DB order retrieval
    Then I should see the DB order not completed error message
