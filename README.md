# PlanIT Web

This branch contains the web version of GoMommy. Due to the nature of React Native and `react-native-maps`, to avoid conflict with native-only components being imported when executing the web version, this branch contains only the web codebase and uses `teovilla/react-native-web-maps` [docs here](https://github.com/teovillanueva/react-native-web-maps) instead.

[![Web CodeQL Advanced](https://github.com/Rongbin99/PlanIT/actions/workflows/codeql.yml/badge.svg?branch=main-web)](https://github.com/Rongbin99/PlanIT/actions/workflows/codeql.yml)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/Rongbin99/PlanIT/main-web)
![GitHub Release](https://img.shields.io/github/v/release/Rongbin99/PlanIT?style=flat)

## Instructions to Run

Clone this Git repository to your local machine.

```
git clone https://github.com/Rongbin99/PlanIT
```

Change directory to this project.

```
cd PlanIT
```

Switch to this branch which contains the codebase for the web-based project.

```
git checkout main-web
```

Install the node dependencies.

```
npm install
```

Finally, run the server on your local machine.

```
npm run web
```

## Contact

For inquiries, feel free to reach out to me on Discord ([my Discord server link](discord.gg/3ExWbX2AXf)) or via email gu.rongbin99@gmail.com. *(serious inquires only pls)*

## Contributing

Contributions are welcome and encouraged! Please fork the repository and create a new pull request for review and approval by a Codeowner.
