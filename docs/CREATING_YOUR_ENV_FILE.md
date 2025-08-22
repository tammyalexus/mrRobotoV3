# Creating your .env file

1. Create a new file in the project root folder called `.env`
2. Copy/Paste the contents of `.env_example` into that file
3. Find your Hang.fm user token. You will need this once in order to register a Bot with Hang.fm
   
   Every user can have one, and only one, Bot registered to them.

   Log into Hang.fm as your personal user and open the Developer Tools
   * Chrome: https://developer.chrome.com/docs/devtools/storage/localstorage
   * Firefox: https://firefox-source-docs.mozilla.org/devtools-user/storage_inspector/
   * Safari: https://developer.apple.com/documentation/safari-developer-tools/enabling-developer-features

   Next open storage and look for `Local Storage`
   
   Finally, within Local Storage look for a key called "token-storage" and copy its value. This is your personal user-token for Hang.fm. You MUST remove the double quotes around the token to be able to use it. This value will let others use the Hang.fm website as you so DO NOT SHARE IT WITH ANYONE

4. Now that you have your user-token you can register a Bot with Hang.fm and get its token to add to the .env file

   * Head to: https://gateway.prod.tt.fm/api/user-service/api/#/Bot%20endpoints/signUpBot

   * You should the following
   ![Screenshot showing the /user/sign-up-bot Swagger page](/docs/assets/sign-up-bot.png "/user/sign-up-bot Screenshot")

   * Click the light grey padlock on the right side of that screen and you will see an `Available authorizations` window pop open
   ![Screenshot showing the 'Available authorizations' window](/docs/assets/available-authorizations.png "/user/Available authorizations Screenshot")

   * Paste your user-token (remembering to have stripped off the quotes from both ends if necessary) into the value box and click Authorize

   * The Authorize button will change to say 'Logout'. You can now click the small X in the top right of that window to close it. When you return to the sign-up-bot screen you should see that the light grey open padlock on the top right is now locked and a solid black colour. This means you are successfully authorised

   * Click the button immediatly underneath the padlock titled 'Try it out'. This will open a text box entitled 'Request body'. This is where you need to enter the details for your Bot

      ```json
      {
      "botNickName": "string",
      "avatarId": "string",
      "color": "string"
      }
      ```

   * Replace the 3 instances of string, leaving the quotes in place
      * botNickName: what you want your Bot to be called
      * avatarId: this can be either bot-1 or bot-2. Both are grey robot avatars. bot-1 has blue eyes and detailing, bot-2 has green eyes and orange detailing
      * color: this si the colour you want your Bot's name to appear as in the chat. The colour value needs to be a hex representation of a colour, without the leading `#` character, eg "ff9900" for orange. Look here if you need help finding a colour: https://www.w3schools.com/colors/colors_picker.asp

   * You should also update the 'Basic Bot details' section of your .env file with this info

   * The request body should end up looking something like,
      ```json
      {
      "botNickName": "Mr HangBot",
      "avatarId": "bot-1",
      "color": "00ccff"
      }
      ```
   * Once you've filled that in, click the large blue 'Execute' button

   * You should see a brief 'Loading' mesage followed by a response that will include the curl message sent and below that the server response with a 201 code. Congratulation, you've registered your Bot!

   * Now that it's registered we can get the Bot's user-token!

   * Head to: https://gateway.prod.tt.fm/api/user-service/api/#/Bot%20endpoints/getBotToken
   ![Screenshot showing /users/bot-token](/docs/assets/bot-token.png "/users/bot-token Screenshot")

   * if the padlock is light gray and open, repeat the process from above to authorise yourself so that the padlock is closed and solid black

   * Click the 'Try it out' button underneath the paclock followed by clicking the blue 'Execute' button

   * After a breif 'Loading' message you will see the 'curl' message sent by the server and below that the 'Response body'. This includes an 'accessToken', eg.
      ```json
      {
      "accessToken": "eyJhbGciOiKGJhKJVHJKHVvhjkhjvVJHcCI6IkpXVCJ9.eyJpZCI6MzE2MjA5Miwic3ViIjoiNTQ1OTQ0MjItNWE5MC00N2E4LTk4MjQtYWY1YWRkMjE2Mzc0Iiwicm9sZSI6ImJvdCIsImNhcGFiaWxpdGllcyI6W10sInR5cGUiOiJ1c2VyIiwiaWF0IjoxNzU1ODYwNzg4LCJleHAiOjIwNzEyMjA3ODgsImlzcyI6InR1cm50YWJsZS11c2VyLXNlcnZpY2UifQ.0aZD0_LIyd3eCif6zlqX2stPjkvKJVJVHJVHJVKHjvhVHVHvVvVvvVKjkvvyuCTckVJVvw5M_74kp4zscwfj00vruIQ_-tocZ10klVFylQo0KH3fxo1xPxspL92op0MPY5a3vx4ZZoKYZabJ-2NCr73hD3GEAuXThZlaigkCJXfO_7SqVjFFc_oRsQ5EfFSBKmq-vbzU0F_dQsGjl,jvJHKVjJVKjvvjjvkjvhhjvvjhjhvjvvjhjvhvjhkjvhkvjkvvjhJhvVHJJVKHvGIv20myR3vH5Cpg8c7NDIFpg2HhsFoFIb-It-r10K9hRCv1WsmZKw44jAWqSIuEYxcGyNRNKHBZATcG0m04P3znED9YCSNKtAQEMTPSI7ymek61YrQ_FEzS4KyVth-tRXpxSAKjC53T2eickbR-hfhOltLoIIVrcYY7-orbK5u2kQPWmbA1a02XErwiAqjYzSSB7_p7Te2ev93d1pfCq11XonqoGAknvmXbOcb-hK54k8Vy7Z8jc7-yA5g31Zn5AqomZFYipv4NWxNSvIK50ckV6YgZiso",
      "codeSyncNewUser": "123456"
      }
      ```
   * Copy the value field next to 'accessToken', once again removing the double-quotes from either end and paste it into your .env file replacing 'paste-your-bot-token-here'

   * You should probably have a cup of tea now! ;-)

5. Next we're going to use the Bot token to get the COMETCHAT_AUTH_TOKEN to add to the .env file
   * Head to: https://gateway.prod.tt.fm/api/user-service/api/#/CometChat/getUserCometChatAuthToken
   * as above, click the light gray padlock and authosire yourself, but this time **use the Bot's token** rather than your personal one. If the padlock is already closed, click it and then click 'Logout' on the popup that appears
   * Click the 'Try it out' button underneath the padlock, and then the blue 'Execute' button. You should see a response returned containing a value for cometAuthToken
      ```json
      {
      "cometAuthToken": "asdaad-asd-45f7-asd-c3756a8c4a84_17186129asdasdasdasdcd717e3646f8b"
      }
      ```
   * Copy the value from this response, without the quotes, and paste it into your .env file replacing 'paste-your-comet-chat-auth-token-here'


6. Next up we need the Bot's UserID on the Hang.fm site. Head to: https://gateway.prod.tt.fm/api/user-service/api/#/User%20profile/getProfile
   * As before, authenticate using the padlock on the right side and the Bot Token
   * Click 'Try it out' and then 'Execute'
   * The Response body will contain all the details about the Bot User including, towards the bottom, the uuid (Universally unique identifier)
   * Copy the value for the uuid and paste it into the .env file replacing paste-your-bot-uuid-here

7. Next we need to tell the Bot which Hangout it should appear in
   * Firstly log onto Hang.fm and go to the hangout you want the bot to appear in. Copy the URL of the hangout
   * For the next step you need the 'slug' of the Hangout. It's the last part of the URL, eg. for https://hang.fm/da/i-love-the-80s the slug would be i-love-the-80s
   * Head to: https://gateway.prod.tt.fm/api/room-service/api/#/Rooms%20data/getRoom
   * As before, authotise yourself using the padlock on the right side and yout Bot's token and click 'Try it out'
   * You will see a text box entitled slug. Paste the slug from your Hangout into that box and click 'Execute'
   * The response here is quite large and can include data about songs plaued, users from the Hangout and pinned chat messages. Once again you're looking for the uuid value, eg.
      ```json
      "isLive": false,
      "posterUrl": "https://events.prod.tt.fm/room_covers/i-love-the-80s-1755750134292.gif",
      "discordServer": null,
      "externalUrl": "https://80s-c473bb.webflow.io/",
      "uuid": "fc0c1a01-83d6-49ad-9050-4379431a015e",
      "explicit": true,
      "positionPriority": 0,
      "genres": [
         "Rock",
         "Alternative",
         "1980s"
      ], 
      ```
   * Copy the uuid value and paste it into your .env file replacing paste-hangout-uuid-here

8. Finally, you need to decide how the bot will identify commands. The Bot will ignore everything in chat and Private messages unless it starts with this character
   * eg. hello would be ignored, but if you pick '/' as youd command switch then /hello would send a command to the Bot
   * the characters / or ! are typically used but you can choose anything that suits your Hangout
---