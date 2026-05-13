# Test Name: 56848 Booking.com - Hotel is marked as 'Corporate Preferred' according to the admin configuration
# Description: 
# Status: Active
# Labels: Booking.com,Regression,Hotel,Preferred Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-17T11:59:25Z
# Updated: 2025-03-28T11:08:22Z

@regression @provider:bookingcom
Feature: 56848 Booking.com - Hotel is marked as 'Corporate Preferred' according to the admin configuration
  As a corporate traveler using Booking.com
  I want to see the corporate preferred badge on qualifying hotels in results
  So that I can easily identify company-preferred properties

  @priority:medium
  Scenario: Hotel is marked as 'Corporate Preferred' according to the admin configuration
    Given I am logged in as "cintiaoliveira@booking.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Springhill Suites Pittsburgh Mt. Lebanon" for 1 night
    And I wait to see view rates text in results page
    When I filter hotel results by hotel name "Springhill Suites By Marriott Pittsburgh"
    Then the corporate rates badge should be visible on hotel level results
    