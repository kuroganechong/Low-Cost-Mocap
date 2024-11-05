import cv2
import numpy as np

# Load camera matrix and distortion coefficients
camera_matrix = np.array([[664.890534731518, 0.0, 302.9338502273855], [0.0, 666.5403901968377, 224.18774783379098], [0.0, 0.0, 1.0]]).reshape(3, 3)

dist_coeffs = np.array([0.08326841087011033, -0.2904054172997265, -0.0035338502486490786, -0.019334802746961057, 1.4882745371155794])

# Create video capture object
cap = cv2.VideoCapture(0)  # Replace 0 with the camera index if using multiple cameras

while True:
    # Read frame from video stream
    ret, frame = cap.read()

    if not ret:
        break

    # Undistort frame
    undistorted_frame = cv2.undistort(frame, camera_matrix, dist_coeffs)

    # Display the undistorted frame
    cv2.imshow('Undistorted Frame', undistorted_frame)

    # Break the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release video capture object and close windows
cap.release()
cv2.destroyAllWindows()