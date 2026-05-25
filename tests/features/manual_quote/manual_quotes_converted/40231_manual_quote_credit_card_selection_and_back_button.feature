# Test Name: 40231 [Merge] Manual Quote - Can select from available credit cards and card type is displayed and "Back" button is displayed
# Status: Active
# Labels: Regression,Manual Quote,Cars,FOP,No Amadeus Hotel Book,merge,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-19T04:15:06Z
# Updated: 2026-02-17T08:58:29Z
@regression @manual_quote @cars @fop
Feature: Manual Quote - Credit card selection and Back button on Car manual quote
  As a corporate traveler
  I want the manual quote Car form to expose all available credit cards and a Back button
  So that I can pick the right form of payment or return to the trip

  @priority:high
  Scenario: Manual quote Car form displays credit cards, card type and Back button
    Given I am logged in as "brunasantos@manualquote.com" booking a new trip
    # TODO: New step + DSL — ManualQuoteSearch.openManualQuotePage(page) (also used in 35770)
    When I navigate to the Manual Quote page
    # TODO: New step + DSL — ManualQuoteSearch.expectWarningText(page, text) (warning shown before traveler is added)
    Then the manual quote page should warn "Please add traveler for this trip."
    When I have added myself as the traveler
    # TODO: New step + DSL — ManualQuoteSearch.expectHeadingContains(page, fragment) (regex match against page heading)
    Then the manual quote page title should mention "quote"
    # TODO: New step + DSL — ManualQuoteSearchPage.BACK_BUTTON locator + DSL assertion (Back button visible)
    And a Back button should be displayed on the manual quote page
    # TODO: New step + DSL — ManualQuoteSearchPage.clickCarTab() (click '#tab-car')
    When I open the Manual Quote - Car tab
    # TODO: New step + DSL — ManualQuoteSearch.scrollToCarFopSection(page)
    And I scroll to the manual quote Car form of payment section
    # TODO: New step + DSL — ManualQuoteSearch.openCarFopDropdown(page) (click focused FOP caret in Car pane)
    And I open the manual quote Car form of payment dropdown
    # TODO: New step + DSL — ManualQuoteSearch.expectFopOptionVisible(page, cardName) (assert 'testim one' present)
    Then the credit card "testim one" should be available
    # TODO: New step + DSL — ManualQuoteSearch.selectFopOption(page, cardName)
    When I select the credit card "testim one"
    # TODO: New step + DSL — ManualQuoteSearch.expectCardTypeDisplayed(page, cardType) (credit-type-select placeholder)
    Then the manual quote Car card type should display "Visa Credit"
    # TODO: New step + DSL — ManualQuoteSearch.openCardTypeDropdown(page)
    When I open the manual quote Car credit type dropdown
    # TODO: New step + DSL — ManualQuoteSearch.expectCardTypesInDropdown(page, expectedList) (data-table-driven assertion)
    Then the credit type dropdown should list the following card types
      | MasterCard      |
      | American Express|
      | Diners Club     |
      | Discover        |
      | Visa Credit     |
      | Air Plus        |
      | EHotel          |
    # TODO: New step + DSL — ManualQuoteSearch.clickBack(page) (click title-container Back button)
    When I click the Back button on the manual quote page
    Then the welcome heading should contain "Welcome"
