# Test Name: 35003 Southwest - Corporate, By Schedule, mixed brands > Brand info
# Status: Design
# Labels: Regression,Flights,Sabre,Branding,by schedule,payload

# ADO Bugs: #72863 / #82085 (popup showed another brand's features), #86388 (cart Flight Details popup
# shows "Brand information is currently unavailable")
# Source system: Sabre (classic) | Carrier: Southwest (WN) | User: southwest@corp.com
# Southwest brands are BASIC, CHOICE, CHOICE PREFERRED and CHOICE EXTRA. The test case's attached
# spreadsheet still lists the retired Wanna Get Away / Anytime / Business Select brands, so the
# expected features are read from Sabre instead: the RevalidateItinerary responses that opening the
# brand fires file, per brand, the BrandFeatureRef ids of its Free / Chargeable features.
# The by-schedule results open the classic Pricing Options drawer leg by leg; "Additional Pricing
# Options" in the test case is today's "Select flight" on a result card.
# The hold needs the user's Sabre profile: on stg it failed with "Profile locator is invalid" on 2026-10-07.

# ADO Test Case ID: 35003
@regression @flights @sabre @branded-fares @by-schedule @payload @priority:high @ado:35003 @ado:86388
Feature: 35003 Sabre - Southwest by schedule with mixed brands shows each brand's features
  As a corporate traveller booking Southwest by schedule
  I want the brand popup to show the features of the brand I picked, in pricing options and in the cart
  So that I know what is included in my fare before and after I hold it

  Scenario: CHOICE out and BASIC back show their Sabre brand features in pricing options, cart and after hold
    Given I am logged in as "southwest@corp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "SAN" to "LAS" with preferred carrier "Southwest Airlines"
    And I select the first flight result in new flight flow
    And I wait for the outbound leg in pricing options page
    And I note the time before new payload requests are sent
    And I open branded fares for the "CHOICE" fare from pricing options
    Then the branded fares drawer should show the "CHOICE" features Sabre filed for that brand
    When I close branded fares drawer
    And I select the pricing option containing "CHOICE"
    And I confirm the pricing option for the current segment
    # By schedule: the return is picked from its own results, in a drawer that holds only that leg.
    And I select the first flight result in new flight flow
    And I wait for the outbound leg in pricing options page
    And I select the pricing option containing "BASIC"
    And I confirm the pricing option for the current segment
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    And I note the time before new payload requests are sent
    And I open branded fares for the "CHOICE" brand from flight details
    Then the branded fares drawer should show the "CHOICE" features Sabre filed for that brand
    When I close branded fares drawer in cart
    And I note the time before new payload requests are sent
    And I open branded fares for the "BASIC" brand from flight details
    Then the branded fares drawer should show the "BASIC" features Sabre filed for that brand
    When I close branded fares drawer in cart
    And I close flight details window
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I hold the trip
    When I open flight details in cart
    And I note the time before new payload requests are sent
    And I open branded fares for the "CHOICE" brand from flight details
    Then the branded fares drawer should show the "CHOICE" features Sabre filed for that brand
    When I close branded fares drawer in cart
    And I close flight details window
    Then I successfully cancel the trip
