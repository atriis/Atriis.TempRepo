# Test Name: 33007 Manual quotes - PerDiem with upload file to quote
# Status: Active
# Labels: Regression,Manual Quote,No Amadeus Hotel Book,Pre Prod,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-06T12:58:05Z
# Updated: 2025-08-19T01:32:16Z
@regression @manual_quote
Feature: Manual Quote - Per Diem quote with file upload
  As a corporate traveler
  I want to add a Per Diem manual quote and attach a supporting document
  So that the file is stored against the quote in the trip

  @priority:critical
  Scenario: Add Per Diem manual quote with file upload to a new trip
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    # TODO: New step + DSL — open Manual Quote tab then click 'Other' sub-tab (ManualQuoteSearchPage.clickOtherProductsTab)
    When I open the Manual Quote - Other tab
    # TODO: New step + DSL — ManualQuoteSearch.addPerDiemQuote(page, { days, amount }) (type='Per Diem', N full days, amount)
    And I add a Per Diem manual quote for 3 full days with amount "350"
    # TODO: New step + DSL — ManualQuoteCart.expectQuoteStatus(page, status) ('Confirmed')
    Then the Per Diem quote status should be "Confirmed"
    # TODO: New step + DSL — ManualQuoteCart.uploadFileToQuote(page, filePath) (upload e.g. benerail_cxl_GPWNLGC.pdf, click primary confirm)
    When I upload a file to the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.expectUploadedFileVisible(page, fileName)
    Then the uploaded file should be listed on the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.openUploadedFilesPanel(page) (click ticket layout to reopen file list)
    When I reopen the uploaded file panel on the Per Diem quote
    # TODO: Reuses ManualQuoteCart.expectUploadedFileVisible (same DSL as above)
    Then the uploaded file should still be visible on the Per Diem quote
    Then I successfully cancel the trip
