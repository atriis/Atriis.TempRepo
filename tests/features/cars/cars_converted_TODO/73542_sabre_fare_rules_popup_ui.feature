@transportation @cars @regression @provider:sabre
Feature: 73542 Sabre - Fare Rules Popup UI - Vendor And Location Details Tab

  @priority:high
  Scenario: Verify fare rules are displayed throughout the booking flow for Sabre cars
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    And I search for a car at "MXP"
    And I wait for add to trip text to be visible
    And I click on the terms and conditions link in the car results
    Then the terms and conditions modal should display the "Rate summary" section
    And I extract and store the fare rules text from results
    And I click vendor and location details tab
    Then the terms and conditions modal should display the "Location Summary" section
    And I extract and store the location details text from results
    And I close the terms and conditions modal
    When I add the first car to cart
    And the booking status should be "Pending booking"
    When I click on the terms and conditions link in the cart
    And I extract and store the fare rules text from cart
    Then the fare rules from results match fare rules from cart
    And I click vendor and location details tab
    And I extract and store the location details text from cart
    Then the vendor and location text from results match vendor and location text from cart
    And I close the terms and conditions modal
    And I proceed to checkout
    And I complete the booking
    And the booking status should be "Confirmed"
    When I click on the terms and conditions link in the cart
    And I extract and store the fare rules text from cart after booking
    Then the fare rules from results match fare rules from cart after booking
    And I click vendor and location details tab
    And I extract and store the location details text from cart after booking
    Then the vendor and location text from results match vendor and location text from cart after booking
    And I close the terms and conditions modal
    And I successfully cancel the trip with 60 seconds wait
