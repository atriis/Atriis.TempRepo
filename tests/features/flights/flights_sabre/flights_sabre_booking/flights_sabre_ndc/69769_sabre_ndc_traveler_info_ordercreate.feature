# Test Name: 69769: Sabre NDC - Correctly sending traveler info in OrderCreate RQ
# Status: Active
# Labels: Sabre NDC,Frosch,Flights,Regression,hold flight,Search Flight,APIS,2026 plan 2
# Owner: Noam Miller
# Created: 2025-11-04T10:19:02Z
# Updated: 2026-02-16T12:48:49Z

@regression @flights @sabre-ndc @hold-flight @payload
Feature: 69769 Sabre NDC - Correctly sending traveler info in OrderCreate RQ
  As a corporate traveler
  I want to hold a Sabre NDC flight with multiple travelers
  So that the traveler information is correctly sent in the order creation

  Scenario: Sabre NDC flight hold with multiple travelers sends correct info
    Given I am logged in as "corp@sabreNdc.frosch" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Lauren"
    When I search for a round trip flight from "LAX" to "NYC"
    Then flight results should be available
    And the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
    When I capture the "request" payload for request type "Sabre NDC Order Create" from Storage
    # Passenger1 is the booker (Teresa Grace Webber). The passenger node carries givenName, middleName
    # and surname; titleName is only sent inside the identity document, next to its own name copy.
    Then in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].id" should contain "Passenger1"
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].givenName" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].middleName" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].surname" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].identityDocuments[0].titleName" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].identityDocuments[0].citizenshipCountryCode" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[0].identityDocuments[0].placeOfIssue" should contain "VG"
    # Passenger2 is Lauren: the Known Traveler document (K) must come first, then the passport (PT).
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].id" should contain "Passenger2"
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].givenName" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].surname" should exist
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].identityDocuments[0].documentTypeCode" should contain "K"
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].identityDocuments[1].documentTypeCode" should contain "PT"
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].identityDocuments[1].citizenshipCountryCode" should contain "US"
    And in the captured "request" payload for request type "Sabre NDC Order Create", path "passengers[1].identityDocuments[1].placeOfIssue" should contain "US"
