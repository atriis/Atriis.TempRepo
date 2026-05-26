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

    # Testim shared step: Select_Manual_Quote___Other()
    # TODO: New step + DSL — ManualQuoteSearch.openManualQuotePage(page) (click '.is-capitalized' / '#tab-manual > div')
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearch.expectHeading(page, text) (waitForText on h1 == 'Add Manual Quote')
    Then the manual quote page heading should be "Add Manual Quote"
    # TODO: New step + DSL — ManualQuoteSearchPage.clickOtherProductsTab(page) (click '#tab-manualOtherProducts > div')
    When I open the Manual Quote - Other sub-tab

    # Testim shared step: Enter_Quote_Details()
    # TODO: New step + DSL — ManualQuoteSearch.expectFormLabel(page, 'Select quote type*') (waitForText on first form label)
    Then the Other quote form should display the "Select quote type*" label
    # TODO: New step + DSL — ManualQuoteSearch.selectOtherQuoteType(page, type) (open .el-select__caret, pick 4th option 'Per Diem')
    When I select the Other quote type "Per Diem"
    # TODO: New step + DSL — ManualQuoteSearch.fillPerDiemDateRange(page) (Testim 'date-generator' marker — DSL must pick a future from/to date range)
    And I fill the Per Diem date range with a future window
    # TODO: New step + DSL — ManualQuoteSearch.fillPerDiemDuration(page, duration) (free-text input, e.g. '3 full days')
    And I set the Per Diem duration to "3 full days"
    # TODO: New step + DSL — ManualQuoteSearch.fillPerDiemAmount(page, amount) (price-section number input)
    And I enter the Per Diem amount "350"
    # TODO: New step + DSL — ManualQuoteSearch.saveOtherQuote(page) (click .ml* save/add button)
    And I save the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.expectQuoteStatus(page, status) (waitForText 'Confirmed' on saved quote)
    Then the Per Diem quote status should be "Confirmed"

    # Testim shared step: Upload_File_to_Quote()
    # TODO: New step + DSL — ManualQuoteCart.expandQuoteCard(page) (click '#el-collapse-head-*')
    When I expand the Per Diem quote card
    # TODO: New step + DSL — ManualQuoteCart.openFileUploadPanel(page) (click '.ticket-layout-container .is-clickable')
    And I open the file upload panel on the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.dropFile(page, fileName) (Testim 'drop-file' marker — DSL must drag/drop or set input[type=file]; fixture: 'benerail_cxl_GPWNLGC.pdf')
    And I upload the file "benerail_cxl_GPWNLGC.pdf" to the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.expectUploadedFileVisible(page, fileName) (waitForText filename on '.pt*' class)
    Then the uploaded file "benerail_cxl_GPWNLGC.pdf" should be visible in the upload preview
    # TODO: New step + DSL — ManualQuoteCart.confirmFileUpload(page) (click .btn--primary)
    When I confirm the file upload

    # Testim shared step: Validate_file_upload()
    # TODO: Reuses ManualQuoteCart.openFileUploadPanel (re-click '.ticket-layout-container .is-clickable')
    When I reopen the file panel on the Per Diem quote
    # TODO: New step + DSL — ManualQuoteCart.expectExistingFilesListVisible(page) (assertion on '.existing-files-list .is-clickable')
    Then the uploaded files list should be visible on the Per Diem quote
    # TODO: Reuses ManualQuoteCart.expectUploadedFileVisible
    And the uploaded file "benerail_cxl_GPWNLGC.pdf" should still be listed on the Per Diem quote

    Then I successfully cancel the trip
