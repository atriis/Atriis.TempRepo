# Test Name: 69605: Search flights by preferred carrier
# Status: Active
# Labels: Club,Sabre,Search Flight,carrier,Complete trip,by schedule,Daily Flights,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-30T05:41:06Z
# Updated: 2026-02-17T08:55:24Z

@regression @flights @general @sabre @preferred-carrier
Feature: 69605 Flights - Search by preferred carrier
  As a corporate traveler
  I want to search flights by preferred carrier
  So that results are pre-filtered by my preferred airline

  # TODO: New user needed — tripstatus@app.com → USER_TRIPSTATUS
  # Add to .env: USER_TRIPSTATUS="tripstatus@app.com"

  Scenario: Search flights with preferred carrier filter
    Given I am logged in as "tripstatus" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search round trip with preferred carrier: SYD to MEL, carrier Qantas"
    # TODO: Step needed for "Validate results are displayed filtered by preferred carrier"
    # TODO: Step needed for "Back to search page"
    # TODO: Step needed for "Validate by-schedule results with preferred carrier"
