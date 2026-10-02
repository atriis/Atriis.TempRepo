# Test Name: 75086 New Approver Email
# Description:
# Status: Design
# Labels:
# Owner: Pini Harush
# Related: 69594 [EMAILS] New approval request email

@regression @shell @approval_flow @email
Feature: 75086 Approval Flow - New approver email shows the cost, time limit, reference fields and approval cycle
  As an approver of a GDG traveller's flight, hotel and car trip
  I want the approval request email to summarise the trip
  So that I can see the total cost, the time limit, the reference fields and the approval cycle before I approve

  #BLOCKED - No consistent results for flight due an issue today
  Scenario: The approval request email for a flight, hotel and car trip shows the trip summary
    Given I am logged in as "app@mail.flow" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "MAD"
    And I add the first flight to cart
    And flight results should be available
    And I filter results by carrier "IB"
    And the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "MAD" for 2 nights from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart
    When I click to add a car to my trip from cart
    And I search for a car with 1 months ahead from the cart drawer
    And I add the first car to cart
    And I extract the total cart summary price
    When I click the proceed to checkout button
    And I select the "Financial Reference" reference field as "app mail" and proceed
    And I wait for booking details in checkout
    And I fill in the "Promoted" reference field with "vv"
    And I fill in the "Default" reference field with "vv"
    And I send booking for approval
    Then the approval request email for this trip should be received at "atriis-qa@mailsac.com"
    And the received approval request email should show the total cost noted in cart
    And the received approval request email should contain:
      | Time limit:                         |
      | Promoted: vv                        |
      | Internal Reference                  |
      | Default: vv                         |
      | Financial reference name: app mail  |
      | Financial reference code: app mail  |
    And the approval cycle in the received approval request email should be "Coori Coor, Bill Corpland, Lili Atry"
