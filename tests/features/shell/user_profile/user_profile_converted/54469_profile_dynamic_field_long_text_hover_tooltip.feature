# Test Name: 54469 Traveler profile - When the Dynamic Profile Field is long, full text is displayed when hovering over the icon in the title
# Description:
# Status: Active
# Labels: Profile,Dynamic fields,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-19T08:59:28Z
# Updated: 2025-07-14T07:23:04Z

@regression @profile @dynamic-fields
Feature: 54469 Profile - Long dynamic field text shows full tooltip on hover
  As a corporate traveler
  I want to see the full text of a long dynamic profile field when hovering over its icon
  So that I can read truncated field labels

  @priority:medium
  Scenario: Hovering over dynamic field icon shows full text in tooltip
    Given I am logged in as "felipe@dynamicfields.com"
    When I navigate to my user profile
    # TODO: Step needs implementation — click "[id='tab-personalDetails'] p"
    # DSL candidate: Profile.openPersonalDetailsTab(page)
    And I open the personal details tab in my profile
    # TODO: Step needs implementation — scroll to ".reference-fields-container > :nth-child(2) .label"
    # DSL candidate: Profile.scrollToDynamicFields(page)
    And I scroll to the dynamic reference fields section
    # TODO: Step needs implementation — hover "[class^='ml'], [class*=' ml']" icon
    # DSL candidate: Profile.hoverDynamicFieldIcon(page)
    And I hover over the dynamic field info icon
    # TODO: Step needs implementation — assert ".help" text matches expected full text
    # DSL candidate: Profile.verifyTooltipText(page, expectedText)
    Then the tooltip should display "huashudshudsahusdhuashuashudsahudashudashudash"
