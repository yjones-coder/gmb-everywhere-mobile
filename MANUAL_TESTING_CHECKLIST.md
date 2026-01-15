# GMB Everywhere Mobile - Manual Testing Checklist

**Date:** 2026-01-14  
**Project:** gmb-everywhere-mobile  
**Purpose:** Comprehensive manual testing of all implemented features

---

## Testing Prerequisites

Before starting testing, ensure:

- [ ] Node.js is installed (v18 or higher recommended)
- [ ] All dependencies are installed (`npm install` or `pnpm install`)
- [ ] Google Places API key is configured in `.env` file
- [ ] Development server is running (`npm run dev`)
- [ ] Application is accessible at `http://localhost:8081` (web) or via Expo Go (mobile)
- [ ] TypeScript errors have been fixed (see VERIFICATION_REPORT.md)

---

## 1. Home Screen - Business Search

### 1.1 Initial Load
- [ ] Application loads without errors
- [ ] Welcome screen displays correctly
- [ ] "GMB Audit" title is visible
- [ ] Search input field is present and focused
- [ ] "Search" button is visible and enabled
- [ ] Suggestion chips are displayed (dentist, auto repair, yoga, plumber)
- [ ] "Go to GMB Audit Tools" button is visible

### 1.2 Search Functionality
- [ ] Enter a search query (e.g., "dentist")
- [ ] Press Enter or click "Search" button
- [ ] Loading skeleton appears during search
- [ ] Search results display after loading completes
- [ ] Results show business cards with name, rating, and category
- [ ] Result count is displayed in header
- [ ] "Clear" button appears in results header

### 1.3 Search Results
- [ ] Business cards display correctly with:
  - [ ] Business name
  - [ ] Rating (stars)
  - [ ] Review count
  - [ ] Primary category badge
  - [ ] Address
- [ ] Tapping a business card navigates to business detail page
- [ ] Pull-to-refresh works on results list
- [ ] Refreshing updates results with loading indicator

### 1.4 Recent Searches
- [ ] After performing a search, it appears in "Recent Searches"
- [ ] Recent searches show query and result count
- [ ] Tapping a recent search performs the search again
- [ ] Delete button (X) removes individual recent search
- [ ] "Clear All" button removes all recent searches
- [ ] Recent searches persist after page refresh

### 1.5 Suggestion Chips
- [ ] Tapping a suggestion chip performs search
- [ ] Search results display correctly
- [ ] Haptic feedback is felt on tap

### 1.6 Error Handling
- [ ] Test with no internet connection
- [ ] Error banner appears with message
- [ ] Fallback to mock data works
- [ ] App remains functional with mock data
- [ ] Test with invalid search query
- [ ] Empty state displays with helpful message

### 1.7 Edge Cases
- [ ] Search with empty query (should not search)
- [ ] Search with special characters
- [ ] Search with very long query
- [ ] Search with emoji
- [ ] Rapid successive searches

---

## 2. Business Detail Screen

### 2.1 Navigation to Detail Screen
- [ ] Tapping a business card from search results navigates correctly
- [ ] URL includes business ID parameter
- [ ] Back button returns to search results
- [ ] Loading skeleton appears during data fetch

### 2.2 Business Information Display
- [ ] Business name displays correctly
- [ ] Address displays with location icon
- [ ] Phone number displays with phone icon
- [ ] Rating score ring displays with correct value
- [ ] Review count badge shows correct number
- [ ] Place ID and CID are displayed

### 2.3 Categories Section
- [ ] Primary category badge is highlighted
- [ ] Secondary categories display as badges
- [ ] All categories are readable and properly formatted

### 2.4 Quick Stats
- [ ] Reviews stat card shows correct count
- [ ] Categories stat card shows correct count
- [ ] Services stat card shows correct count
- [ ] Stats animate in with delay

### 2.5 Action Buttons
- [ ] "Category Analysis" button navigates to categories page
- [ ] "Review Audit" button navigates to reviews page
- [ ] "Save" button saves business audit
- [ ] "Compare" button adds to comparison list
- [ ] Haptic feedback on button presses

### 2.6 Save Functionality
- [ ] Tapping "Save" changes button to "Saved"
- [ ] Button background color changes when saved
- [ ] Alert confirms successful save
- [ ] Saved business appears in Saved Audits tab
- [ ] Tapping "Saved" again shows "Already Saved" alert

### 2.7 Compare Functionality
- [ ] Tapping "Compare" adds business to comparison list
- [ ] Button changes to "Added" when in list
- [ ] Alert confirms addition
- [ ] Can add up to 4 businesses
- [ ] Alert shows "Limit Reached" when trying to add 5th business
- [ ] "View Comparison" button appears when 2+ businesses added

### 2.8 Services Section
- [ ] Services list displays correctly
- [ ] Each service has checkmark icon
- [ ] Services are readable and properly formatted

### 2.9 Attributes Section
- [ ] Attributes display as chips
- [ ] All attributes are readable
- [ ] Chips wrap properly on small screens

### 2.10 Error Handling
- [ ] Test with invalid business ID
- [ ] Error screen displays with helpful message
- [ ] Back button returns to home
- [ ] Test with no internet connection
- [ ] Error message displays appropriately

---

## 3. GMB Audit Screen - Audit Tab

### 3.1 Initial Load
- [ ] Screen loads without errors
- [ ] "Audit" tab is active by default
- [ ] Review Health section displays
- [ ] Post Activity section displays
- [ ] Review Velocity section displays

### 3.2 Review Health Section
- [ ] Average rating displays correctly (e.g., 4.9)
- [ ] Total reviews count displays correctly
- [ ] Average per reviewer displays correctly
- [ ] Reviews with photos count displays correctly
- [ ] Info note about photos is visible

### 3.3 Post Activity Section
- [ ] "Data Not Available" message displays
- [ ] Explanation about Google Posts limitation is clear
- [ ] Suggestion to use Google Business Profile Manager is visible
- [ ] Info note about tracking posts is visible

### 3.4 Review Velocity Section
- [ ] Review velocity entries display correctly
- [ ] Each entry shows date, review count, and rating
- [ ] Star icon displays with rating
- [ ] Entries are in chronological order
- [ ] Clock icon is visible in header

### 3.5 Tab Navigation
- [ ] Tapping "Teleport" tab switches to teleport view
- [ ] Tapping "Heatmap" tab switches to heatmap view
- [ ] Active tab is highlighted with underline
- [ ] Tab content switches smoothly

---

## 4. GMB Audit Screen - Teleport Tab

### 4.1 Initial Load
- [ ] Teleport tab loads without errors
- [ ] Hero section displays with location icon
- [ ] "GMB Teleport" title is visible
- [ ] Description text is clear and helpful
- [ ] Map displays with business location marker

### 4.2 Map Interaction
- [ ] Map is interactive (pan, zoom)
- [ ] Business location marker is visible (blue)
- [ ] Tapping map sets teleport location
- [ ] Teleport marker appears (red) at tapped location
- [ ] Distance circle appears around business location
- [ ] Selected location info card displays coordinates

### 4.3 Manual Coordinate Input
- [ ] Latitude input field accepts numbers
- [ ] Longitude input field accepts numbers
- [ ] Decimal keyboard appears on focus
- [ ] "Teleport" button is enabled with valid coordinates
- [ ] "Teleport" button is disabled during mutation
- [ ] Loading indicator appears during teleport

### 4.4 Coordinate Validation
- [ ] Invalid coordinates show alert
- [ ] Latitude outside -90 to 90 shows alert
- [ ] Longitude outside -180 to 180 shows alert
- [ ] Non-numeric input shows alert

### 4.5 Preset Locations
- [ ] Preset location cards display correctly
- [ ] Each preset shows name and coordinates
- [ ] Tapping a preset sets teleport location
- [ ] Map updates to show selected location
- [ ] Coordinate inputs update with preset values

### 4.6 Teleport History
- [ ] After teleporting, location appears in history
- [ ] History shows location name and coordinates
- [ ] Clock icon is visible on history items
- [ ] Tapping history item reuses that location
- [ ] History persists after page refresh
- [ ] Maximum 10 items in history (oldest removed)

### 4.7 Teleport Results
- [ ] After teleporting, results card appears
- [ ] Ranking displays with color-coded badge
- [ ] Rank label (Excellent/Good/Average/Poor) is correct
- [ ] Distance displays in km
- [ ] Visibility score displays with percentage
- [ ] Total results count displays
- [ ] Colors match ranking (green for good, red for poor)

### 4.8 Info Note
- [ ] Info note about GPS override is visible
- [ ] Note explains simulation vs real GPS override
- [ ] Note is clear and helpful

### 4.9 Error Handling
- [ ] Test teleport with no internet connection
- [ ] Error alert displays with message
- [ ] App remains functional after error
- [ ] Test with invalid coordinates
- [ ] Validation alerts display correctly

---

## 5. GMB Audit Screen - Heatmap Tab

### 5.1 Initial Load
- [ ] Heatmap tab loads without errors
- [ ] Loading indicator appears during data fetch
- [ ] Map displays after loading completes
- [ ] Business location marker is visible (blue)

### 5.2 Ranking Statistics
- [ ] Average ranking displays correctly
- [ ] Best ranking displays in green
- [ ] Worst ranking displays in red
- [ ] All stats are readable and accurate

### 5.3 Heatmap Points
- [ ] Heatmap points display on map
- [ ] Each point shows ranking number
- [ ] Point colors match ranking (green=good, red=poor)
- [ ] Points are evenly distributed in grid
- [ ] All points are interactive

### 5.4 Point Interaction
- [ ] Tapping a point opens detail modal
- [ ] Modal displays ranking details
- [ ] Modal shows coordinates
- [ ] Modal shows rank label
- [ ] Close button (X) dismisses modal
- [ ] Tapping outside modal dismisses it

### 5.5 Legend
- [ ] Legend displays ranking color scheme
- [ ] All four categories are shown:
  - [ ] 1-3 (Excellent) - Green
  - [ ] 4-7 (Good) - Yellow
  - [ ] 8-12 (Average) - Orange
  - [ ] 13-20 (Poor) - Red
- [ ] Legend is clear and readable

### 5.6 Map Controls
- [ ] Map is interactive (pan, zoom)
- [ ] Zooming in/out works smoothly
- [ ] Panning works smoothly
- [ ] Markers stay in correct positions

### 5.7 Error Handling
- [ ] Test with no internet connection
- [ ] Error message displays with icon
- [ ] Error message is helpful
- [ ] App remains functional after error

---

## 6. Saved Audits Screen

### 6.1 Initial Load
- [ ] Saved Audits tab loads without errors
- [ ] "Saved Audits" title is visible
- [ ] Subtitle displays correctly
- [ ] Loading indicator appears if data is loading

### 6.2 Empty State
- [ ] When no audits saved, empty state displays
- [ ] Bookmark icon is visible
- [ ] "No Saved Audits" message is clear
- [ ] Helpful text explains how to save audits

### 6.3 Audit Cards
- [ ] Saved audit cards display correctly
- [ ] Business name is visible
- [ ] Status badge shows current status
- [ ] Saved date displays correctly
- [ ] Category badges display
- [ ] Rating display shows stars and count
- [ ] Quick stats show categories and services
- [ ] Notes display if present

### 6.4 Status Management
- [ ] Tapping status badge opens status picker
- [ ] All status options are available:
  - [ ] Prospect
  - [ ] Contacted
  - [ ] Qualified
  - [ ] Closed
  - [ ] Lost
- [ ] Status updates immediately
- [ ] Status badge color changes appropriately
- [ ] Status persists after refresh

### 6.5 Notes Management
- [ ] "Add Note" button is visible when no notes
- [ ] "Edit Notes" button is visible when notes exist
- [ ] Tapping note button opens prompt
- [ ] Notes can be added
- [ ] Notes can be edited
- [ ] Notes display in card with quote styling
- [ ] Notes persist after refresh

### 6.6 Delete Functionality
- [ ] Delete button (trash icon) is visible
- [ ] Tapping delete shows confirmation alert
- [ ] Alert shows business name
- [ ] "Cancel" button cancels deletion
- [ ] "Delete" button removes audit
- [ ] Audit is removed from list immediately
- [ ] Deletion persists after refresh

### 6.7 Navigation
- [ ] Tapping audit card navigates to business detail
- [ ] Tapping "View Details" navigates to business detail
- [ ] Back button returns to saved audits
- [ ] Navigation is smooth and fast

---

## 7. Cross-Feature Integration

### 7.1 Search to Detail
- [ ] Search for a business
- [ ] Tap business card
- [ ] Detail screen loads with correct business
- [ ] All data matches search result

### 7.2 Detail to Save
- [ ] Open business detail
- [ ] Tap "Save" button
- [ ] Navigate to Saved Audits
- [ ] Business appears in saved list

### 7.3 Detail to Compare
- [ ] Open business detail
- [ ] Tap "Compare" button
- [ ] Navigate to Compare screen
- [ ] Business appears in comparison list

### 7.4 Home to GMB Audit
- [ ] From home, tap "Go to GMB Audit Tools"
- [ ] GMB Audit screen loads
- [ ] Audit tab is active

### 7.5 Recent Search to Results
- [ ] Tap a recent search
- [ ] Search executes
- [ ] Results display correctly

---

## 8. UI/UX Testing

### 8.1 Theme Support
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] All text is readable in both modes
- [ ] All colors are appropriate in both modes
- [ ] Theme switching works smoothly

### 8.2 Responsive Design
- [ ] Test on mobile device (small screen)
- [ ] Test on tablet (medium screen)
- [ ] Test on desktop (large screen)
- [ ] Layout adapts correctly to all sizes
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets are large enough (44px minimum)

### 8.3 Animations
- [ ] Welcome screen fade-in animation works
- [ ] Search bar scale animation works
- [ ] Business card animations work
- [ ] Stat card animations work
- [ ] Tab switching animations work
- [ ] Modal animations work
- [ ] All animations are smooth (60fps)

### 8.4 Haptic Feedback
- [ ] Haptic feedback on button taps
- [ ] Haptic feedback on search
- [ ] Haptic feedback on save
- [ ] Haptic feedback on delete
- [ ] Haptic feedback intensity is appropriate

### 8.5 Accessibility
- [ ] All buttons have appropriate labels
- [ ] All images have alt text
- [ ] Color contrast meets WCAG standards
- [ ] Text is large enough to read
- [ ] Focus states are visible

---

## 9. Performance Testing

### 9.1 Load Times
- [ ] Initial app load < 3 seconds
- [ ] Search results load < 2 seconds
- [ ] Business detail load < 2 seconds
- [ ] GMB Audit load < 2 seconds
- [ ] Heatmap load < 5 seconds

### 9.2 Smooth Scrolling
- [ ] Search results scroll smoothly
- [ ] Business detail scrolls smoothly
- [ ] Saved audits scroll smoothly
- [ ] No jank or stuttering

### 9.3 Memory Usage
- [ ] App doesn't crash after extended use
- [ ] Memory usage remains stable
- [ ] No memory leaks detected

---

## 10. Error Scenarios

### 10.1 Network Errors
- [ ] Test with airplane mode
- [ ] Test with slow network
- [ ] Test with intermittent connection
- [ ] App handles all scenarios gracefully
- [ ] Appropriate error messages display

### 10.2 API Errors
- [ ] Test with invalid API key
- [ ] Test with API rate limit
- [ ] Test with API timeout
- [ ] App falls back to mock data
- [ ] User is informed of the issue

### 10.3 Data Errors
- [ ] Test with malformed API response
- [ ] Test with missing data fields
- [ ] Test with unexpected data types
- [ ] App doesn't crash
- [ ] Appropriate error handling

---

## 11. Browser Compatibility

### 11.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 11.2 Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### 11.3 Expo Go (Mobile App)
- [ ] Android device
- [ ] iOS device

---

## 12. Known Limitations Testing

### 12.1 Post Audit Data
- [ ] Verify "Data Not Available" message displays
- [ ] Verify explanation is clear
- [ ] Verify suggestion to use Google Business Profile Manager

### 12.2 GPS Override Simulation
- [ ] Verify info note about simulation
- [ ] Verify note explains it's not real GPS override
- [ ] Verify user understands the limitation

---

## Testing Notes

### Issues Found
Record any issues discovered during testing:

1. 
2. 
3. 

### Suggestions for Improvement
Record any suggestions for improving the user experience:

1. 
2. 
3. 

### Overall Assessment
Rate each feature on a scale of 1-5 (5 = excellent):

- Home Screen: [ ] / 5
- Business Detail: [ ] / 5
- GMB Audit (Audit Tab): [ ] / 5
- GMB Audit (Teleport Tab): [ ] / 5
- GMB Audit (Heatmap Tab): [ ] / 5
- Saved Audits: [ ] / 5

**Overall Rating:** [ ] / 5

---

## Test Completion Checklist

- [ ] All tests completed
- [ ] All issues documented
- [ ] All suggestions recorded
- [ ] Overall assessment completed
- [ ] Report submitted to development team

---

**Testing Completed By:** ____________________  
**Date:** ____________________  
**Signature:** ____________________
