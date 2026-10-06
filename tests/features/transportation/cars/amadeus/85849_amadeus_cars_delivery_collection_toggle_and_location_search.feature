# ADO User Stories: 84136 (Allow D&C agreement setting) + 84137 (D&C toggle & location autocomplete)
# Precondition (GTP Admin, US 84136): TMC Amsalem Corp > corporate PedroCarneiro > Amadeus car
# agreement "Automation - ET isPrePaid" has "Allow D&C" checked. The admin checkbox itself lives in
# the legacy GTP Admin Center and is checked through its effect: the D&C toggle in car search.
# ADO Test Case ID: 85849
@ado:85849
@transportation @cars @regression @provider:amadeus @delivery-collection
Feature: 85849 Amadeus Cars - Delivery & Collection toggle and location search for an agreement with Allow D&C

  @priority:high
  Scenario: Allow D&C on the agreement shows the D&C toggle and a Hertz-free D&C location search
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I open the car search
    Then the Delivery & Collection toggle should be displayed and switched off
    And the car "pick-up" location should use the "standard" location search
    When I switch on the Delivery & Collection toggle
    Then the car "pick-up" location should use the "delivery and collection" location search
    # The D&C place search only runs from 3 characters
    When I type "Lo" in the Delivery & Collection "pick-up" location
    Then no Delivery & Collection location suggestions should be displayed
    When I type "Zzqxw" in the Delivery & Collection "pick-up" location
    Then no Delivery & Collection location suggestions should be displayed
    When I type "London" in the Delivery & Collection "pick-up" location
    Then the Delivery & Collection "pick-up" suggestions should show the address, city, country and location type of each place returned
    And the Delivery & Collection "pick-up" location search should exclude Hertz and list each place once
    When I select the first Delivery & Collection "pick-up" location
    # The return location uses the same D&C source when dropping off elsewhere
    And I tick drop-off at a different location
    Then the car "drop-off" location should use the "delivery and collection" location search
    When I type "London" in the Delivery & Collection "drop-off" location
    Then the Delivery & Collection "drop-off" suggestions should show the address, city, country and location type of each place returned
    And the Delivery & Collection "drop-off" location search should exclude Hertz and list each place once
    # Switching D&C off clears the D&C picks and reverts to the standard airport/city search
    When I switch off the Delivery & Collection toggle
    Then the car "pick-up" location should use the "standard" location search and be empty
    And the car "drop-off" location should use the "standard" location search and be empty
    When I switch on the Delivery & Collection toggle
    And I type "Glasgow, 101 Waterloo Street, Glasgow, GB" in the Delivery & Collection "pick-up" location
    And I select the first Delivery & Collection "pick-up" location
    And I type "Glasgow" in the Delivery & Collection "drop-off" location
    # A different place than the pick-up, so the drop-off coordinates prove the return D&C pick is used
    And I select Delivery & Collection "drop-off" location number 2
    And I search for a car at the selected locations with 1 months ahead
    # Interim D&C search runs on the selected places' coordinates; Car_Availability on the D&C
    # location codes comes with US 84154
    When I capture the "request" payload for request type "Amadeus4.Car_Availability" from Storage
    Then the captured "request" payload for request type "Amadeus4.Car_Availability" should contain "PUP".block("locationType")
    Then the captured "request" payload for request type "Amadeus4.Car_Availability" should contain "1A".block("code")
    Then the captured "request" payload for request type "Amadeus4.Car_Availability" should contain "GLAC01".block("name")
    
