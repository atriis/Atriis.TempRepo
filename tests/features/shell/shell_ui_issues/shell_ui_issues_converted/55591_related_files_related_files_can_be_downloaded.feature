# Test Name: 55591 Related Files - Related files can be downloaded
# Description:
# Status: Active
# Labels: UI,related files,Regression,Cart,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-16T01:47:05Z
# Updated: 2024-12-16T02:36:29Z

@regression @shell @flights @ui
Feature: 55591 - Related files can be downloaded
  As a corporate traveler
  I want to upload a file to the trip related files section and then download it
  So that I can verify that related files attached to a trip are accessible and downloadable

  Scenario: A related file uploaded to a trip can be downloaded from the related files tab
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "NYC"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    # TODO: navigate to the Related Files tab — no existing step covers page.click("[id='tab-relatedFiles'] p")
    #       Proposed step: When I navigate to the related files tab -> Cart.clickRelatedFilesTab(page)
    # TODO: click the upload button in the related files panel — no existing step covers page.click(".color-primary") (upload/add file button)
    #       Proposed step: When I click the upload file button in the related files panel -> Cart.clickUploadRelatedFileButton(page)
    When I upload the file "LoremIpsum.pdf" to the trip related files
    Then the file "LoremIpsum.pdf" should be visible in the trip related files section
    # TODO: click on the file to trigger download — no existing step covers page.click("[class^='pt'], [class*=' pt']") (the file name link)
    #       Proposed step: When I click the related file "LoremIpsum.pdf" to download it -> Cart.clickRelatedFileByName(page, fileName)
    # TODO: validate that the file was downloaded — untitled_download_validation() uses 'cli-validation-download-file' which cannot be automated via Playwright at this time
    #       Proposed step: Then the file "LoremIpsum.pdf" should have been downloaded -> Cart.verifyFileDownloaded(page, fileName)
    Then I successfully cancel the trip
