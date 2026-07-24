# Test Name: 22928 MERGED reference fields appear on search even if there are no dynamic fields to show on search + can access admin + can switch back to the old UI + user with 3-5 products can see all products on homepage
# Description: pop up with refrence fields appear on search even if there are no dynamic fields
# Status: Active
# Labels: NL government,Reference Fields,No Amadeus Hotel Book,Homepage,Products,Regression,Administration,Switching to Old Interface,UI,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-01T11:01:36Z
# Updated: 2026-02-16T02:12:25Z
#
# NOTE: The merged Testim title advertises a fourth case "can switch back to the old UI",
# but the exported IIFE contains no actions for it — no scenario is generated for that case.

@regression @shell @homepage @merge @reference_fields @administration
Feature: 22928 - Reference fields on search, admin access, and homepage products
  As a corporate traveler on an NL government account
  I want reference fields to appear on search, admin access, and the correct products on my homepage
  So that policy references are captured and my role sees the right tools and products

  Scenario: A user with three to five products sees all products and reference fields appear on hotel search
    Given I am logged in as "rafi@testim.com"
    Then the "Hotel" product should be visible on the homepage
    And the "Car" product should be visible on the homepage
    And the "Rail" product should be visible on the homepage
    And the "Parking" product should be visible on the homepage
    When I open the "Hotel" product from the homepage
    Then the "Hotel" search page should be displayed
    When I go back to the homepage
    And I open the "Car" product from the homepage
    Then the "Car" search page should be displayed
    When I open the "Rail" product from the homepage
    Then the "Rail" search page should be displayed
    When I open the "Parking" product from the homepage
    Then the "Parking" search page should be displayed
    When I book a new trip
    And I have added myself as the traveler
    And I initiate a hotel search in "London" for 1 night
    Then the number of reference and dynamic fields in the travel request popup should be 1
    And I select the "Type of trip" reference field as "b" and proceed
    Then I wait to see view rates text in results page

  Scenario: The user can access the administration area
    Given I am logged in as "rafi@testim.com"
    When I navigate to the administration page
    Then the admin section "Justifications" should be visible
