# Test Name: Fusion (OBT) - When no RBD, Map Economy to cabin code Y, Mixed carrier
# Status: Active
# Labels: Flights,Fusion,Regression,Full Purchase,multi city,GetTrip
# Owner: Noam Miller
# Created: 2026-03-10T14:08:35Z
# Updated: 2026-10-07T00:00:00Z

@regression @flights @fusion @full-purchase @multi-city @priority:medium
Feature: 74709 Fusion - Flight with no RBD maps Economy to cabin code Y on a mixed-carrier trip
  As a corporate traveler booking an Aer Lingus + Wizz Air multi-city trip via Fusion
  I want each flight's booking class and cabin code recorded correctly in GetTrip
  So that a carrier without a SupplierRBDCode (Wizz Air) still reports Economy as class Y

  # CheckRouting returns SupplierRBDCode for Aer Lingus but not for Wizz Air; for Wizz Air the
  # TfClass free text ("Economy With Restrictions") has to be translated into cabin code Y.
  # GetTrip is read with the booker's own app session, replacing the manual Postman call.
  Scenario: Book an Aer Lingus + Wizz Air Fusion multi-city trip and check flight classes in GetTrip
    Given I am logged in as "fusionCorp@reg.ams" booking a new trip
    And I start recording the app session for the GetTrip API
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "DUB-FCO, FCO-BUD"
    And I click proceed button if visible
    Then flight results should be available
    When I add the first flight flown by "EI, W6" to cart
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I complete the booking with Fusion credit card verification
    Then the quote destination should contain "Flight to"
    When I fetch the trip through the GetTrip API
    Then every GetTrip "EI" flight should keep the searched booking class and have cabin class code "Y"
    And every GetTrip "W6" flight should have flight class "Y" and cabin class code "Y"
