# ADO Test Case ID: 80260
@regression @provider:ehotel @ado:80260
Feature: 80260 eHotel - Web confirmation email follows the traveler exception
  As a corporate traveler booking for myself where a web confirmation exception is configured
  I want the hotel booking request to carry the exception email
  So that confirmation emails go to the correct address and not to the booking user

  @priority:high
  Scenario: Hotel booking request contains the traveler exception email and not the user email
    Given I am logged in as "Shani@Webconformationtestim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And I log the trip number from the URL
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
    When I capture the "request" payload for request type "hotelRes" from Storage
    Then the captured "request" payload for request type "hotelRes" should contain "travelerwith@exceptiononehotel.com".block("ResGuests")
    And the captured "request" payload for request type "hotelRes" should contain "travelerwith@exceptiononehotel.com".block("ResGlobalInfo")
    And the captured "request" payload for request type "hotelRes" should not contain "Shani@Webconformationtestim.com"


