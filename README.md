# GMB Audit - Local SEO Audit Mobile App

A React Native mobile application that replicates the core features of the GMB Everywhere Chrome extension, allowing users to perform comprehensive local SEO audits on Google Business Profile listings.

## Features

- **Business Search** - Search for any business by name, category, or service
- **Category Analysis** - Analyze primary and secondary categories with suggested additions
- **Review Audit** - Analyze reviews with rating distribution and keyword extraction
- **Competitor Comparison** - Compare up to 4 businesses side-by-side
- **Saved Audits** - Save and revisit previous business audits
- **Local Storage** - All data stored locally on device for privacy

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Animations**: React Native Reanimated
- **State Management**: React Hooks + AsyncStorage
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Expo Go app (for testing on mobile device)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yjones-coder/gmb-everywhere-mobile.git
   cd gmb-everywhere-mobile
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm start
   ```

4. **Run on your device**:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

### Environment Setup

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys** (if integrating real data):
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
   ```

3. **Never commit `.env` files** - they are in `.gitignore`

## Project Structure

```
gmb-everywhere-mobile/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx            # Home/Search screen
│   │   ├── saved.tsx            # Saved audits
│   │   └── settings.tsx         # Settings
│   ├── business/                # Business detail screens
│   │   ├── [id].tsx             # Business detail
│   │   ├── categories.tsx       # Category analysis
│   │   ├── reviews.tsx          # Review audit
│   │   └── compare.tsx          # Competitor comparison
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── themed-text.tsx          # Themed text component
│   ├── themed-view.tsx          # Themed view component
│   └── ui/                      # UI components
│       ├── business-card.tsx    # Business card
│       ├── score-ring.tsx       # Animated rating ring
│       ├── skeleton.tsx         # Loading skeleton
│       └── stat-card.tsx        # Stat card with animation
├── constants/                    # App constants
│   └── theme.ts                 # Colors and typography
├── hooks/                        # Custom React hooks
│   ├── use-local-storage.ts     # Local storage management
│   └── use-color-scheme.ts      # Theme color hook
├── data/                         # Mock and sample data
│   └── mock-businesses.ts       # Mock business data
└── __tests__/                    # Test files
    └── mock-businesses.test.ts  # Business data tests
```

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test mock-businesses.test.ts
```

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build locally
pnpm prebuild
```

## Security

This project follows security best practices:

- **No Sensitive Data in Code** - API keys and credentials are excluded via `.gitignore`
- **Environment Variables** - Sensitive values stored in `.env` (not committed)
- **Mock Data** - Demo data is fictional and safe to share
- **Local Storage** - User data stored locally, never sent to servers

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## Features in Development

- [ ] Real Google Places API integration
- [ ] Location-based business search
- [ ] Export audit reports as PDF
- [ ] Share comparison results
- [ ] Cloud sync (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Roadmap

### Phase 1: Core Features ✅
- Business search with mock data
- Category analysis
- Review audit
- Competitor comparison
- Saved audits

### Phase 2: Real Data Integration
- Google Places API integration
- Live business search
- Real review data
- Location-based search

### Phase 3: Advanced Features
- PDF export
- Sharing capabilities
- Cloud sync
- Advanced analytics

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Inspired by [GMB Everywhere](https://www.gmbeverywhere.com/)
- Icons from [Material Icons](https://fonts.google.com/icons)
