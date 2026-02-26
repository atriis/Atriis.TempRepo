# Test Name: 56848 Booking.com - Hotel is marked as 'Corporate Preferred' according to the admin configuration
# Description: 
# Status: Active
# Labels: Booking.com,Regression,Hotel,Preferred Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-17T11:59:25Z
# Updated: 2025-03-28T11:08:22Z

@regression @provider:bookingcom
Feature: 56848 Booking.com - Corporate preferred badge displayed in hotel results
  As a corporate traveler using Booking.com
  I want to see the corporate preferred badge on qualifying hotels in results
  So that I can easily identify company-preferred properties

  @priority:medium
  Scenario: Corporate preferred badge is visible on qualifying hotel results
    Given I am logged in as "bookingcom" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Springhill Suites Pittsburgh" for 1 night
    # TODO: Create step "Then the corporate preferred badge should be visible on the hotel" that calls DSL verifyCorporatePreferredBadge in HotelSearch.js
