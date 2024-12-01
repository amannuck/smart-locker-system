import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutButton from "./Logout";

const Lockers = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const user = state?.user;
  const [lockers, setLockers] = useState([]);
  const [deviceName, setDeviceName] = useState(user.device_name);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch lockers from the backend
    const fetchLockers = async () => {
      try {
        const response = await fetch("/api/lockers");
        const data = await response.json();

        if (response.ok) {
          setLockers(data);
        } else {
          setError(data.message || "Failed to fetch lockers.");
        }
      } catch (err) {
        console.error("Error fetching lockers:", err);
        setError("An error occurred while fetching lockers.");
      }
    };

    fetchLockers();
  }, []);

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
          userId: user.id,
          newDeviceName: newDeviceName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeviceName(newDeviceName.trim());
        setSuccess("Device name updated successfully!");
        setNewDeviceName("");
      } else {
        setError(data.message || "Failed to update device name.");
      }
    } catch (err) {
      console.error("Error updating device name:", err);
      setError("An error occurred while updating the device name.");
    }
  };

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

  const reserveLocker = async (lockerID) => {
    if (!user.username) {
      setError("You must be logged in to reserve a locker.");
      return;
    }

    const sequence = generateRandomSequence();

    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          lockerId: lockerID,
          sequence: sequence,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh lockers after reservation
        setLockers((prevLockers) =>
          prevLockers.map((locker) =>
            locker.locker_id === lockerID
              ? { ...locker, status: "Occupied" }
              : locker
          )
        );

        navigate(`/locker/${lockerID}`);
      } else {
        setError(data.message || "Failed to reserve the locker.");
      }
    } catch (err) {
      console.error("Error reserving locker:", err);
      setError("An error occurred while reserving the locker.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-8">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-5xl">
        <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center tracking-tight">
          Available Lockers
        </h2>
        <div className="mb-6 text-center">
          <p className="text-lg font-medium text-gray-700">
            This is your current device name:{" "}
            <span className="text-indigo-500 font-semibold">{deviceName}</span>
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
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Locker ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Reserve
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lockers.map((locker) => (
                <tr
                  key={locker.locker_id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {locker.locker_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {locker.locker_location}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold ${
                        locker.is_vacant
                          ? "bg-emerald-500 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {locker.is_vacant ? "Vacant" : "Occupied"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {locker.is_vacant ? (
                      <button
                        onClick={() => reserveLocker(locker.locker_id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        Reserve
                      </button>
                    ) : (
                      <span className="text-gray-500 italic">Reserved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center text-gray-500 text-sm">
          © 2024 Locker Management System
        </div>
      </div>
      <LogoutButton />
    </div>
  );
};

export default Lockers;
