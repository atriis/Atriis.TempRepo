# Test Name: 55591 Related Files - Related files can be downloaded
# Description:
# Status: Active
# Labels: UI,related files,Regression,Cart,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-16T01:47:05Z
# Updated: 2024-12-16T02:36:29Z

@regression @shell @flights @ui
Feature: 55591 - Related files can be downloaded
  As a corporate traveler
  I want to upload a file to the trip related files section and then download it
  So that I can verify that related files attached to a trip are accessible and downloadable

  Scenario: A related file uploaded to a trip can be downloaded from the related files tab
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I upload the file "sample-document.pdf" to the trip related files
    Then the file "sample-document.pdf" should be visible in the trip related files section
    When I click the related file "sample-document.pdf" to download it
    Then the file "sample-document.pdf" should have been downloaded
    Then I successfully cancel the trip
