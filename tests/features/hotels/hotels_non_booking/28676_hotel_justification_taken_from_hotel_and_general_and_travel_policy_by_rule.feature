# Test Name: 28676 MERGED hotel justification appears in cart and taken from hotel and general +travel policy by rule (using dynamic and reference fields)
# Description: 
# Status: Active
# Labels: Travel policy,justification,Hotel,NL government,OOP,Regression,Amadeus Value hotel,Dynamic fields,Reference Fields,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T06:49:20Z
# Updated: 2025-11-10T12:47:08Z

@regression @provider:general
Feature: 28676 - Hotel justifications are taken hotel justification and general justification and travel policy determined by rule
  As a corporate traveler who selects an out-of-policy hotel
  I see justifications in cart according to the hotel justifications and the general justifications from administration
  I can't continue to book without filling justification
  As a corporate user with travel policy by rule (using dynamic and reference fields) in the administration 
  I see the correct travel policy

  @priority:critical
  Scenario: OOP hotel justifications are taken correctly from the administration, and mandatory, and travel policy is according to the rule
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "justin ruly"
    When I initiate a hotel search in "london" for 1 night
    And I select the "Type of Trip" reference field as "Medical leave" and proceed
    And I wait to see view rates text in results page
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hotel cost per night is greater than or equals 20 EUR"
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hotel cost per night is greater than or equals 20 EUR"
    And I add a refundable room to my cart
    Then the out of policy indicator should be visible in cart
    Then the out of policy tooltip in cart should be "Hotel cost per night is greater than or equals 20 EUR"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    When I open the OOP justification dropdown and verify there are 6 options
    Then the OOP justification dropdown should contain the following options:
      | Breakfast is included in rate                     |
      | general a                                         |
      | general b                                         |
      | Hotel is combined with a economy ticket           |
      | No hotel available within a short radius of venue |
      | No hotel available within rate limits             |

