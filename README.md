# PlanIT

[![CodeQL Advanced](https://github.com/Rongbin99/PlanIT/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/Rongbin99/PlanIT/actions/workflows/codeql.yml)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/Rongbin99/PlanIT/main)
![GitHub Release](https://img.shields.io/github/v/release/Rongbin99/PlanIT?style=flat)

<div align="center">
    <img src="https://github.com/Rongbin99/PlanIT/blob/main/assets/images/planit_logo.png" alt="PlanIT Logo" width="128" height="128"/>
</div>

PlanIT is your intelligent trip planner for creating seamless, unforgettable day-long adventures — whether you’re exploring your hometown or discovering a new city abroad. The app curates ready-made itineraries with a balanced mix of attractions, luxury or local dining, experiences, and dessert or coffee stops, all optimized for walkability and transit.

Key Features:

- 🎯 Curated day trips in major cities across the globe
- 🍽️ Fine dining, local gems, or food tours based on your preferences
- 🏛️ Afternoon activities like museums, parks, shopping, or cultural spots
- 🍰 Unique cafés, bakeries, or dessert lounges to end your day sweetly
- 🚇 Real-time directions with transit, walk, and rideshare options
- 🌍 Works in 100+ cities worldwide with localized suggestions
- 🤖 Smart suggestions based on location, weather, crowd trends, and user ratings
- 🗺️ Integrated with Google Maps for smooth navigation

Whether you're on vacation or just rediscovering your city, PlanIT helps you make the most of every moment with zero planning stress.

> [!NOTE]
> **Backend API**: The server-side API powering PlanIT is available at [PlanIT-API Repository](https://github.com/Rongbin99/PlanIT-API). See the API documentation for setup instructions and endpoint details.

## Preview

### Demo Video



### Android Screenshots

| ![Home Screenshot Android](https://github.com/Rongbin99/PlanIT/blob/main/assets/readme/Screenshot_1754568740.png) | ![Options Dropdown Screenshot Android](https://github.com/Rongbin99/PlanIT/blob/main/assets/readme/Screenshot_1754568745.png) | ![History Screenshot Android](https://github.com/Rongbin99/PlanIT/blob/main/assets/readme/Screenshot_1754568751.png) |
| ---- | ---- | ---- |

### iOS Screenshots

| img1 | img2 | img3 |
| ---- | ---- | ---- |

## Instructions to Run

Clone this Git repository to your local machine.

```
git clone https://github.com/Rongbin99/PlanIT
```

Change directory to this project.

```
cd PlanIT
```

If not on the main branch, switch to this branch which contains the codebase for the mobile-based project.

```
git checkout main
```

Install the node dependencies.

```
npm install
```

If needed, modify the Backend URL in `ApiConfig.ts` for your local setup (default to automatically detect iOS and Android)

```ts
/*
 * Choose the appropriate URL based on your testing setup:
 * - iOS Simulator: use localhost:3000 
 * - Android Emulator: use 10.0.2.2:3000 (maps to host machine's localhost)
 * - Physical Device: use your network IP (e.g., 192.168.X.X:3000)
 * - Production: use the API URL (e.g., AWS EC2 URL or GCP/Azure) <-- COMING SOON
 */

export const BACKEND_URL =
```

Finally, run the server on your local machine.

```ts
// for Android
npm run android

// for iOS
npm run ios
```

## Contact

For inquiries, feel free to reach out to me on Discord ([my Discord server link](discord.gg/3ExWbX2AXf)) or via email gu.rongbin99@gmail.com. *(serious inquiries only please)*

## Contributing

Contributions are welcome and encouraged! Please fork the repository and create a new pull request for review and approval by a Codeowner.
