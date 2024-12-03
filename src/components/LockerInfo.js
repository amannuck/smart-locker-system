import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getDatabase, ref, set, get } from "firebase/database";
import Modal from "./Modal";
import LogoutButton from "./Logout";

const firebaseConfig = {
  apiKey: "AIzaSyBwaqbfPVmUX2emoiGPIr10K6fyshMr5PM",
  authDomain: "soen-422-project-d59a7.firebaseapp.com",
  databaseURL: "https://soen-422-project-d59a7-default-rtdb.firebaseio.com",
  projectId: "soen-422-project-d59a7",
  storageBucket: "soen-422-project-d59a7.firebasestorage.app",
  messagingSenderId: "1029834717215",
  appId: "1:1029834717215:web:06ba4ed70397d11690fd2a",
};
const app = initializeApp(firebaseConfig);

const LockerInfo = () => {
  const { lockerId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [sequence, setSequence] = useState(null);
  const [deviceName, setDeviceName] = useState(localStorage.getItem("device"));
  const [newDeviceName, setNewDeviceName] = useState("");
  const [reservationDate, setReservationDate] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateRandomSequence = () => {
    const pinNumbers = [21, 13, 12, 27];
    let randomSequence = [];

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * pinNumbers.length);
      const pin = pinNumbers[randomIndex];
      randomSequence.push(pin);
    }

    return randomSequence.join(",");
  };

  const updateSequence = async (thisSequence) => {
    const db = getDatabase(app);
    const codeRef = ref(db, "code");
    const newSequence = thisSequence;

    try {
      await set(codeRef, newSequence);
      handleSequenceChange(newSequence);
      setSequence(newSequence);
      console.log("Device updated successfully!");
    } catch (error) {
      console.error("Error updating device:", error);
    }
  };

  const updateDeviceName = async () => {
    const db = getDatabase(app);
    const deviceRef = ref(db, "device");

    try {
      await set(deviceRef, deviceName);
      console.log("Device updated successfully!");
    } catch (error) {
      console.error("Error updating device:", error);
    }
  };

  const fetchMaxAttempts = async () => {
    const db = getDatabase(app);
    const attemptsRef = ref(db, "maxAttempts");
    const attemptNumSnapshot = await get(attemptsRef);

    if (attemptNumSnapshot.exists()) {
      const maxAttempts = parseInt(attemptNumSnapshot.val());
      if (maxAttempts >= 3) {
        const newSequence = generateRandomSequence();
        updateSequence(newSequence);
        setShowModal(true);
        try {
          await set(attemptsRef, 0);
        } catch (error) {
          console.error("Error resetting maxAttempts:", error);
        }
      }
    }
  };

  const fetchLockerDetails = async () => {
    const username = localStorage.getItem("username");
    try {
      const response = await fetch("/api/locker-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, lockerId }),
      });

      const data = await response.json();

      if (response.ok) {
        updateSequence(data.sequence);
        setDeviceName(data.device_name);
        setReservationDate(new Date(data.reservation_date));
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Error fetching locker details:", err);
    }
  };

  useEffect(() => {
    const fetchAttemptsData = async () => {
      const db = getDatabase(app);
      const attemptsRef = ref(db, `attempts`);
      const attemptsSnapshot = await get(attemptsRef);

      if (attemptsSnapshot.exists()) {
        const attemptsData = Object.values(attemptsSnapshot.val());
        setAttempts(attemptsData);
      } else {
        setAttempts([]);
      }
    };

    const checkAlert = async () => {
      const db = getDatabase(app);
      const alertRef = ref(db, "alert");
      const alertSnap = await get(alertRef);

      if (alertSnap.exists() && alertSnap.val()) {
        setShowModal(true); // Show the alert modal
      }
    };
    fetchAttemptsData();
    checkAlert();
  }, []);

  useEffect(() => {
    fetchMaxAttempts();
  });

  useEffect(() => {
    fetchLockerDetails();
  }, []);

  useEffect(() => {
    updateDeviceName();
  }, [deviceName]);

  // Handle updating sequence
  const handleSequenceChange = async (newSequence) => {
    if (!newSequence.trim()) {
      setError("Sequence cannot be empty.");
      return;
    }

    try {
      const response = await fetch("/api/update-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("id"), // Pass the user ID
          newSequence: newSequence.trim(), // Ensure no leading/trailing spaces
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSequence(newSequence.trim()); // Update sequence state
        setSuccess("Sequence updated successfully!");
      } else {
        setError(data.message || "Failed to update the sequence.");
      }
    } catch (err) {
      console.error("Error updating sequence:", err);
      setError("An error occurred while updating the sequence.");
    }
  };

  // Handle updating device name
  const handleDeviceNameChange = async () => {
    if (!newDeviceName.trim()) {
      setError("Device name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("/api/update-device-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("id"),
          newDeviceName: newDeviceName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeviceName(newDeviceName.trim());
        setSuccess("Device name updated successfully!");
        setNewDeviceName(""); // Clear the input
      } else {
        setError(data.message || "Failed to update device name.");
      }
    } catch (err) {
      console.error("Error updating device name:", err);
      setError("An error occurred while updating the device name.");
    }
  };

  // Function to map the sequence number to its corresponding color name
  const mapSequenceToColor = (sequence) => {
    const sequenceMap = {
      21: "Red",
      13: "Green",
      27: "Blue",
      12: "White",
    };
    return sequenceMap[sequence] || "Unknown"; // Default to "Unknown" if not matched
  };

  const sequenceColors = sequence
    ? sequence
        .split(",")
        .map((seq) => mapSequenceToColor(seq.trim()))
        .join(", ")
    : "No sequence available";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-4 sm:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-4xl w-full">
        <Modal
          showModal={showModal}
          setShowModal={setShowModal}
          generatedCode={sequenceColors}
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4">
          Locker {lockerId} Information
        </h1>
        <div className="flex items-center justify-center">
          <div className="text-lg sm:text-xl text-gray-600 mb-6">
            <p>
              <strong>Target Code:</strong> <span>{sequenceColors}</span>
            </p>
            <p>
              <strong>Current Device Name:</strong>{" "}
              {deviceName || "No device name available"}
            </p>
            <p>
              <strong>Reservation Date:</strong>{" "}
              {reservationDate?.toLocaleString("en-US", {
                timeZone: "America/Toronto",
              }) || "No date available"}
            </p>
          </div>
        </div>

        <div className="text-center mb-6 mt-4">
          <p className="text-lg font-medium text-gray-700">
            Update your device name:
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="text"
              placeholder="Enter new device name"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleDeviceNameChange}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              Change Device Name
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {success && (
          <p className="text-green-600 text-center mb-4">{success}</p>
        )}

        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-4 mt-3">
            Locker {lockerId} Attempts
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg border-separate">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm sm:text-base font-semibold">
                  <th className="px-2 sm:px-4 py-2">Device</th>
                  <th className="px-2 sm:px-4 py-2">Result</th>
                  <th className="px-2 sm:px-4 py-2">Sequence</th>
                  <th className="px-2 sm:px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length > 0 ? (
                  attempts.map((attempt, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 text-gray-600">
                        {attempt.device}
                      </td>
                      <td
                        className={`px-2 sm:px-4 py-2 font-semibold ${
                          attempt.result.toLowerCase() === "success"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {attempt.result}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-gray-600">
                        {attempt.sequence}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-gray-500">
                        {attempt.timestamp}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center px-2 sm:px-4 py-4 text-gray-600"
                    >
                      No attempts data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default LockerInfo;
