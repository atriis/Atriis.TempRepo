# Test Name: 77102 Amadeus NDC - Sending FQTV once in OrderCreate
# Description: Hold an American Airlines flight booked through Amadeus NDC for two travellers who
# each have an AA frequent flyer number. The AMA_TravelOrderCreateRQ request must carry each
# traveller's frequent flyer number exactly once - one LoyaltyProgramAccount per Pax. Bug 79170
# sent the FQTV more than once for a traveller in OrderCreate.
#
# Verified against trip 3923080 on staging: PAX1 (the booker) carries AA F263M50 and PAX2 (Barbara
# Lyster) carries AA NC43150, one LoyaltyProgramAccount each.
# Labels: Amsalem,Amadeus NDC,Flights,Regression,FQTV,Payload
# Owner: Noam Miller

# ADO Test Case ID: 77102
@ado:77102 @bug:79170 @regression @flights @amadeus @ndc @fqtv @payload @hold-flight
Feature: 77102 Amadeus NDC - Sending FQTV once in OrderCreate
  As a corporate booker holding an Amadeus NDC flight for several travellers
  I want each traveller's frequent flyer number sent to the airline exactly once
  So that the order is created cleanly and every traveller earns their miles

  Scenario: Each of two travellers carries their frequent flyer number once in the order create request
    Given I am logged in as "aafqtv1@amsCorp.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Barbara Lyster"
    When I search for a one way flight from "DFW" to "CLT" with preferred carrier "AA"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then every one of the 2 passengers in the "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" request should carry their frequent flyer number exactly once
    And I successfully cancel the trip
