# Test Name: HYBRID for 68132 Galileo - Flight - Change fee and cancellation fee are correct when sharing quote from results page
# Status: Active
# Labels: Regression,Fare Rules,Galileo,Flights,mini rule,share quote,price offer,hybrid,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-26T01:08:27Z
# Updated: 2025-09-26T02:45:54Z

@regression @galileo @flights @fare_rules @share_quote @hybrid
Feature: 68132 Galileo - Change fee and cancellation fee correct in shared quote

  As a corporate traveler
  I want change and cancellation fees to be correct when sharing quotes from results
  So that shared quotes contain accurate fare rule information

  Scenario: Shared quote from results page shows correct change and cancellation fees
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MME" to "AMS"
    And I wait for flight results to be available
    # TODO: Click_to_share_two_quotes_from_results_page — complex shared step:
    # 1. Click share quote button in results page
    # 2. Select first and second flights for sharing
    # 3. Click "Share" button
    # 4. Wait for share form with "Subject" label
    # 5. Scroll to cancellation fee section in email preview
    # 6. Verify "Cancellation" text appears for first quote
    # 7. Scroll to second quote cancellation section
    # 8. Verify "Cancellation" text appears for second quote
    And I click the share quote button
    # TODO: Need steps for selecting multiple quotes and verifying fees in share preview
