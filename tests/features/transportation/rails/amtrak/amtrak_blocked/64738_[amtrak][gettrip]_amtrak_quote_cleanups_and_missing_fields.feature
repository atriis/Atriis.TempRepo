# Test Name: 64738 [Amtrak][GetTrip] Amtrak quote clean-ups and missing fields
# Description:
# Status: Active
# Labels: Regression,APIS,Rail,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-07-16T03:28:33Z
# Updated: 2025-12-05T04:59:42Z
@wip @transportation @rails @amtrak @regression @api
Feature: 64738 Amtrak - GetTrip quote cleanups and missing fields validation
  As a QA engineer
  I want to validate that the Amtrak GetTrip API response has clean data without missing fields
  So that I can confirm the quote structure is correct

  # NOTE: This test is an API-only test in Testim (uses 'api-action' steps).
  # It cannot be converted to a UI Cucumber scenario automatically.
  # The test calls:
  #   API_Validation__AuthForAPi('yaelte@atriis.com', 'NextLevelAtriis25!', '58294d71f764436fa8282de44cb90cfd')
  #   API_Validation__Amtrak_GetTrip(3515718, 275909)
  # TODO: Implement as an API test using a REST client (e.g. Supertest or Playwright request context)
  # Reference TripId: 3515718, AgencyId: 275909
  Scenario: API validation of Amtrak GetTrip response for quote cleanups
    # TODO: This is an API-only test — requires manual implementation
    # Suggested approach: use Playwright request context to call the GetTrip API
    # and assert that the response contains all required fields without nulls/missing values.
    # See knowledge/azure-table-storage.md for API reference.
    Given the Amtrak GetTrip API should return clean data for trip 3515718 and agency 275909
