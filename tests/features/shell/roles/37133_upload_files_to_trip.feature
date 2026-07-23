# Test Name: 37133 Upload files to trip
# Description:
# Status: Active
# Labels: Regression,Upload file,Cart,Role,2026 plan 1
# Owner: pini harush
# Created: 2023-10-16T02:39:28Z
# Updated: 2025-02-09T01:38:09Z

@regression @shell @roles @privileges @flights @related-files
Feature: 37133 - Upload files to trip
  As a corporate traveller with the upload-files-to-trip privilege
  I want to open the Related Files tab on a trip and control the "include in itinerary email" option
  So that I can manage trip-related documents and decide whether they are sent with the itinerary email

  Scenario: Open the Related Files tab and toggle include in itinerary email on a flight trip
    Given I am logged in as "pini@upfl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I click proceed button if visible
    And I wait for add to trip text to be visible
    And I add the first flight to cart
    And I open the trip related files tab
    # The include-in-itinerary-email checkbox renders per uploaded file, so a file must be present first
    And I upload the file "sample-document.pdf" to the trip related files
    Then the include in itinerary email option should be visible in the trip related files
