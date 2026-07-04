# Test Name: 23072 Request Assistance - hotel params populated by the search + comments on hotel car and EU rail appear on requests + Financial reference does not appear on pop up if not assigned to the user group
# Description:
# Status: Active
# Labels: Request Assistance,No Amadeus Hotel Book,Regression,Hotel,Cars,NL government,Financial Reference Code,never failed,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2023-12-20T01:35:46Z
# Updated: 2025-12-10T09:23:08Z

@regression @shell @request_assistance @hotel @cars @rails @dynamic_fields
Feature: 23072 - Request Assistance hotel params populated by search with comments on hotel, car and EU rail plus financial reference hidden when not assigned to the user group

  As a corporate traveler
  I want to raise a request assistance for a hotel, a car and an EU rail journey with comments
  So that the searched hotel details and my per-item comments are sent to the agent and only the reference fields assigned to my user group are shown

  Scenario: Send a request assistance for hotel, car and rail with comments and validate the review popup and trip requests
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    When I add a traveler by name "ofira refer" from the search autocomplete
    # TODO: I select the hotel search tab (HotelSearch.selectHotelTab in tests/steps/hotel_search.steps.js)
    And I select the hotel search tab
    And I type "london" in the hotel search location field
    # TODO: I confirm the typed hotel destination (HotelSearch.confirmDestinationWithTab in tests/steps/hotel_search.steps.js)
    And I confirm the typed hotel destination
    # TODO: I open the hotel check-in date picker (HotelSearch.openCheckInDatePicker in tests/steps/hotel_search.steps.js)
    And I open the hotel check-in date picker
    # TODO: I navigate the hotel calendar to the next month (HotelSearch.navigateCalendarNextMonth in tests/steps/hotel_search.steps.js)
    And I navigate the hotel calendar to the next month
    # TODO: I navigate the hotel calendar to the next month (HotelSearch.navigateCalendarNextMonth in tests/steps/hotel_search.steps.js)
    And I navigate the hotel calendar to the next month
    # TODO: I select the hotel check-in date (HotelSearch.selectCheckInDateCell in tests/steps/hotel_search.steps.js)
    And I select the hotel check-in date
    # TODO: I select the hotel check-out date (HotelSearch.selectCheckOutDateCell in tests/steps/hotel_search.steps.js)
    And I select the hotel check-out date
    And I click the request assistance icon
    # TODO: the request assistance hotel destination should contain "London" (TravelRequest.verifyRequestAssistanceHotelDestination in tests/steps/travel_request.steps.js)
    Then the request assistance hotel destination should contain "London"
    # TODO: I add the comment "bla bla 2" to the request assistance hotel item (TravelRequest.addHotelRequestComment in tests/steps/travel_request.steps.js)
    When I add the comment "bla bla 2" to the request assistance hotel item
    # TODO: I add a car to the request assistance (TravelRequest.addCarToRequestAssistance in tests/steps/travel_request.steps.js)
    And I add a car to the request assistance
    # TODO: I open the car pick-up location autocomplete in the request assistance (TravelRequest.openCarLocationAutocomplete in tests/steps/travel_request.steps.js)
    And I open the car pick-up location autocomplete in the request assistance
    # TODO: I type "madrid" as the car pick-up location in the request assistance (TravelRequest.typeCarLocation in tests/steps/travel_request.steps.js)
    And I type "madrid" as the car pick-up location in the request assistance
    # TODO: I select the car pick-up location from the autocomplete in the request assistance (TravelRequest.selectCarLocationSuggestion in tests/steps/travel_request.steps.js)
    And I select the car pick-up location from the autocomplete in the request assistance
    # TODO: I open the car pick-up date picker in the request assistance (TravelRequest.openCarPickUpDatePicker in tests/steps/travel_request.steps.js)
    And I open the car pick-up date picker in the request assistance
    # TODO: I navigate the car calendar to the next month in the request assistance (TravelRequest.navigateCarCalendarNextMonth in tests/steps/travel_request.steps.js)
    And I navigate the car calendar to the next month in the request assistance
    # TODO: I select the car pick-up date in the request assistance (TravelRequest.selectCarPickUpDate in tests/steps/travel_request.steps.js)
    And I select the car pick-up date in the request assistance
    # TODO: I open the car pick-up time field in the request assistance (TravelRequest.openCarPickUpTime in tests/steps/travel_request.steps.js)
    And I open the car pick-up time field in the request assistance
    # TODO: I enter "10:00" as the car pick-up time in the request assistance (TravelRequest.setCarPickUpTime in tests/steps/travel_request.steps.js)
    And I enter "10:00" as the car pick-up time in the request assistance
    # TODO: I confirm the car pick-up time in the request assistance (TravelRequest.confirmCarPickUpTime in tests/steps/travel_request.steps.js)
    And I confirm the car pick-up time in the request assistance
    # TODO: I open the car drop-off date picker in the request assistance (TravelRequest.openCarDropOffDatePicker in tests/steps/travel_request.steps.js)
    And I open the car drop-off date picker in the request assistance
    # TODO: I select the car drop-off date in the request assistance (TravelRequest.selectCarDropOffDate in tests/steps/travel_request.steps.js)
    And I select the car drop-off date in the request assistance
    # TODO: I open the car drop-off time field in the request assistance (TravelRequest.openCarDropOffTime in tests/steps/travel_request.steps.js)
    And I open the car drop-off time field in the request assistance
    # TODO: I enter "11:00" as the car drop-off time in the request assistance (TravelRequest.setCarDropOffTime in tests/steps/travel_request.steps.js)
    And I enter "11:00" as the car drop-off time in the request assistance
    # TODO: I confirm the car drop-off time in the request assistance (TravelRequest.confirmCarDropOffTime in tests/steps/travel_request.steps.js)
    And I confirm the car drop-off time in the request assistance
    # TODO: I open the car comment field in the request assistance (TravelRequest.openCarRequestComment in tests/steps/travel_request.steps.js)
    And I open the car comment field in the request assistance
    # TODO: I add the comment "carrr 3" to the request assistance car item (TravelRequest.addCarRequestComment in tests/steps/travel_request.steps.js)
    And I add the comment "carrr 3" to the request assistance car item
    # TODO: I add a rail journey to the request assistance (TravelRequest.addRailToRequestAssistance in tests/steps/travel_request.steps.js)
    And I add a rail journey to the request assistance
    # TODO: I type "bruss" as the rail origin station in the request assistance (TravelRequest.typeRailOrigin in tests/steps/travel_request.steps.js)
    And I type "bruss" as the rail origin station in the request assistance
    # TODO: I select the rail origin station from the autocomplete in the request assistance (TravelRequest.selectRailOriginSuggestion in tests/steps/travel_request.steps.js)
    And I select the rail origin station from the autocomplete in the request assistance
    # TODO: I type "paris" as the rail destination station in the request assistance (TravelRequest.typeRailDestination in tests/steps/travel_request.steps.js)
    And I type "paris" as the rail destination station in the request assistance
    # TODO: I select the rail destination station from the autocomplete in the request assistance (TravelRequest.selectRailDestinationSuggestion in tests/steps/travel_request.steps.js)
    And I select the rail destination station from the autocomplete in the request assistance
    # TODO: I open the rail departure date picker in the request assistance (TravelRequest.openRailDepartureDatePicker in tests/steps/travel_request.steps.js)
    And I open the rail departure date picker in the request assistance
    # TODO: I navigate the rail calendar to the next month in the request assistance (TravelRequest.navigateRailCalendarNextMonth in tests/steps/travel_request.steps.js)
    And I navigate the rail calendar to the next month in the request assistance
    # TODO: I select the rail departure date in the request assistance (TravelRequest.selectRailDepartureDate in tests/steps/travel_request.steps.js)
    And I select the rail departure date in the request assistance
    # TODO: I open the rail return date picker in the request assistance (TravelRequest.openRailReturnDatePicker in tests/steps/travel_request.steps.js)
    And I open the rail return date picker in the request assistance
    # TODO: I select the rail return date in the request assistance (TravelRequest.selectRailReturnDate in tests/steps/travel_request.steps.js)
    And I select the rail return date in the request assistance
    # TODO: I open the rail comment field in the request assistance (TravelRequest.openRailRequestComment in tests/steps/travel_request.steps.js)
    And I open the rail comment field in the request assistance
    # TODO: I add the comment "railll4" to the request assistance rail item (TravelRequest.addRailRequestComment in tests/steps/travel_request.steps.js)
    And I add the comment "railll4" to the request assistance rail item
    # TODO: I send the request assistance (TravelRequest.sendRequestAssistance in tests/steps/travel_request.steps.js)
    And I send the request assistance
    # TODO: the travel request review should display the field label "Type of traveller      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    Then the travel request review should display the field label "Type of traveller      info"
    # TODO: the travel request review should display the field label "*      Location travel policy      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    And the travel request review should display the field label "*      Location travel policy      info"
    # TODO: the travel request review should display the field label "Location      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    And the travel request review should display the field label "Location      info"
    # TODO: the travel request review should display the field label "Personnel number      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    And the travel request review should display the field label "Personnel number      info"
    # TODO: the travel request review should display the traveler name "Ofira  Refer" (TravelRequest.verifyReviewTravelerName in tests/steps/travel_request.steps.js)
    And the travel request review should display the traveler name "Ofira  Refer"
    # TODO: the travel request review should display the field label "*      Payment Group      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    And the travel request review should display the field label "*      Payment Group      info"
    # TODO: the travel request review should display the field label "Bank account      info" (TravelRequest.verifyReviewFieldLabel in tests/steps/travel_request.steps.js)
    And the travel request review should display the field label "Bank account      info"
    # TODO: the financial reference field should not be displayed in the travel request popup (TravelRequest.verifyFinancialReferenceNotDisplayed in tests/steps/travel_request.steps.js)
    And the financial reference field should not be displayed in the travel request popup
    # TODO: I confirm and send the travel request in the popup (TravelRequest.confirmSendRequestPopup in tests/steps/travel_request.steps.js)
    When I confirm and send the travel request in the popup
    Then the "Sent to agent" confirmation should be displayed
    When I navigate to the trip from the travel request
    # TODO: the requested hotel item should be displayed in the trip (TravelRequest.verifyRequestedItemTitle in tests/steps/travel_request.steps.js)
    Then the requested hotel item should be displayed in the trip
    # TODO: the requested hotel item comment should be "bla bla 2" (TravelRequest.verifyRequestedItemComment in tests/steps/travel_request.steps.js)
    And the requested hotel item comment should be "bla bla 2"
    # TODO: the requested car item should be displayed in the trip (TravelRequest.verifyRequestedItemTitle in tests/steps/travel_request.steps.js)
    And the requested car item should be displayed in the trip
    # TODO: the requested car item comment should be "carrr 3" (TravelRequest.verifyRequestedItemComment in tests/steps/travel_request.steps.js)
    And the requested car item comment should be "carrr 3"
    # TODO: the requested rail item should be displayed in the trip (TravelRequest.verifyRequestedItemTitle in tests/steps/travel_request.steps.js)
    And the requested rail item should be displayed in the trip
    # TODO: the requested rail item comment should be "railll4" (TravelRequest.verifyRequestedItemComment in tests/steps/travel_request.steps.js)
    And the requested rail item comment should be "railll4"
