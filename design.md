# GMB Everywhere Mobile - Design Specification

## Overview
A mobile application for Android that replicates the core local SEO audit features of the GMB Everywhere Chrome extension. The app enables users to search for businesses, analyze their Google Business Profile categories, review competitor data, and perform basic SEO audits—all from their mobile device.

## Screen List

| Screen | Purpose |
|--------|---------|
| **Home** | Main dashboard with search input and quick access to recent searches |
| **Search Results** | Display list of businesses matching the search query |
| **Business Detail** | Show comprehensive business profile with categories, ratings, and audit options |
| **Category Analysis** | Display primary and secondary categories with related category suggestions |
| **Review Audit** | Analyze reviews with rating trends, keyword analysis, and filtering |
| **Competitor Comparison** | Side-by-side comparison of multiple businesses |
| **Saved Audits** | List of previously saved business audits for quick reference |
| **Settings** | App preferences and configuration |

## Primary Content and Functionality

### Home Screen
The home screen serves as the central hub with a prominent search bar at the top. Below the search, users see their recent searches displayed as tappable cards. A bottom navigation bar provides access to Home, Saved Audits, and Settings tabs.

### Search Results Screen
After searching, results appear as a scrollable list of business cards. Each card displays the business name, primary category, star rating, and review count. Tapping a card navigates to the Business Detail screen.

### Business Detail Screen
This screen presents comprehensive business information organized into sections. The header shows the business name, address, and overall rating. Below, action buttons allow users to access Category Analysis, Review Audit, or add to Competitor Comparison. Key metrics like total reviews, rating distribution, and category information are displayed in card format.

### Category Analysis Screen
Displays the business's primary category prominently, followed by a list of secondary categories. A "Related Categories" section suggests additional categories based on the business type. Each category shows estimated traffic potential using a simple indicator system.

### Review Audit Screen
Presents review analytics through visual charts showing rating trends over time. A keyword cloud highlights frequently mentioned terms in reviews. Users can filter reviews by rating, date range, or keywords. Individual reviews are displayed in a scrollable list with sentiment indicators.

### Competitor Comparison Screen
Allows users to select up to 4 businesses for side-by-side comparison. Comparison metrics include categories, review count, average rating, and key attributes. Data is presented in a horizontally scrollable table format optimized for mobile viewing.

### Saved Audits Screen
Lists all previously saved business audits as cards. Each card shows the business name, save date, and a quick summary. Users can tap to view full details or swipe to delete.

### Settings Screen
Contains app preferences including theme selection (light/dark), data cache management, and about information.

## Key User Flows

### Business Search and Audit Flow
1. User opens app → Home screen with search bar
2. User enters business name or type → Search Results screen
3. User taps a business → Business Detail screen
4. User taps "Category Analysis" → Category Analysis screen
5. User reviews categories and suggestions
6. User taps "Save Audit" → Audit saved to local storage

### Competitor Comparison Flow
1. User searches for first business → Business Detail screen
2. User taps "Add to Compare" → Business added to comparison list
3. User searches for additional businesses and adds them
4. User navigates to Competitor Comparison screen
5. User views side-by-side metrics
6. User can export or save comparison

### Review Analysis Flow
1. User navigates to Business Detail screen
2. User taps "Review Audit" → Review Audit screen
3. User views rating trends chart
4. User filters reviews by rating or keyword
5. User identifies common themes in reviews

## Color Choices

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary (Terracotta)** | #C4704B | Primary buttons, active tab indicators, accent elements |
| **Primary Dark** | #A85A3A | Button pressed states, headers |
| **Background** | #FDF8F5 | Main app background (warm off-white) |
| **Surface** | #FFFFFF | Cards, elevated surfaces |
| **Text Primary** | #1A1A1A | Headings, primary text |
| **Text Secondary** | #666666 | Descriptions, secondary information |
| **Text Disabled** | #AAAAAA | Placeholder text, disabled elements |
| **Success** | #34A853 | Positive indicators, high ratings |
| **Warning** | #FBBC04 | Medium ratings, caution states |
| **Error** | #EA4335 | Low ratings, error states |

The color palette is inspired by GMB Everywhere's warm terracotta branding, creating a professional yet approachable feel suitable for SEO professionals.

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Title | 28px | Bold | Screen titles |
| Subtitle | 20px | SemiBold | Section headers |
| Body | 16px | Regular | Primary content |
| Body Bold | 16px | SemiBold | Emphasized content |
| Caption | 14px | Regular | Secondary information |
| Small | 12px | Regular | Labels, timestamps |

## Spacing and Layout

The app follows an 8pt grid system with consistent spacing increments of 8, 12, 16, 24, and 32 pixels. Cards use 16px internal padding with 12px border radius. Touch targets maintain a minimum size of 44pt for accessibility.

## Navigation Structure

The app uses a bottom tab bar with three primary destinations: Home, Saved, and Settings. Secondary navigation uses stack-based navigation within each tab, with a back button in the header for returning to previous screens.

## Component Specifications

### Business Card
A rectangular card displaying business information with rounded corners (12px radius). Contains business name (subtitle weight), primary category badge, star rating with review count, and a subtle shadow for elevation.

### Category Badge
A pill-shaped component with the terracotta background for primary categories and a lighter tint for secondary categories. Text is white for primary and terracotta for secondary.

### Rating Display
Horizontal star icons (filled/empty) with numeric rating and review count. Uses the success/warning/error colors based on rating value (4.0+ green, 3.0-3.9 yellow, below 3.0 red).

### Action Button
Full-width buttons with 12px border radius, 48px height, and centered text. Primary buttons use terracotta background with white text; secondary buttons use white background with terracotta border and text.
