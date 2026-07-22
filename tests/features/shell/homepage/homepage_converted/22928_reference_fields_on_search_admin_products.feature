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

  Scenario: A user with three to five products sees all products on the homepage
    Given I am logged in as "rafi@testim.com"
    # TODO: implement 'the {string} product should be visible on the homepage' — assert the named product tile is visible on the homepage carousel
    Then the "Hotel" product should be visible on the homepage
    And the "Car" product should be visible on the homepage
    And the "Rail" product should be visible on the homepage
    And the "Parking" product should be visible on the homepage
    # TODO: implement 'I open the {string} product from the homepage' — click the named product tile (handling any hover/dropdown) to open its search page
    When I open the "Hotel" product from the homepage
    # TODO: implement 'the {string} search page should be displayed' — assert the named product's search page opened
    Then the "Hotel" search page should be displayed
    # TODO: implement 'I go back to the homepage' — click the Home Page icon to return to the homepage
    When I go back to the homepage
    And I open the "Car" product from the homepage
    Then the "Car" search page should be displayed
    When I open the "Rail" product from the homepage
    Then the "Rail" search page should be displayed
    When I open the "Parking" product from the homepage
    Then the "Parking" search page should be displayed

  Scenario: Reference fields appear on search even when there are no dynamic fields to show
    Given I am logged in as "rafi@testim.com"
    When I book a new trip
    And I have added myself as the traveler
    And I search for a hotel in "London" for 1 night
    # TODO: implement 'I handle the reference fields validation code step manually' — Testim 'validation-code-step' must be converted manually
    And I handle the reference fields validation code step manually
    # TODO: implement 'the reference field label {string} is displayed' — assert the named reference field label appears in the popup
    Then the reference field label "type of trip" is displayed
    # TODO: implement 'the reference field dropdown shows {string}' — assert the reference field dropdown shows the given placeholder/value
    And the reference field dropdown shows "Select"
    # TODO: implement 'I select the mandatory reference field option in the popup' — open the collapse section and select the option in the reference fields popup
    When I select the mandatory reference field option in the popup
    And I click proceed on the reference fields popup
    # TODO: implement 'the distance filter should be displayed on the results page' — assert the Distance filter is displayed once results load
    Then the distance filter should be displayed on the results page

  Scenario: The user can access the administration area
    Given I am logged in as "rafi@testim.com"
    When I navigate to the administration page
    # TODO: implement 'the admin section {string} should be visible' — assert the named administration section is visible
    Then the admin section "Justifications" should be visible
