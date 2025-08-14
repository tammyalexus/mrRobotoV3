# mrRobotoV3 🤖

Version 3 of Mr. Roboto — rebuilt from scratch rather than being repurposed from an existing Bot

---

## License

[![No Commercial Use](https://img.shields.io/badge/No%20Commercial%20Use-orange?style=for-the-badge&logo=hand)](LICENSE)
[![Attribution Required](https://img.shields.io/badge/Attribution%20Required-black?style=for-the-badge&logo=book)](LICENSE)

This repository is licensed under the **NonCommercial–Attribution License (NC-ATTR)**.
- **NonCommercial use only** – You may not use this project for commercial purposes.
- **Attribution required** – You must credit the original author in any forks, copies, or redistributions.
- See the [LICENSE](LICENSE) file for full details.

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

## Developing for Hangout FM

In order to receive actions from the site your Bot will need to connect to the Turntable LIVE Socket Client here: 
https://www.npmjs.com/package/ttfm-socket

There are then multiple API endpoints you can send REST messages to. These include 

* The User Service: https://gateway.prod.tt.fm/api/user-service/api/
* The Room Service: https://gateway.prod.tt.fm/api/room-service/api/
* The Social Service: https://gateway.prod.tt.fm/api/social-service/api/
* The Playlist Service: https://gateway.prod.tt.fm/api/playlist-service/api/

You'll need to use some of these services to get the basic info to be able to start a Bot

To create a new Bot and get a token for it, head to the BotSignup endpoint here: https://gateway.prod.tt.fm/api/user-service/api/#/Bot%20endpoints/signUpBot

However, in order to use that you need to be authorised so will need to get your own auth token. You can find this using your browser's developer tools to look in the browser storage. Once you're logged into hang.fm look for a key called "token-storage" and copy its value. You MUST remove the double quotes around the token to be able to use it. You can then paste that into the authentication at the top of any Swagger page, or once you have it, use the Bots token instead.

Now you have the Bot token from the signUpBot endpoint, deauthorise yourself on that swagger page, and head to:
https://gateway.prod.tt.fm/api/user-service/api/#/CometChat/getUserCometChatAuthToken

Authorise yourself (click the padlock on the right side) using the Bot token and execute to get the "cometAuthToken". Add that to your .env file as "COMETCHAT_APP_ID"

Next head to: https://gateway.prod.tt.fm/api/user-service/api/#/Bot%20endpoints/getBotToken and execute, using the Bot token again, to get the Hang token and add it to the .env file as BOT_USER_TOKEN

**DO NOT SHARE ANY OF THESE IDs OR CHECK THEM INTO GIT. If you do other people will be able to login as your Bot**

For the bot's avatar, you'll want to use the bot token to update the bot's profile via https://gateway.prod.tt.fm/api/user-service/api/#/User%20profile/updateProfile. 

There are two special bot avatars. Their IDs are bot-01 and bot-2. Set one of those on the Bot profile and also use it as the CHAT_AVATAR_ID

The CHAT_API_KEY for Hangout.fm is 193427bb5702bab7. Hangout uses CometChat and that ID is actually yhe Hangout App ID for them. The REST API for CometChat is available here: https://api-explorer.cometchat.com/reference/chat-apis