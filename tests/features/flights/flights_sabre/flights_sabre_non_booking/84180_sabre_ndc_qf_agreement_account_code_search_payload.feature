@regression @flights @sabre @sabre-ndc @payload
Feature: 84180 Attach the Corporate ABN/QCI to Every Qantas Sabre NDC Shopping Request
  As a corporate traveler with a Sabre NDC Qantas agreement
  I want my QF agreement account code sent in the NDC flight search
  So that Qantas returns the agreement fares my company is entitled to

  Scenario: Round trip Sabre NDC search sends the QF agreement account code
    Given I am logged in as "QF@sabre.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "SYD" to "MEL"
    Then flight results should be available
    When I capture the "request" payload for request type "Sabre NDC Flight Search FSP92*" from Storage
    Then the captured "request" payload for request type "Sabre NDC Flight Search FSP92*" should contain the JSON:
      """
      {
        "OTA_AirLowFareSearchRQ": {
          "TravelPreferences": {
            "TPA_Extensions": {
              "NDCIndicators": {
                "CarrierSpecificQualifiers": [
                  {
                    "CarrierCode": "QF",
                    "AccountCodes": ["FSP92"]
                  }
                ]
              }
            }
          }
        }
      }
      """
