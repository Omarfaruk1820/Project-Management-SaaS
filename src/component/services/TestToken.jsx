import auth from "../auth/firebase.config.js";

const TestToken = () => {
  const handleGetToken = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.log("Please log in first.");
        return;
      }

      const token = await user.getIdToken();

      console.log("Firebase ID Token:", token);
    } catch (error) {
      console.error("Failed to get token:", error);
    }
  };

  return <button onClick={handleGetToken}>Test Firebase Token</button>;
};

export default TestToken;
