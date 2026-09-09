# ADO Test Case ID: 82591
# Test Name: 82591 Quotes a New "Copied" State Instead of Excluding NDC/LCC
# Status: Design
# Owner: Yael Alef
@ado:82591 @regression @flights @general @copy-trip @ndc @lcc @fusion @lufthansa @priority:critical
Feature: 82591 Copy trip - NDC and LCC quotes are copied in a "Copied" state

  As a corporate booker copying a trip that holds NDC and low-cost content
  I want those quotes copied into the new trip with a "Copied" status rather than excluded from it
  So that I can re-price them on the copy and carry on booking

  Scenario: A Fusion low-cost and a Lufthansa NDC quote are copied as "Copied" and re-price into new Pending booking quotes
    Given I am logged in as "cop@trip.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to add a flight to my trip from cart
    And I search for a one way flight from "MUC" to "FRA"
    And flight results should be available
    And I filter results by carrier "LH"
    And I add the first flight to cart
    Then the cart should contain 2 flight quotes
    When I open the copy trip dialog
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    And all products in the copy trip dialog should show status "Pending booking"
    When I confirm the copy trip
    And I work on the copied trip
    Then the cart should contain 2 flight quotes
    And quote 1 status should be "Copied"
    And quote 2 status should be "Copied"
    When I add a guest traveller to the trip named "Nora Pereira" with email "nora.pereira@atriistech.com"
    And I click check price on quote 1
    Then the price check should offer to proceed
    When I click proceed on the price check dialog
    And I click check price on quote 2
    Then the price check should offer to proceed
    When I click proceed on the price check dialog
    Then the cart should contain 2 flight quotes
    And quote 1 status should be "Pending booking"
    And quote 2 status should be "Pending booking"
