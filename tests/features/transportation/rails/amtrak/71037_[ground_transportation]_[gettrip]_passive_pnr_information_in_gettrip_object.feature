# Test Name: 71037  [Ground Transportation] [GetTrip] Passive PNR information in GetTrip Object
# Description: Clone:
# Status: Active
# Labels: Regression,APIS,Rail,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-12-05T04:25:08Z
# Updated: 2026-01-09T05:22:57Z
@wip @transportation @rails @amtrak @regression @api
Feature: 71037 Ground Transportation - Passive PNR information in GetTrip object
  As a QA engineer
  I want to validate that the GetTrip API response contains passive PNR information
  So that I can confirm passive rail bookings are correctly represented in the trip object

  # NOTE: This test is an API-only test in Testim (uses 'api-action' steps).
  # It cannot be converted to a UI Cucumber scenario automatically.
  # The test calls:
  #   API_Validation__AuthForAPi('pmac@tmc.gdg', 'NextLevelAtriis25!', '58294d71f764436fa8282de44cb90cfd')
  #   API_Validation__Amtrak_GetTrip(3584840, 274129)
  # TODO: Implement as an API test using a REST client (e.g. Playwright request context)
  # Reference TripId: 3584840, AgencyId: 274129
  Scenario: API validation of GetTrip response contains passive PNR information
    # TODO: This is an API-only test — requires manual implementation
    # Suggested approach: use Playwright request context to authenticate and call GetTrip API,
    # then assert that the response includes passive PNR fields in the ground transport segment.
    Given the GetTrip API should return passive PNR information for trip 3584840 and agency 274129
