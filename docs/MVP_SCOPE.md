# MVP scope

## Included

### Foundation

- Next.js App Router
- Neon Auth
- User profiles
- Explicit typed SQL query contracts
- Neon migration and development seed workflow
- Vercel deployment
- GitHub Actions checks

### Marketplace

- Browse published listings
- Listing detail page
- Search by title, brand and model
- Filters for category, price, size, frame material, brake type, condition and city
- Sort by newest, price ascending, price descending and model year
- Create and edit draft listing
- Purchase date, known owner count and documentation-presence fields
- Structured component replacement history
- Upload, reorder and delete listing images
- Submit ownership documentation
- Moderator approval queue
- Publish only after ownership approval
- Favorite listings
- Paginated results and side-by-side comparison of up to three listings
- Structured buyer contact request with explicit e-mail sharing
- Reserve a listing for a specific buyer inquiry and release it again
- Report listing
- Mark listing sold or archived

### Mine cykler

- Register an owned bike privately
- Store only a hash of an optional frame number
- Track current odometer
- Add ride, service, inspection, note and component-change logs
- Prefill a sales listing from a registered bike

### Forum

- Browse categories and posts
- Create and edit post
- Comment and reply one level deep
- Upvote or downvote once per user
- Sort by newest and score
- Report post or comment
- Moderator hide action

### Admin

- Moderator-only route
- Review ownership documents with signed URLs
- Approve or reject document
- Review reported content
- View basic user and listing context

## Excluded

- Payments or escrow
- Shipping integration
- Buyer protection
- Direct messages or real-time chat
- MitID integration
- Automated identity verification
- Automated receipt analysis
- Automatic stolen-bike registry lookup
- Price estimation model
- Dealer accounts
- Mobile app
- Complex reputation score
- Nested forum threads beyond one reply level
- Notifications beyond essential email links

## MVP success evidence

The product is ready for initial testing when:

- A new user completes the full seller flow without database access.
- A moderator approves documentation without using the Neon console.
- An unauthenticated visitor filters published listings.
- A seller cannot publish without approved documentation, even by calling the API directly.
- A user creates a forum post, comments and changes a vote.
- RLS tests cover public, owner, other user and moderator access.
