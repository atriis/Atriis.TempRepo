# Test Name: 61598 Profile - Credit card expiration date in administration corresponds to the one added in the profile
# Description:
# Status: Active
# Labels: Profile,Regression,credit card,Administration,Expiry,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-05T08:30:16Z
# Updated: 2025-08-20T11:15:28Z

@regression @profile @fop @administration
Feature: 61598 Profile - Credit card expiration date matches administration
  As a corporate traveler
  I want the credit card expiration date I set in my profile to match what shows in the administration
  So that payment details are consistent across the system

  @priority:high
  Scenario: Credit card expiry added in profile is reflected in administration
    Given I am logged in as "bruninatist@brunaadmin.com"
    When I navigate to my user profile
    # TODO: Step needs implementation — click "[id='tab-formOfPayment'] p"
    # DSL candidate: Profile.openFormOfPaymentTab(page)
    And I open the form of payment tab in my profile
    # TODO: Step needs implementation — fill all CC fields (name, type, number, expiry)
    # DSL candidate: Profile.addCreditCardFull(page, { name, type, number, expiryMonth, expiryYear })
    And I add a credit card with name "testim test" type "visa" number "4580458045804580" expiry month "02" year "2032"
    # TODO: Step needs implementation — assert ".card-name" text matches
    # DSL candidate: Profile.verifyCardName(page, name)
    Then the card name "testim test" should be displayed in the profile
    # TODO: Step needs implementation — click "[to='/'] .material-symbols-outlined", wait for admin
    # DSL candidate: Profile.navigateToAdministration(page)
    When I navigate to the administration page
    # TODO: Step needs implementation — go to Users, search user, click row
    # DSL candidate: Profile.searchUserInAdmin(page, userName)
    And I search for user "Brunina tist" in the administration
    # TODO: Step needs implementation — click FOP tab in admin user view
    # DSL candidate: Profile.openFopTabInAdmin(page)
    And I open the form of payment tab in the administration
    # TODO: Step needs implementation — click card row, assert month/year dropdowns match
    # DSL candidate: Profile.verifyCcExpiryInAdmin(page, { cardName, month, year })
    Then the credit card "testim test" should show expiry month "2" and year "2032"
    # TODO: Step needs implementation — click delete icon on card, confirm
    # DSL candidate: Profile.deleteCcFromAdmin(page, cardName)
    When I delete the credit card "testim test" from the administration
