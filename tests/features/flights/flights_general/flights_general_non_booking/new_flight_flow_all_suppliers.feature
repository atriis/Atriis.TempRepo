

@flights
Feature: Complete a round trip search and add to cart via pricing options with the new flight flow

  As a corporate traveler 
  I want to search and add to cart a round trip flight via pricing options with the new flight flow
  So that I must go through pricing options to complete the search for both outbound and inbound legs

  Scenario Outline: All Suppliers - Complete a round trip search and add to cart via pricing options with the new flight flow
    Given I am logged in as "<user>" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "<origin>" to "<destination>"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    #Same selector for "Select flight" and "Select", that's why this function was reused here
    When I select one flight segment by schedule
    And I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"

    Examples:
      | user                              | origin | destination |
      | corp.amadeus.nff@amsalem.com      | LIS    | LON         |
      | corp.amadeusligth.nff@amsalem.com | DUB    | BUD         |
      | corp.sabrendc.nff@amsalem.com     | LIS    | FRA         |
      | corp.lhndc.nff@amsalem.com        | BER    | LON         |
      | mike@ndc.com                      | MAD    | AMS         |
      | corp.afklndc.nff@amsalem.com      | CDG    | AMS         |
      | corp.uandc.nff@amsalem.com        | JFK    | LON         |
      | val.frosch@ndc.com                | LIS    | CHI         |
      | corp.sabre.nff@frosch.com         | LIS    | LON         |
      | corp.galileo.nff@gdg.com          | LON    | BER         |
      | corp.bandc.nff@gdg.com            | LON    | GVA         |
      | amsnewflowfusion@ra.com           | LON    | MLE         |
      | corp.ypsilon.nff@amsalem.com      | BCN    | LON         |
      
