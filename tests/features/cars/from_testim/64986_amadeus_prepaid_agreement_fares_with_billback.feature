@transportation @cars @regression @amadeus @enterprise @billback
Feature: Amadeus - Pre-paid text is displayed for agreement fares when bill back enabled

  Scenario: Verify pre-paid text displays for agreement fares in enterprise with billback
    Given I am logged in as "danielalmeida"
    And I book a new trip
    And I add myself as the traveler
    And I select Enterprise agency
    When I search for a car at "LHR"
    And I wait for "Add to trip" text to appear on car results
    Then agreement text is displayed in the rate tooltip
    And "Pre-paid" text is displayed for agreement fares in results
    When I add the first car to cart
    And I wait for pending booking
    Then "Pre-paid" text is displayed for agreement fares in cart
