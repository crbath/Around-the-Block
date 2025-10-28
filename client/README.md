# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# How to set up MongoDB

1. Accept invite for project/organization (email sent to you)

2. Go to https://www.mongodb.com/ and log in

3. In the sidebar, click “Clusters.”

4. Find the shared cluster (called around-the-block) and click “Connect.”

5. Click "Connect your application"

6. Copy the connection string and replace <password> with your DB password
- Should look like: mongodb+srv://<username>:<password>@cluster0.mongodb.net/aroundtheblock

7. Open the file: around-the-block-backend/.env

8. Replace the values with your connection details
MONGO_URI=mongodb+srv://aroundtheblock_user:myPassword@cluster0.mongodb.net/aroundtheblock
JWT_SECRET=your_shared_secret_key
PORT=5000

9. Edit the IP address in client/api/api.js to your machine's local IP address
- const BASE_URL = "http://<your-local-IP>:5000";
- Get local IP on Mac: System Preferences > Network > Select your connection > IP Address
- Get local IP on Windows: Command Prompt > ipconfig > IPv4 Address

10. Open a new terminal and navigate to the around-the-block-backend folder

11. Run node server.js to start the backend server
- You should see "Server running on port 5000" in the terminal
**You can test if the server is running properly by going to http://localhost:5000 to see a welcome message**
**If it says access denied (error 403), make sure that the AirPlay Receiver is turned off in System Preferences > Sharing (Mac)**

12. Open another terminal and navigate to the client folder

13. Run npx expo start to start the Expo development server