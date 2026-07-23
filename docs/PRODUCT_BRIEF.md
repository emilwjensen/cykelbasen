# Product brief

## Working description

A Danish marketplace and community for used race bikes where listings use structured specifications and ownership documentation is reviewed before publication.

## Problem

Existing general marketplaces have four recurring weaknesses:

- Fake or disposable seller profiles.
- Stolen bikes and unclear ownership.
- Sparse or inaccurate descriptions.
- Weak filtering because specifications live in free text.

## Product promise

A buyer should understand what the bike is, who sells it and how ownership was documented before arranging a purchase.

A seller should create a credible listing without writing a technical essay.

A buyer can send a structured inquiry and explicitly share their account e-mail
without exposing either party's address publicly or introducing real-time chat.

A buyer can also compare up to three public listings side by side. The
selection stays in the browser, while the shareable URL contains only public
listing IDs.

## Initial audience

Private buyers and sellers of:

- Road bikes
- Gravel bikes
- Cyclocross bikes
- Triathlon and time-trial bikes
- Vintage race bikes
- Electric road bikes

## Core objects

- User profile
- Listing
- Listing images
- Ownership document review
- Favorite
- Forum category
- Forum post
- Forum comment
- Vote
- Report
- Registered bike
- Bike maintenance and ride log
- Structured buyer contact request
- Browser-local listing comparison
- Private listing reservation tied to a buyer inquiry

## Simple listing specs

Required:

- Title
- Category
- Brand
- Model
- Frame size label
- Price
- Condition
- City
- Description

Optional but filterable:

- Model year
- Frame size in centimeters
- Frame material
- Groupset brand
- Groupset model
- Drivetrain, for example `2x11`
- Brake type
- Wheel size
- Electronic shifting
- Shipping offered

Distance ridden is not requested.

## Mine cykler

Users can register bikes they own without putting them up for sale. Garage data
is private and supports:

- hashed frame-number registration
- acquisition and known owner history
- current odometer
- ride, service, inspection and component-change logs
- documentation-presence markers without exposing files
- connected ownership periods when a seller hands the registration to a buyer

A registered bike can prefill a later listing. Public listing history remains an
explicit seller choice and never exposes the raw frame number or private notes.

Ownership transfer uses a short-lived single-use code. The buyer receives a new
private bike profile for the same platform identity. Public history shows only
connected registration periods, never previous owners' names, private notes,
documents or ride logs.

## Trust model

The MVP uses clear states rather than a vague trust score:

- Draft
- Waiting for review
- Ownership approved
- Published
- Reserved for a specific buyer
- Rejected
- Sold
- Archived

The full frame number, uploaded documents and review notes are private.

## Forum purpose

The forum creates repeat visits and useful content before the marketplace has large inventory. It supports simple Reddit-like interaction without subcommunities, awards, karma systems or complex ranking in the MVP.

Initial categories:

- Købshjælp
- Cykelvalg og størrelse
- Udstyr og komponenter
- Vedligeholdelse
- Prisvurdering
- Træning og ture
- Svindel og stjålne cykler
- Feedback til platformen

## Later advantage

The guided quiz uses the same structured fields as listing filters. It should recommend categories and current listings, not create a second product model.
