@transportation @cars @regression @provider:galileo
Feature: 47724 Galileo Car Images Displayed Correctly in Results Page

  Scenario: Verify car images are displayed in search results
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    And I search for a car at "Zurich, (ZRH) Switzerland"
    And I wait for add to trip text to be visible
    # Galileo sends an availability search and a separate media links call for the car photos
    When I capture the "request" payload for request type "VehicleSearchAvailabilityReq" from Storage
    And I capture the "response" payload for request type "VehicleMediaLinksReq" from Storage
    Then the captured "response" payload for request type "VehicleMediaLinksReq" should contain "MediaItem url="
    # The card shows the link from the media links reply, or the default image when that link is broken
    And the first car result image should come from the "response" payload for request type "VehicleMediaLinksReq"
