import cv2
import numpy as np

# Define the dimensions of the chessboard
chessboard_size = (9, 6)

criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

objp = np.zeros((6*9,3), np.float32)
objp[:,:2] = np.mgrid[0:9,0:6].T.reshape(-1,2)

objpoints = [] # 3d points in real world space
imgpoints = [] # 2d points in image plane.

while True:
    # Create a VideoCapture object to open the webcam
    cap = cv2.VideoCapture(0)
    # Read the current frame from the webcam
    ret, frame = cap.read()
    # release the VideoCapture object
    cap.release()

    # Convert the frame to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Find chessboard corners
    ret, corners = cv2.findChessboardCorners(gray, chessboard_size, None)

    # Draw chessboard corners on the frame
    if ret:
        objpoints.append(objp)
        corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
        imgpoints.append(corners2)
        print("\rTotal number of samples appended:", len(imgpoints), end=" ")
        cv2.drawChessboardCorners(frame, chessboard_size, corners2, ret)

        # corners2 = corners2.reshape(corners2.shape[0],corners2.shape[2]) # Reshape corners2 to 2D array
        # Calculate the camera calibration variables
        ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)
        
        # Create a new camera matrix
        img = cv2.imread('940nmIRcameraCalib.jpg')
        with open('camera_matrix.csv', 'a') as file:
            np.savetxt(file, mtx.reshape(1, -1), delimiter=',')
        with open('dist.csv', 'a') as file:
            np.savetxt(file, dist, delimiter=',')
        with open('rvecs.csv', 'a') as file:
            np.savetxt(file, rvecs[0].reshape(1, -1), delimiter=',')
        with open('tvecs.csv', 'a') as file:
            np.savetxt(file, tvecs[0].reshape(1, -1), delimiter=',')

        # Create a new undistorted image
        dst = cv2.undistort(img, mtx, dist, None, None)
        cv2.imshow('Undistorted', dst)

    # Display the frame
    cv2.imshow('Original', frame)

    # Break the loop if 'q' is pressed
    if cv2.waitKey(1000) & 0xFF == ord('q'):
        break

# Release the VideoCapture object and close the window
cap.release()
cv2.destroyAllWindows()