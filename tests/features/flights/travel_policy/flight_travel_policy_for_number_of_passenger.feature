
@provider:travelpolicy @user:user_one
Feature: Flight Booking - Travel Policy for Number of Passengers

  Background:
    Given I am logged in and ready to book a new trip

  Scenario: Book a round-trip flight for three travelers and validate policy restrictions
    And I add myself as the traveler
    And I add a traveler named "Poly Mispar"
    And I add a traveler named "Amber Ofpas"
    And I search for round-trip flights from "MAD" to "PAR"
    Then I should see "Add to trip" button on the first flight

    And I add the first flight to cart

    Then I should see a popup with title "Flight Capacity Restriction"
    And I should see message "You have reached the maximum number of passengers allowed on a single flight."
    And I should see "Go back" button
    And I should see "Proceed anyway" button

    # TODO: Implement step to click the "Go back" button in the popup
    When I click the "Go back" button in the popup

    Then I should see the out-of-policy badge

    # TODO: Implement step to hover over the info icon
    When I hover over the out-of-policy info icon
    Then I should see tooltip "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only"

    # TODO: Implement step to click the "Add to trip" button again
    When I click the "Add to trip" button again

    Then I should see a popup with title "Flight Capacity Restriction"
    And I should see message "You have reached the maximum number of passengers allowed on a single flight."
    And I should see "Proceed anyway" button

    # TODO: Implement step to click the "Proceed anyway" button in the popup
    When I click the "Proceed anyway" button in the popup

    # TODO: Implement step to handle conflict with previous trip
    And I proceed if there is a conflict with previous trip

    Then I should see "Pending booking" text
    And I should see the out-of-policy badge on the cart page

    # TODO: Implement step to hover over the info icon on the cart page
    When I hover over the out-of-policy info icon on the cart page
    Then I should see tooltip "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only"