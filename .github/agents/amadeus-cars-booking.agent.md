---
description: "End-to-end Amadeus GDS car booking automation: 8-phase workflow with key request/response fields, phase triggers, and QA implementation guidance. Field-level detail is provided per phase; focus on the fields marked as required for each phase when implementing."
---

# Amadeus Cars Booking Agent

## Purpose
Automates the full Amadeus GDS Cars booking flow, step-by-step, for use in QA automation or integration scenarios. Each phase is documented with trigger points and required/requested data.

---

## Booking Flow Overview

The Amadeus GDS car booking flow follows a structured multi-step process:

1. **Location Discovery** → Search for valid pickup/drop-off locations by coordinates or address
2. **Availability Search** → Query available vehicles, dates, times, and rates for selected locations
3. **Rate Details (Optional)** → Retrieve additional pricing details and conditions for a specific offer
4. **Car Sell (Booking)** → Submit the booking request to reserve a vehicle and generate a car segment
5. **PNR Creation/Update** → Store the booked car segment in a Passenger Name Record (PNR) with remarks and cross-references
6. **PNR Retrieval** → Verify the complete PNR with all car booking details for display or audit
7. **PNR Cancel (if needed)** → Remove or modify the car segment from the PNR if the booking is cancelled
8. **Command Cryptic** → Execute terminal commands (e.g., ignore sequences, end transactions) for flow control or cleanup

**Primary use:** end-to-end automated booking, executing all phases in sequence. Each phase is additionally documented with its own inputs and outputs to support independent execution for targeted testing or troubleshooting without running the full flow.

---

## Booking Flow Phases



### 0. Car Location List (Location Discovery)
**Trigger:** User searches for valid pickup/drop-off rental/stations/agencies locations before availability
- **Request Type:** Amadeus4.Car_LocationList
- **Request Body Content:**
  - `geoCoding`:
    - `dummy`: Placeholder node required by schema in some implementations
    - `position`:
      - `encoding`: Position encoding format (e.g., `POR`)
      - `porPosition`:
        - `porLongitude`: Longitude in Amadeus expected numeric format
        - `porLatitude`: Latitude in Amadeus expected numeric format
    - `distance`:
      - `measurementQualifier`: Distance qualifier (e.g., `DST`)
      - `measurementDetails.significance`: Distance context (e.g., `FLY`)
      - `valueRange`:
        - `measureUnitQualifier`: Unit code (e.g., `2`)
        - `measurementValue`: Search radius value
- **Response Body Content (Car_LocationListReply):**
  - `scrollingInfo.scrollingInformation`:
    - `numberOfItems`: Current page item count
    - `lastItemRetrieved`: Last item index for paging
  - `carLocationListDetails` (repeating location results):
    - `companyInfo.companyInformation`:
      - `companyCode`: Supplier code (e.g., `EP`, `ZE`, `SX`)
      - `companyName`: Supplier display name
    - `locationAddress`:
      - `addressInfo`: Street/number details
      - `cityName`, `postalCode`, `countryCode`: Address geography
      - `locationInformation.locationCode`: Supplier location code
      - `locationInformation.agency`: Agency/system owner (e.g., `1A`)
    - `airportTerminalInfo` (when present):
      - `airportCode`: Airport code for airport locations
    - `companyAccessType`:
      - `accessTypeInfo.companyAccessIndicator`: Access indicator (e.g., `CAT`)
      - `accessTypeInfo.accessType`: Access type (e.g., `CP`)
      - `otherSelectionDetails.option`: Additional options (e.g., `COL`, `DEL`, `OHR`)
    - `geoCoding`:
      - `position.porPosition`: Coordinates of location
      - `distance.valueRange.measurementValue`: Distance from search point
      - `porBusinessID`: Business category/foreign key mapping
      - `porAccuracy.statusCode`: Geo accuracy code
    - `openingHours` (repeating):
      - `businessSemantic`: Opening/business semantic code
      - `timeMode`: Time mode for opening hours
      - `beginDateTime` / `endDateTime`: Opening interval
      - `frequency`: Day-of-week frequency mapping
    - `phoneAndEmail` (repeating):
      - `phoneOrEmailType`: Contact type (phone/fax/etc.)
      - `contactLocation`: Contact context (reservations, office, emergency)
      - `telephoneNumberDetails.telephoneNumber`: Contact number

---



### 1. Car Availability Search
**Trigger:** User initiates a car search after selecting dates and rental/stations/agencies location in UI or API call (after Car Location List)
- **Request Type:** Amadeus4.Car_Availability
- **Request Body Content:**
  - `carProviderIndicator.statusDetails.indicator`: Provider behavior flag (e.g., `Y`)
  - `multimediaIndicator.statusDetails.indicator`: Multimedia return flag (e.g., `MY`)
  - `multiMediaContent`:
    - `picturesType.actionRequestCode`: Picture category requested (e.g., `VEH`)
    - `pictureSize.selectionDetails.option`: Requested image size/profile (e.g., `7`)
  - `pickupDropoffInfo`:
    - `pickupDropoffTimes`:
      - `beginDateTime`: Pickup date-time (`year`, `month`, `day`, `hour`, `minutes`)
      - `endDateTime`: Drop-off date-time (`year`, `month`, `day`, `hour`, `minutes`)
    - `pickupDropoffInfo` (repeating for PUP/DOP):
      - `locationType.locationType`: Role code (e.g., `PUP`, `DOP`)
      - `locationGeocodeInfo`:
        - `position.encoding`: Coordinate encoding (e.g., `D`)
        - `position.porPosition`: Latitude/longitude
        - `distance`: Search radius qualifier, significance and value
  - `providerSpecificOptions.companyDetails.companyCode`: Supplier filter (e.g., `EP`)
  - `rateClass.criteriaSetType`: Rate profile criteria (e.g., `COR`)
  - `computeMarkups.actionRequestCode`: Markup calculation toggle (e.g., `N`)
  - `sortingRule.actionRequestCode`: Result sorting behavior (e.g., `S`)
- **Response Body Content (Car_AvailabilityReply):**
  - `availabilityDetails`:
    - `computeMarkups`, `rateClass`: Echoed request-level strategy
    - `companyLocationInfo`:
      - `carCompanyData`: Supplier code/name/access level
      - `rentalLocation`:
        - `address`: Address and location code information
        - `rateMarketingInfo`: Supplier free-text commercial messages
        - `locDelColOhr`: Collection/delivery/out-of-hours availability flags
        - `locationGeocodeInfo`: Geospatial and business-id metadata
        - `openingHours`: Location schedule blocks
    - `rates` (repeating offers):
      - `vehicleTypeInfo`: Vehicle class and model
      - `carCompanyData`: Supplier reference for the rate
      - `pickupDropoffLocations`: Pickup/drop-off station references
      - `pickupDropoffTime`: Confirmed rental time window
      - `validityPeriod.quantityDetails`: Duration qualifiers and values
      - `rateIdentifier.referenceDetails.value`: Offer identifier for downstream calls
      - `sizedPictures`: Vehicle images and optionally specs
      - `loyaltyNumbersList.discountNumbers`: Rate/discount references
      - `rateDetailsInfo`:
        - `tariffInfo`: Amounts, currency, rate type, identifiers
        - `extraRateTypeInfo.rateCategory`: Rate category
        - `associatedCharges`: Charge code/type/description blocks
      - `rateStatus.statusCode`: Availability/rate status code
      - `ruleInfo.ruleDetails`: Rule type references
      - `rateMarketingInfo.freeText`: Marketing/rate text

---



### 2. Car Rate Details (Optional)
**Trigger:** User requests more info on a specific car offer (e.g., clicks "details" or before booking) (after Car Availability Search)
- **Request Type:** Amadeus4.Car_RateInformationFromAvailability
- **Request Body Content:**
  - `companyDetails`:
    - `travelSector`: Sector code (e.g., `CAR`)
    - `companyCode`: Selected supplier code (e.g., `EP`)
  - `rateSource.selectionDetails.option`: Source/mode of requested rate details (e.g., `P6`)
  - `pickupDropoffLocs` (repeating):
    - `locationType`: Pickup/drop-off role/type (e.g., `176`, `DOL`)
    - `locationDescription.code`: System code (e.g., `1A`)
    - `locationDescription.name`: Location name (e.g., `MADX03`)
  - `pickupDropoffTimes`:
    - `businessSemantic`: Business semantic code for timing context (e.g., `PDA`)
    - `beginDateTime` / `endDateTime`: Requested rental window
  - `rateInfo.tariffInfo.ratePlanIndicator`: Rate plan granularity (e.g., `DY`)
  - `rateCodeInfo.fareCategories.fareType`: Fare category/code (e.g., `SPDR`)
  - `vehicleInformation`:
    - `vehTypeOptionQualifier`: Vehicle qualifier (e.g., `VT`)
    - `vehicleRentalNeedType.vehicleTypeOwner`: Classification owner (e.g., `ACR`)
    - `vehicleRentalNeedType.vehicleRentalPrefType`: Vehicle class (e.g., `MDAE`)
- **Response Body Content (Car_RateInformationFromAvailabilityReply):**
  - `errorWarning` (observed in this trip):
    - `applicationError.errorDetails.errorCode`: Error code (e.g., `99`)
    - `applicationError.errorDetails.errorCategory`: Error category (e.g., `EC`)
    - `errorFreeText.freeTextDetails`: Text metadata (subject, type, company, encoding)
    - `errorFreeText.freeText`: Human-readable error (e.g., missing/invalid access option)

---



### 3. Car Sell (Booking Request)
**Trigger:** User selects a car and proceeds to book (after Car Rate Details or Car Availability Search)
- **Request Type:** Amadeus4.Car_Sell
**Request Body Content:**
  - `pnrInfo`:
    - `paxTattooNbr`:
      - `referenceDetails`:
        - `type`: Passenger reference type in PNR (e.g., "PT")
        - `value`: Passenger tattoo/reference number in PNR (e.g., "2")
  - `sellData`:
    - `companyIdentification`:
      - `travelSector`: Booking sector identifier; must indicate car flow (e.g., "CAR")
      - `companyCode`: Supplier or car company code selected from availability (e.g., "EP")
    - `bookingType`:
      - `selectionDetails`:
        - `option`: Sell/booking option controlling booking behavior (e.g., "P6")
    - `locationInfo`:
      - `locationType`: Location context/type code used by Amadeus (e.g., "176")
      - `locationDescription`:
        - `code`: Location owner/source code (e.g., "1A")
        - `name`: Detailed station/location identifier (e.g., "MADX03")
      - `firstLocationDetails`:
        - `code`: Pickup city/station code (e.g., "MAD")
        - `qualifier`: Qualifier describing location code type (e.g., "145")
        - `agency`: Agency/system owner of the location reference (e.g., "1A")
    - `pickupDropoffTimes`:
      - `beginDateTime`:
        - `year`: Pickup year in local station time (e.g., "2026")
        - `month`: Pickup month (e.g., "08")
        - `day`: Pickup day of month (e.g., "01")
        - `hour`: Pickup hour (24h format) (e.g., "10")
        - `minutes`: Pickup minutes (e.g., "00")
      - `endDateTime`:
        - `year`: Drop-off year in local station time (e.g., "2026")
        - `month`: Drop-off month (e.g., "08")
        - `day`: Drop-off day of month (e.g., "06")
        - `hour`: Drop-off hour (24h format) (e.g., "10")
        - `minutes`: Drop-off minutes (e.g., "00")
    - `vehicleInformation`:
      - `vehTypeOptionQualifier`: Qualifier indicating vehicle type context (e.g., "VT")
      - `vehicleRentalNeedType`:
        - `vehicleTypeOwner`: Vehicle classification standard owner (e.g., "ACR")
        - `vehicleRentalPrefType`: Requested ACRISS vehicle class/code (e.g., "MDAE")
    - `rateCodeInfo`:
      - `fareCategories`:
        - `fareType`: Fare/rate category code returned by availability (e.g., "SPDR")
    - `customerInfo`:
        - `customerReferences`:
            - `referenceQualifier`: Customer reference qualifier (e.g., "1")
            - `referenceNumber`: Customer reference number, loyalty program number (e.g., "123456")
    - `rateInfo`:
      - `tariffInfo`:
        - `rateType`: Tariff/rate identifier for the selected offer (e.g., "2605191001")
- **Response Body Content (Car_SellReply):**
  - `carSegment`: Main booked car segment returned by Amadeus
    - `bookingIdentifier`:
      - `referenceType`: Segment reference type (e.g., "S")
      - `uniqueReference`: Unique segment number inside the PNR (e.g., "1")
    - `rateStatus`:
      - `statusCode`: Segment status code (e.g., "HK" = confirmed)
    - `bookingType`:
      - `selectionDetails`:
        - `option`: Booking option/category returned in confirmation (e.g., "CP")
    - `marketingInfo`: Supplier/commercial free text lines for pricing and conditions
      - `freeTextQualification`:
        - `textSubjectQualifier`: Qualifier describing text scope (e.g., "3")
        - `informationType`: Type/category of free text (e.g., "MK")
        - `companyId`: Company/source owner of text (e.g., "1A")
        - `language`: Language code of text lines (e.g., "EN")
      - `freeText`: Repeating messages such as total charge, inclusions, optional extras
    - `paxName`:
      - `travellerDetails`:
        - `firstName`: Traveller name attached to the car segment
    - `typicalCarData`: Detailed operational and financial data for the booking
      - `companyIdentification`:
        - `travelSector`: Sector identifier (e.g., "CAR")
        - `companyCode`: Supplier code (e.g., "EP")
        - `companyName`: Supplier display name (e.g., "EUROPCAR")
      - `locationInfo`: Repeating pickup/drop-off location blocks
        - `locationType`: Location role/type (e.g., "176" pickup descriptor, "DOL" drop-off descriptor)
        - `locationDescription`:
          - `code`: Location/system code (e.g., "1A", "CPY")
          - `name`: Location name/label
        - `firstLocationDetails` (when present):
          - `code`: City/station code (e.g., "MAD")
          - `qualifier`: Code qualifier (e.g., "145")
          - `agency`: Agency/system owner code (e.g., "IA")
      - `pickupDropoffTimes`:
        - `beginDateTime`: Confirmed pickup date-time parts
          - `year`, `month`, `day`, `hour`, `minutes`
        - `endDateTime`: Confirmed drop-off date-time parts
          - `year`, `month`, `day`, `hour`, `minutes`
      - `vehicleInformation`:
        - `vehicleCharacteristic`:
          - `vehicleTypeOwner`: Vehicle classification owner (e.g., "ACR")
          - `vehicleRentalPrefType`: Confirmed ACRISS vehicle class/code (e.g., "MDAE")
      - `confirmationNbr`:
        - `reservation`:
          - `companyId`: Source system/company for confirmation
          - `controlNumber`: Supplier confirmation/reservation number
          - `controlType`: Confirmation number type
      - `rateCodeInfo`:
        - `fareCategories`:
          - `fareType`: Confirmed fare category (e.g., "SPDR")
      - `rateInfo`: Repeating pricing blocks (classification, daily, base, total)
        - `tariffInfo`:
          - `rateType`: Tariff code (when provided)
          - `ratePlanIndicator`: Rate period indicator (e.g., "DY")
          - `amountType`: Amount category (e.g., "GNL", "RG", "RB", "904")
          - `amount`: Monetary amount for this block (when provided)
          - `currency`: Currency code for amount (e.g., "EUR")
        - `rateInformation`:
          - `category`: Rate category/classification code (e.g., "24")
        - `chargeDetails`: Repeating charge descriptors and amounts
          - `type`: Charge type code (e.g., "32", "034", "RBP", "90D")
          - `amount`: Charge amount (when provided)
          - `description`: Charge description (when provided, e.g., "UNL")
          - `numberInParty`: Quantity/day count linked to charge (when provided)
      - `bookingSource`:
        - `originatorDetails`:
          - `originatorId`: Booking source/originator identifier
    - `paxTattooNbr`:
      - `referenceDetails`:
        - `type`: Passenger reference type in PNR (e.g., "PT")
        - `value`: Passenger reference number in PNR (e.g., "2")

---



### 4. PNR Creation/Update
**Trigger:** After successful Car_Sell, to store booking in a PNR (after Car Sell)
- **Request Type:** Amadeus4.PNR_AddMultiElements
- **Request Body Content:**
  - `pnrActions.optionCode`: PNR action mode (e.g., `11`)
  - `dataElementsMaster`:
    - `marker1`: Container marker for data elements
    - `dataElementsIndiv` (repeating elements):
      - `elementManagementData.reference`: Element reference (`qualifier`, `number`)
      - `elementManagementData.segmentName`: Element type (e.g., `RM`, `RF`)
      - `miscellaneousRemark.remarks`: Free-text remark details (`type`, optional `category`, `freetext`)
      - `freetextData`: Structured free-text for RF/signature blocks
      - `referenceForDataElement`: Optional passenger/segment linkage
- **Response Body Content (PNR_Reply):**
  - `pnrHeader.reservationInfo.reservation`: PNR locator and creation timestamp
  - `securityInformation`: Responsibility office, queueing office, RP metadata
  - `sbrPOSDetails` / `sbrCreationPosDetails` / `sbrUpdatorPosDetails`: Originator and POS context
  - `technicalData`: Envelope sequencing and purge date
  - `travellerInfo`: Passenger references and normalized names
  - `dataElementsMaster.dataElementsIndiv` (repeating): Returned AP/TK/RM/OS and other PNR elements with line numbers and content

---



### 5. Car Booking Confirmation
**Trigger:** After PNR is created/updated, to confirm booking (after PNR Creation/Update)
- **Request Type:** Amadeus4.Command_Cryptic (for some confirmations), Amadeus4.Car_Complete (if available)
- **Request Body Content:**
  - `pnrLocator`: PNR record locator
  - `carSegmentReference`: Segment number or reference
  - `command`: For Command_Cryptic, the cryptic command string (e.g., `ER` for End and Retrieve)
- **Response:** Final confirmation, voucher number, pickup instructions

---



### 6. PNR Retrieval
**Trigger:** For downstream processing, display, or audit (after Car Booking Confirmation or PNR Creation/Update)
- **Request Type:** Amadeus4.PNR_Retrieve
- **Request Body Content:**
  - `retrievalFacts`:
    - `retrieve.type`: Retrieval mode code (e.g., `2`)
    - `reservationOrProfileIdentifier.reservation.controlNumber`: PNR locator (e.g., `9UL8A7`)
- **Response Body Content (PNR_Reply):**
  - `pnrHeader.reservationInfo.reservation`: Control number with creation date/time
  - `securityInformation`: Office/agent ownership and queue context
  - `sbr*PosDetails`: POS/originator context blocks
  - `technicalData`: Envelope counters and purge date
  - `travellerInfo`: Passenger records with PNR references
  - `dataElementsMaster`: All current PNR data elements (AP, TK, RM, OS, etc.) and line-level details

---



### 7. PNR Cancel
**Trigger:** User cancels the booked car segment from an existing PNR (after PNR Creation/Update or PNR Retrieval)
- **Request Type:** Amadeus4.PNR_Cancel
- **Request Body Content:**
  - `reservationInfo.reservation.controlNumber`: Target PNR locator
  - `pnrActions.optionCode`: Cancel action option (e.g., `0`)
  - `cancelElements`:
    - `entryType`: Cancel entry mode (e.g., `E`)
    - `element.identifier`: Element type to cancel (e.g., `ST`)
    - `element.number`: Element line/segment number to cancel (e.g., `1`)
- **Response Body Content (PNR_Reply):**
  - `pnrHeader`: Locator and reservation metadata after cancel operation
  - `technicalData.generalPNRInformation.statusDetails.isPNRModifDuringTrans`: Modification flag (e.g., `MOD`)
  - `travellerInfo`: Passenger records preserved in updated PNR
  - `dataElementsMaster`: Remaining PNR elements after cancellation

---



### 8. Command Cryptic
**Trigger:** Execute terminal-like command (e.g., ignore/end sequence) as part of booking flow control (after any phase requiring manual flow control or cleanup)
- **Request Type:** Amadeus4.Command_Cryptic
- **Request Body Content:**
  - `messageAction.messageFunctionDetails.messageFunction`: Command mode indicator (e.g., `M`)
  - `longTextString.textStringDetails`: Cryptic command text (e.g., `IG`)
- **Response Body Content (Command_CrypticReply):**
  - `longTextString.textStringDetails`: Raw command execution output from host
    - Example in this trip: `IGNORED - 9UL8A7`

---



## Notes
- Each phase should be implemented as a method or workflow step in the agent.
- All requests/responses should be logged for traceability (optionally to Azure Storage).
- Session management (Amadeus4.Session_Create / Amadeus4.Session_Close) is required for Amadeus SOAP APIs.
  - **Session_Create Body Content:** Credentials (office ID, user ID, password), system details
  - **Session_Close Body Content:** Session token or context identifier
- Error handling and retries are critical at each step. If required fields are missing or input data is invalid before sending a request, respond with a descriptive error message identifying the missing field and phase name, and terminate the booking flow without calling the Amadeus API.

---

## Amadeus4 Request Types Used

- Amadeus4.Car_LocationList
- Amadeus4.Car_Availability
- Amadeus4.Car_RateInformationFromAvailability
- Amadeus4.Car_Sell
- Amadeus4.PNR_AddMultiElements
- Amadeus4.PNR_Retrieve
- Amadeus4.PNR_Cancel
- Amadeus4.Command_Cryptic

---

## Example Usage
- The agent can be invoked end-to-end for a full booking, or each phase can be called independently for testing or troubleshooting.
- Inputs/outputs should be validated and sanitized before sending to Amadeus APIs.

---

For further details or code scaffolding, extend this agent with language-specific implementations as needed.
