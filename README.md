# GoMommy Web

This branch contains the web version of GoMommy. Due to the nature of React Native and `react-native-maps`, to avoid conflict with native-only components being imported when executing the web version, this branch contains only the web codebase and uses `teovilla/react-native-web-maps` [docs here](https://github.com/teovillanueva/react-native-web-maps) instead.

[![Web CodeQL Advanced](https://github.com/Rongbin99/GoMommy/actions/workflows/codeql.yml/badge.svg?branch=main-web)](https://github.com/Rongbin99/GoMommy/actions/workflows/codeql.yml)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/Rongbin99/GoMommy/main-web)
![GitHub Release](https://img.shields.io/github/v/release/Rongbin99/GoMommy?style=flat)

## Instructions to Run

Clone this Git repository to your local machine.

```
git clone https://github.com/Rongbin99/GoMommy
```

Switch to this branch that contains the codebase for the backend server.

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
