# Test Name: 76084: [Hybrid] OBT- Amadeus- Light Ticketing- Remarks sent before ticketing (pnr remarks, reference field and dynamic answers)
# Description: Corp 74010-Light Ticket Remarks (TMC Amsalem) maps each answer to an Amadeus channel:
#   PNR_AddMultiElements - 74010 Corp General, 74010 Special Characters (general remarks), 74010 Dynamic Profile Field 1 (RM*)
#   Command_Cryptic      - 74010 low cost (Flights LCC), 74010 Cryptic (Dynamic Profile Field 2)
#   Not shown            - 74010 NDC, 74010 EDIFACT, 74010 Hotel, Galileo Historical, Sabre Historical
#   The two dynamic profile fields come prefilled from the traveler's profile.
# Status: Design
# Labels: Hybrid,TESTIM
# Owner: Noam Miller
# Created: 2026-04-15T07:34:51Z
# Updated: 2026-04-19T10:39:08Z

@regression @flights @amadeus @light-ticketing @reference-fields @hybrid @full-purchase @ado:76084
Feature: 76084 Amadeus Light Ticketing - Remarks sent before ticketing
  As a TMC that tickets Ryanair through Amadeus Light Ticketing
  I want PNR remarks, reference field answers and dynamic profile answers written to the PNR before it is ticketed
  So that every remark is on the PNR when DocIssuance_IssueCombined issues the ticket

  Scenario: Ryanair light ticketing writes remarks and answers before DocIssuance_IssueCombined
    Given I am logged in as "RFremark@ama.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "MAD"
    And flight results should be available
    And I filter airline results by "Ryanair" checkbox
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
      | 74010 Corp General            |
      | 74010 Special Characters      |
      | 74010 Dynamic Profile Field 1 |
      | 74010 Cryptic                 |
      | 74010 low cost                |
    And exactly 5 checkout reference fields should be displayed
    When I fill in the "74010 Corp General" reference field with "Corp General"
    And I fill in the "74010 Special Characters" reference field with "Corp & Special"
    And I fill in the "74010 low cost" reference field with "Corp Lcc"
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    # Each remark is the corp id, the answer and the remark text set on the field in admin.
    And the "Amadeus4.PNR_AddMultiElements" requests sent before "Amadeus4.DocIssuance_IssueCombined" should contain:
      | 60560-LIGHTTICKETING-CORP AFTER BOOKING PHASE       |
      | 60560-LIGHT TICKETING-CORP AT TICKETING QUEUE PHASE |
      | 74010Corp GeneralCorp General                       |
      | 74010Corp & SpecialCorp with characters             |
      | 74010Dynamic Profile Field Remark 1                 |
    And the "Amadeus4.PNR_AddMultiElements" requests sent before "Amadeus4.DocIssuance_IssueCombined" should not contain:
      | 74010Corp Lcc                       |
      | 74010Dynamic Profile Field Remark 2 |
    And the "Amadeus4.Command_Cryptic" requests sent before "Amadeus4.DocIssuance_IssueCombined" should contain:
      | 74010Corp LccCorp Flights Lcc       |
      | 74010Dynamic Profile Field Remark 2 |
    And the "Amadeus4.Command_Cryptic" requests sent before "Amadeus4.DocIssuance_IssueCombined" should not contain:
      | 74010Corp General                   |
      | 74010Dynamic Profile Field Remark 1 |
