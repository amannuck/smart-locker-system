import { useEffect, useState } from "react";

function Modal({ showModal, setShowModal, generatedCode }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (showModal && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [showModal, countdown]);

  return (
    showModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Maximum Attempts Reached
          </h2>
          <p className="text-gray-600 mb-4">
            You have reached the maximum number of attempts. For security
            reasons, a new code has been generated.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-gray-700">
              <strong>New Security Code:</strong>
            </p>
            <p className="text-gray-800 text-lg font-mono mt-2">
              {generatedCode}
            </p>
          </div>
          <p className="text-gray-600 mb-4">
            Please wait <strong>{countdown} seconds</strong> before you can
            proceed.
          </p>
          <div className="flex justify-end">
            <button
              className={`px-4 py-2 rounded-lg ${
                countdown === 0
                  ? "bg-blue-500 text-white"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
              onClick={() => setShowModal(false)}
              disabled={countdown > 0}
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default Modal;
