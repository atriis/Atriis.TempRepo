# ADO #78659 - [cars][SunnyCars] Missing customer phone number
# Reference: User Story #78659
# TC-1 (happy-path, critical) generated from the User Story - see e2e-test-pipeline Phase 1C
# ADO Test Case ID: 84723
@ado:84723
@regression @transportation @cars @provider:sunnycars @ado:78659 @priority:critical
Feature: 84723 SunnyCars - Agency booking sends driverMobilePhoneNumber matching the customer's phone number
  As a corporate traveler booking a SunnyCars rental through an Agency-type account
  I want the driver's mobile phone number to be populated with my own phone number
  So that SunnyCars can reach the driver in case of an issue with the rental

  Scenario: SunnyCars Agency booking populates driverMobilePhoneNumber with the customer's phone number
    Given I am logged in as "automation@sunnycar.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Dr. Francisco de Sa Carneiro (OPO), Porto, Portugal" with rental agency "SunnyCars" and 2 months ahead
    And I add the first "Instant Confirmation" car to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    When I capture the "request" payload for request type "CreateReservationV2" from Storage
    Then the captured "request" payload for request type "CreateReservationV2" should contain "DriverMobilePhoneNumber"
    And the captured "request" payload for request type "CreateReservationV2" should contain "351915478971".onKey("DriverMobilePhoneNumber")
    And the captured "request" payload for request type "CreateReservationV2" should contain "351915478971".onKey("CustomerMobilePhoneNumber")
    Then I successfully cancel the trip