# mrRobotoV3 🤖

Version 3 of Mr. Roboto — rebuilt from scratch rather than being repurposed from an existing Bot

---

## 🛠️ Prerequisites

- **Node.js** v16+ (tested on v20)
- **npm** v8+ (installed with Node)
- A CometChat application or developer account (to get required API details)

---

## 🚀 Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jodrell2000/mrRobotoV3.git
   cd mrRobotoV3
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root to configure your bot:
   ```env
   COMETCHAT_API_KEY=your_cometchat_api_key
   COMETCHAT_APP_ID=your_cometchat_app_id
   BOT_UID={the UUID of your Bot}
   COMETCHAT_RECEIVER_UID={the UUID of test user}
   HANGOUT_ID={the UUID of your Hangout}
   CHAT_AVATAR_ID={the Hangout avatar ID for your Bot
   CHAT_NAME={the name of your Bot}
   CHAT_COLOUR=AABBCC   # hex without “#”
   ```

---

## ✅ Running the App

To start the bot:

```bash
npm start
```

This executes:

```bash
node src/index.js
```

## 🧪 Running Tests

Your test suite covers:

- ✅ Successful sending/fetching of private & group messages
- ✅ Error handling and fallback message conditions

To run tests:

```bash
npm test
```

Test results summary and coverage (if you run with `--coverage`) will be shown.

---

## 🤝 Feedback & Contributions

All welcome! Whether it's fixing an issue, suggesting improvements, or helping with features, feel free to open a PR or issue.

---
