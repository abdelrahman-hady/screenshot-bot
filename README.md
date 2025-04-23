## Prerequisites

### 1. Install Node.js and npm on macOS

If you don't have Node.js and npm installed, you can install them using Homebrew:

```bash
brew install node
```

For more details, visit the official Node.js website: https://nodejs.org/

### 2. Clone the repository

Use the following command to clone this repository:

```bash
git clone https://github.com/abdelrahman-hady/screenshot-bot.git
cd screenshot-bot
```

---

## Installation

1. Navigate to the project directory.
2. Install dependencies using npm:

```bash
npm install
```

## Usage

1. Before running the script, add your list of URLs (one per line) to the `urls.txt` file in the project directory.
2. Run the screenshot script with:

```bash
npm start
```

This will execute `screenshot.js` and process the URLs listed in `urls.txt`. Screenshots will be saved in the `screenshots` directory.

---