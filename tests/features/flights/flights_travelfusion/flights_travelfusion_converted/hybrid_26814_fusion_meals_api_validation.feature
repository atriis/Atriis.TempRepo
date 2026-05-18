# Test Name: HYBRID for 26814 fusion meals (API Validation)
# Status: Active
# Labels: hybrid,Flights,Fusion,Regression,Full Purchase,meal,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-10-31T06:11:00Z
# Updated: 2026-02-17T09:07:37Z

@regression @flights @fusion @meal @hybrid @full-purchase @priority:high
Feature: 26814 Fusion - Meal selection on Air Arabia flight (hybrid / API validation)
  As a corporate traveler booking an Air Arabia flight via Fusion
  I want to add a meal selection and complete booking
  So that meal preferences are persisted in the booking and sent in the API request

  Scenario: Add a roasted-beef meal on Air Arabia Fusion flight and complete booking
    Given I am logged in as "uzi@yonon.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "NBO" to "SHJ"
    # TODO: implement 'I click proceed after the search modal' — see click_on_proceed_after_search() in Testim source (test 26814 hybrid)
    Then flight results should be available
    # TODO: implement 'I filter results by Air Arabia carrier' — see filter_on_air_arabia() in Testim source (test 26814 hybrid)
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the meal extras section
    # TODO: implement 'I select the meal option containing "roasted"' — type 'roasted' in meal search input and select first matching option (test 26814 hybrid)
    And I click the save button
    # TODO: implement 'the meal success toast should be displayed' — see Success_toast_alert() in Testim source (test 26814 hybrid)
    # TODO: implement 'the saved meal should display "Roasted Beef Panini - 20.00AED"' — waitForText('.inputs > :nth-child(1) .el-select__placeholder span', 'Roasted Beef Panini - 20.00AED') (test 26814 hybrid)
    When I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking
